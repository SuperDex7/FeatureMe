package Feat.FeatureMe.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import com.apple.itunes.storekit.model.Data;
import com.apple.itunes.storekit.model.Environment;
import com.apple.itunes.storekit.model.JWSTransactionDecodedPayload;
import com.apple.itunes.storekit.model.NotificationTypeV2;
import com.apple.itunes.storekit.model.ResponseBodyV2DecodedPayload;
import com.apple.itunes.storekit.model.Subtype;
import com.apple.itunes.storekit.verification.SignedDataVerifier;
import com.apple.itunes.storekit.verification.VerificationException;
import com.apple.itunes.storekit.verification.VerificationStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import Feat.FeatureMe.Entity.User;

import static Feat.FeatureMe.Service.SubscriptionAccess.Access.GRANT;
import static Feat.FeatureMe.Service.SubscriptionAccess.Access.KEEP;
import static Feat.FeatureMe.Service.SubscriptionAccess.Access.REMOVE;

/**
 * Plus subscriptions bought through the App Store.
 *
 * App Store Server Notifications (v2) are only trusted after Apple's official
 * library has verified them: the certificate chain up to Apple Root CA - G3
 * (bundled in resources/apple), the signature, and that they're for this app
 * (bundle id + App Store app id). The transaction inside is verified the same way.
 *
 * Updates change only the subscription fields, and a notification older than
 * the newest one already applied to that account is ignored (Apple can deliver
 * them late or out of order).
 */
@Service
public class AppleSubscriptionService {

    public enum Outcome { APPLIED, IGNORED, REJECTED }

    public record Result(Outcome outcome, String message) {}

    /** Apple's certificate checks couldn't run right now (e.g. revocation check offline); Apple will retry */
    public static class RetryLaterException extends Exception {
        RetryLaterException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    /** What a notification does to the account: the App Store status, and whether Plus is given, taken or left */
    record Change(SubscriptionAccess.Access access, String status) {}

    private static final String ROOT_CERT = "apple/AppleRootCA-G3.cer";

    private final MongoTemplate mongoTemplate;
    private final SubscriptionAccess subscriptionAccess;
    private final List<SignedDataVerifier> verifiers;
    private final Set<String> plusProductIds;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /** The App Store products that are FeatureMe Plus */
    static final Set<String> DEFAULT_PLUS_PRODUCTS = Set.of("com.featureme.app.plus.monthly", "com.featureme.app.plus.yearly");

    @Autowired
    public AppleSubscriptionService(
            MongoTemplate mongoTemplate,
            SubscriptionAccess subscriptionAccess,
            @Value("${apple.bundle-id:com.featureme.app}") String bundleId,
            @Value("${apple.app-apple-id:6754936268}") Long appAppleId,
            @Value("${apple.online-checks:true}") boolean onlineChecks) throws IOException {
        this(mongoTemplate, subscriptionAccess, readRootCertificate(), bundleId, appAppleId, onlineChecks);
    }

    AppleSubscriptionService(MongoTemplate mongoTemplate, SubscriptionAccess subscriptionAccess, byte[] rootCertificate,
            String bundleId, Long appAppleId, boolean onlineChecks) {
        this.mongoTemplate = mongoTemplate;
        this.subscriptionAccess = subscriptionAccess;
        this.plusProductIds = DEFAULT_PLUS_PRODUCTS;
        // Production first; App Review and TestFlight purchases come from the sandbox
        this.verifiers = List.of(
            verifier(rootCertificate, bundleId, appAppleId, Environment.PRODUCTION, onlineChecks),
            verifier(rootCertificate, bundleId, appAppleId, Environment.SANDBOX, onlineChecks));
    }

    private static SignedDataVerifier verifier(byte[] root, String bundleId, Long appAppleId,
            Environment environment, boolean onlineChecks) {
        Set<InputStream> roots = Set.of(new ByteArrayInputStream(root));
        return new SignedDataVerifier(roots, bundleId, appAppleId, environment, onlineChecks);
    }

    private static byte[] readRootCertificate() throws IOException {
        try (InputStream in = new ClassPathResource(ROOT_CERT).getInputStream()) {
            return in.readAllBytes();
        }
    }

    // ------------------------------------------------------------------
    // Server notifications
    // ------------------------------------------------------------------

    /** @param body the request body Apple posts: {"signedPayload": "<JWS>"} */
    public Result handleNotification(String body, long now) throws RetryLaterException {
        String signedPayload = signedPayload(body);
        if (signedPayload == null) {
            return new Result(Outcome.REJECTED, "Missing signedPayload");
        }

        SignedDataVerifier verifier = null;
        ResponseBodyV2DecodedPayload notification = null;
        VerificationException failure = null;
        for (SignedDataVerifier candidate : verifiers) {
            try {
                notification = candidate.verifyAndDecodeNotification(signedPayload);
                verifier = candidate;
                break;
            } catch (VerificationException e) {
                // A wrong-environment answer just means "try the other one"
                if (failure == null || failure.getStatus() == VerificationStatus.INVALID_ENVIRONMENT) failure = e;
            }
        }
        if (notification == null) {
            if (failure != null && failure.getStatus() == VerificationStatus.RETRYABLE_VERIFICATION_FAILURE) {
                throw new RetryLaterException("Couldn't check Apple's certificates right now", failure);
            }
            return new Result(Outcome.REJECTED, "Not a valid App Store notification ("
                + (failure != null ? failure.getStatus() : "unknown") + ")");
        }

        NotificationTypeV2 type = notification.getNotificationType();
        if (type == NotificationTypeV2.TEST) {
            return new Result(Outcome.IGNORED, "Test notification received");
        }
        Data data = notification.getData();
        if (type == null || data == null || data.getSignedTransactionInfo() == null) {
            return new Result(Outcome.IGNORED, "Nothing to apply for " + notification.getRawNotificationType());
        }

        JWSTransactionDecodedPayload transaction;
        try {
            transaction = verifier.verifyAndDecodeTransaction(data.getSignedTransactionInfo());
        } catch (VerificationException e) {
            if (e.getStatus() == VerificationStatus.RETRYABLE_VERIFICATION_FAILURE) {
                throw new RetryLaterException("Couldn't check Apple's certificates right now", e);
            }
            return new Result(Outcome.REJECTED, "Transaction in the notification isn't valid (" + e.getStatus() + ")");
        }

        String originalTransactionId = transaction.getOriginalTransactionId();
        Change change = decide(type, notification.getSubtype(), transaction, now);
        if (originalTransactionId == null || change == null) {
            return new Result(Outcome.IGNORED, "No change for " + type
                + (notification.getSubtype() != null ? "/" + notification.getSubtype() : ""));
        }

        long signedDate = notification.getSignedDate() != null ? notification.getSignedDate() : now;
        Criteria newerThanApplied = new Criteria().andOperator(
            Criteria.where("appleOriginalTransactionId").is(originalTransactionId),
            new Criteria().orOperator(
                Criteria.where("appleNotificationSignedAt").exists(false),
                Criteria.where("appleNotificationSignedAt").is(null),
                Criteria.where("appleNotificationSignedAt").lt(signedDate)));
        boolean applied = subscriptionAccess.apply(newerThanApplied, SubscriptionAccess.Store.APPLE, change.status(),
            change.access(), new Update().set("appleNotificationSignedAt", signedDate));
        if (applied) {
            return new Result(Outcome.APPLIED, type + " -> " + change.status() + " (" + change.access() + ")");
        }
        boolean linked = mongoTemplate.exists(
            new Query(Criteria.where("appleOriginalTransactionId").is(originalTransactionId)), User.class);
        return new Result(Outcome.IGNORED, linked
            ? "Older than the last notification applied to this account"
            // Linked when the app sends the purchase to /validate-receipt
            : "No account linked to this App Store subscription yet");
    }

    /**
     * What a verified notification means for the account, or null for no change.
     * See https://developer.apple.com/documentation/appstoreservernotifications/notificationtype
     */
    static Change decide(NotificationTypeV2 type, Subtype subtype, JWSTransactionDecodedPayload transaction, long now) {
        boolean revoked = transaction.getRevocationDate() != null;
        boolean current = transaction.getExpiresDate() != null && transaction.getExpiresDate() > now;
        switch (type) {
            case SUBSCRIBED:
            case DID_RENEW:
            case OFFER_REDEEMED:
            case RENEWAL_EXTENDED:
            case REFUND_REVERSED:
                if (revoked) return new Change(REMOVE, "revoked");
                // An old, already-lapsed period says nothing about now
                return current ? new Change(GRANT, "active") : null;
            case DID_CHANGE_RENEWAL_STATUS:
                if (subtype == Subtype.AUTO_RENEW_DISABLED) return new Change(KEEP, "cancel_at_period_end");
                if (subtype == Subtype.AUTO_RENEW_ENABLED && current && !revoked) return new Change(KEEP, "active");
                return null;
            case DID_FAIL_TO_RENEW:
                // In a billing grace period Apple still gives access; without one, access ends now
                return subtype == Subtype.GRACE_PERIOD
                    ? new Change(KEEP, "grace_period")
                    : new Change(REMOVE, "billing_retry");
            case GRACE_PERIOD_EXPIRED:
                return new Change(REMOVE, "grace_period_expired");
            case EXPIRED:
                return new Change(REMOVE, "expired");
            case REFUND:
                return new Change(REMOVE, "refunded");
            case REVOKE:
                return new Change(REMOVE, "revoked");
            default:
                return null;
        }
    }

    private String signedPayload(String body) {
        if (body == null || body.isBlank()) return null;
        String trimmed = body.trim();
        if (!trimmed.startsWith("{")) return trimmed; // the bare JWS
        try {
            JsonNode node = objectMapper.readTree(trimmed).get("signedPayload");
            return node != null && node.isTextual() ? node.asText() : null;
        } catch (IOException e) {
            return null;
        }
    }

    // ------------------------------------------------------------------
    // Purchases sent by the app (/api/payment/validate-receipt)
    // ------------------------------------------------------------------

    public enum PurchaseOutcome { ACTIVE, EXPIRED, REFUNDED, TAKEN, NOT_PLUS, INVALID }

    /** Whether a product id is FeatureMe Plus (the legacy receipt check uses this too) */
    public boolean isPlusProduct(String productId) {
        return productId != null && plusProductIds.contains(productId);
    }

    /**
     * A StoreKit 2 purchase sent by the app: the signed transaction
     * (jwsRepresentation) is verified like a notification (Apple's chain and
     * signature, this app's bundle id), then applied to the account.
     */
    public PurchaseOutcome applySignedTransaction(String userName, String signedTransaction, long now)
            throws RetryLaterException {
        JWSTransactionDecodedPayload transaction = null;
        VerificationException failure = null;
        for (SignedDataVerifier verifier : verifiers) {
            try {
                transaction = verifier.verifyAndDecodeTransaction(signedTransaction);
                break;
            } catch (VerificationException e) {
                if (failure == null || failure.getStatus() == VerificationStatus.INVALID_ENVIRONMENT) failure = e;
            }
        }
        if (transaction == null) {
            if (failure != null && failure.getStatus() == VerificationStatus.RETRYABLE_VERIFICATION_FAILURE) {
                throw new RetryLaterException("Couldn't check Apple's certificates right now", failure);
            }
            return PurchaseOutcome.INVALID;
        }
        if (!isPlusProduct(transaction.getProductId()) || transaction.getExpiresDate() == null) {
            return PurchaseOutcome.NOT_PLUS;
        }
        boolean refunded = transaction.getRevocationDate() != null;
        boolean current = !refunded && transaction.getExpiresDate() > now;
        if (applyPurchase(userName, transaction.getOriginalTransactionId(), current) == LinkOutcome.TAKEN) {
            return PurchaseOutcome.TAKEN;
        }
        return current ? PurchaseOutcome.ACTIVE : refunded ? PurchaseOutcome.REFUNDED : PurchaseOutcome.EXPIRED;
    }

    public enum LinkOutcome { LINKED, TAKEN }

    /**
     * Records a verified App Store purchase on this account: Plus while it's
     * current; when it has lapsed, Plus goes unless Stripe still provides it. One App Store subscription
     * can only give Plus to one FeatureMe account.
     */
    public LinkOutcome applyPurchase(String userName, String originalTransactionId, boolean current) {
        if (originalTransactionId != null) {
            Query otherAccount = new Query(Criteria.where("appleOriginalTransactionId").is(originalTransactionId)
                .and("userName").ne(userName));
            if (mongoTemplate.exists(otherAccount, User.class)) return LinkOutcome.TAKEN;
        }
        Update extra = new Update();
        if (originalTransactionId != null) extra.set("appleOriginalTransactionId", originalTransactionId);
        subscriptionAccess.apply(Criteria.where("userName").is(userName), SubscriptionAccess.Store.APPLE,
            current ? "active" : "expired", current ? GRANT : REMOVE, extra);
        return LinkOutcome.LINKED;
    }
}
