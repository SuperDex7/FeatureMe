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
import com.mongodb.client.result.UpdateResult;

import Feat.FeatureMe.Entity.User;

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

    /** What a notification does to the account. role null = leave it as it is. */
    record Change(String role, String status) {}

    private static final String ROOT_CERT = "apple/AppleRootCA-G3.cer";

    private final MongoTemplate mongoTemplate;
    private final List<SignedDataVerifier> verifiers;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public AppleSubscriptionService(
            MongoTemplate mongoTemplate,
            @Value("${apple.bundle-id:com.featureme.app}") String bundleId,
            @Value("${apple.app-apple-id:6754936268}") Long appAppleId,
            @Value("${apple.online-checks:true}") boolean onlineChecks) throws IOException {
        this(mongoTemplate, readRootCertificate(), bundleId, appAppleId, onlineChecks);
    }

    AppleSubscriptionService(MongoTemplate mongoTemplate, byte[] rootCertificate,
            String bundleId, Long appAppleId, boolean onlineChecks) {
        this.mongoTemplate = mongoTemplate;
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
        Query newerThanApplied = new Query(new Criteria().andOperator(
            Criteria.where("appleOriginalTransactionId").is(originalTransactionId),
            new Criteria().orOperator(
                Criteria.where("appleNotificationSignedAt").exists(false),
                Criteria.where("appleNotificationSignedAt").is(null),
                Criteria.where("appleNotificationSignedAt").lt(signedDate))));
        Update update = new Update()
            .set("subscriptionStatus", change.status())
            .set("appleNotificationSignedAt", signedDate);
        if (change.role() != null) update.set("role", change.role());

        UpdateResult result = mongoTemplate.updateFirst(newerThanApplied, update, User.class);
        if (result.getMatchedCount() > 0) {
            return new Result(Outcome.APPLIED, type + " -> " + (change.role() != null ? change.role() + ", " : "") + change.status());
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
                if (revoked) return new Change("USER", "revoked");
                // An old, already-lapsed period says nothing about now
                return current ? new Change("USERPLUS", "active") : null;
            case DID_CHANGE_RENEWAL_STATUS:
                if (subtype == Subtype.AUTO_RENEW_DISABLED) return new Change(null, "cancel_at_period_end");
                if (subtype == Subtype.AUTO_RENEW_ENABLED && current && !revoked) return new Change(null, "active");
                return null;
            case DID_FAIL_TO_RENEW:
                // In a billing grace period Apple still gives access; without one, access ends now
                return subtype == Subtype.GRACE_PERIOD
                    ? new Change(null, "payment_failed")
                    : new Change("USER", "payment_failed");
            case GRACE_PERIOD_EXPIRED:
                return new Change("USER", "grace_period_expired");
            case EXPIRED:
                return new Change("USER", "expired");
            case REFUND:
                return new Change("USER", "refunded");
            case REVOKE:
                return new Change("USER", "revoked");
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

    public enum LinkOutcome { LINKED, TAKEN }

    /**
     * Records a verified App Store purchase on this account: Plus while it's
     * current, back to USER when it has lapsed. One App Store subscription
     * can only give Plus to one FeatureMe account.
     */
    public LinkOutcome applyPurchase(String userName, String originalTransactionId, boolean current) {
        if (originalTransactionId != null) {
            Query otherAccount = new Query(Criteria.where("appleOriginalTransactionId").is(originalTransactionId)
                .and("userName").ne(userName));
            if (mongoTemplate.exists(otherAccount, User.class)) return LinkOutcome.TAKEN;
        }
        Update update = new Update()
            .set("role", current ? "USERPLUS" : "USER")
            .set("subscriptionStatus", current ? "active" : "expired");
        if (originalTransactionId != null) update.set("appleOriginalTransactionId", originalTransactionId);
        mongoTemplate.updateFirst(new Query(Criteria.where("userName").is(userName)), update, User.class);
        return LinkOutcome.LINKED;
    }
}
