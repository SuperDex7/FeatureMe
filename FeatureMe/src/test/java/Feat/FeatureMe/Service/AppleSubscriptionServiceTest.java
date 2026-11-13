package Feat.FeatureMe.Service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.bouncycastle.asn1.ASN1ObjectIdentifier;
import org.bouncycastle.asn1.DERNull;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x509.BasicConstraints;
import org.bouncycastle.asn1.x509.Extension;
import org.bouncycastle.asn1.x509.KeyUsage;
import org.bouncycastle.cert.X509v3CertificateBuilder;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;

import com.apple.itunes.storekit.model.JWSTransactionDecodedPayload;
import com.apple.itunes.storekit.model.NotificationTypeV2;
import com.apple.itunes.storekit.model.Subtype;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.mongodb.client.result.UpdateResult;

import Feat.FeatureMe.Entity.User;

@DisplayName("App Store subscriptions")
class AppleSubscriptionServiceTest {

    private static final String BUNDLE = "com.featureme.app";
    private static final long APP_ID = 6754936268L;
    private static final long NOW = System.currentTimeMillis();
    private static final long DAY = 24L * 60 * 60 * 1000;

    /** A certificate chain shaped like Apple's: root -> intermediate -> signing cert */
    static final class Chain {
        final byte[] root;
        final List<String> x5c;
        final KeyPair leafKeys;

        Chain() throws Exception {
            KeyPair rootKeys = keys(), intermediateKeys = keys();
            leafKeys = keys();
            byte[] rootCert = cert("CN=Test Root", rootKeys, "CN=Test Root", rootKeys, true, null);
            byte[] intermediate = cert("CN=Test Intermediate", intermediateKeys, "CN=Test Root", rootKeys, true, "1.2.840.113635.100.6.2.1");
            byte[] leaf = cert("CN=Test Signer", leafKeys, "CN=Test Intermediate", intermediateKeys, false, "1.2.840.113635.100.6.11.1");
            root = rootCert;
            Base64.Encoder b64 = Base64.getEncoder();
            x5c = List.of(b64.encodeToString(leaf), b64.encodeToString(intermediate), b64.encodeToString(rootCert));
        }

        String sign(Map<String, Object> payload) {
            Algorithm alg = Algorithm.ECDSA256((ECPublicKey) leafKeys.getPublic(), (ECPrivateKey) leafKeys.getPrivate());
            return JWT.create().withHeader(Map.of("x5c", x5c)).withPayload(payload).sign(alg);
        }

        private static KeyPair keys() throws Exception {
            KeyPairGenerator gen = KeyPairGenerator.getInstance("EC");
            gen.initialize(new ECGenParameterSpec("secp256r1"));
            return gen.generateKeyPair();
        }

        private static byte[] cert(String subject, KeyPair subjectKeys, String issuer, KeyPair issuerKeys,
                boolean ca, String appleOid) throws Exception {
            X509v3CertificateBuilder builder = new JcaX509v3CertificateBuilder(
                new X500Name(issuer), BigInteger.valueOf(System.nanoTime()),
                new Date(NOW - 365 * DAY), new Date(NOW + 365 * DAY), new X500Name(subject), subjectKeys.getPublic());
            builder.addExtension(Extension.basicConstraints, true, new BasicConstraints(ca));
            builder.addExtension(Extension.keyUsage, true,
                new KeyUsage(ca ? KeyUsage.keyCertSign | KeyUsage.cRLSign : KeyUsage.digitalSignature));
            if (appleOid != null) builder.addExtension(new ASN1ObjectIdentifier(appleOid), false, DERNull.INSTANCE);
            return builder.build(new JcaContentSignerBuilder("SHA256withECDSA").build(issuerKeys.getPrivate())).getEncoded();
        }
    }

    private static Chain apple;
    private MongoTemplate mongo;
    private AppleSubscriptionService service;

    @BeforeEach
    void setUp() throws Exception {
        if (apple == null) apple = new Chain();
        mongo = mock(MongoTemplate.class);
        service = new AppleSubscriptionService(mongo, apple.root, BUNDLE, APP_ID, false);
        when(mongo.updateFirst(any(Query.class), any(Update.class), eq(User.class)))
            .thenReturn(UpdateResult.acknowledged(1, 1L, null));
    }

    private static Map<String, Object> transaction(String environment, long expires) {
        Map<String, Object> tx = new HashMap<>();
        tx.put("originalTransactionId", "1000");
        tx.put("transactionId", "1001");
        tx.put("bundleId", BUNDLE);
        tx.put("productId", "featureme_plus_monthly");
        tx.put("type", "Auto-Renewable Subscription");
        tx.put("environment", environment);
        tx.put("expiresDate", expires);
        tx.put("signedDate", NOW);
        return tx;
    }

    private static String notificationBody(Chain signer, String type, String subtype, String environment,
            String bundleId, String signedTransaction) {
        Map<String, Object> data = new HashMap<>();
        data.put("bundleId", bundleId);
        data.put("appAppleId", APP_ID);
        data.put("environment", environment);
        data.put("signedTransactionInfo", signedTransaction);
        Map<String, Object> payload = new HashMap<>();
        payload.put("notificationType", type);
        if (subtype != null) payload.put("subtype", subtype);
        payload.put("notificationUUID", "uuid-1");
        payload.put("version", "2.0");
        payload.put("signedDate", NOW);
        payload.put("data", data);
        return "{\"signedPayload\":\"" + signer.sign(payload) + "\"}";
    }

    private String renewal() {
        return notificationBody(apple, "DID_RENEW", null, "Production", BUNDLE,
            apple.sign(transaction("Production", NOW + 30 * DAY)));
    }

    private Update appliedUpdate() {
        ArgumentCaptor<Update> update = ArgumentCaptor.forClass(Update.class);
        verify(mongo).updateFirst(any(Query.class), update.capture(), eq(User.class));
        return update.getValue();
    }

    @Test
    @DisplayName("a renewal signed by Apple gives the linked account Plus")
    void verifiedRenewal() throws Exception {
        var result = service.handleNotification(renewal(), NOW);

        assertThat(result.outcome()).isEqualTo(AppleSubscriptionService.Outcome.APPLIED);
        String set = appliedUpdate().getUpdateObject().toJson();
        assertThat(set).contains("\"role\": \"USERPLUS\"").contains("\"subscriptionStatus\": \"active\"")
            .contains("appleNotificationSignedAt");
    }

    @Test
    @DisplayName("only that subscription's account, and only if the notification is newer than the last one applied")
    void queryTargetsNewerOnly() throws Exception {
        service.handleNotification(renewal(), NOW);

        ArgumentCaptor<Query> query = ArgumentCaptor.forClass(Query.class);
        verify(mongo).updateFirst(query.capture(), any(Update.class), eq(User.class));
        String q = query.getValue().getQueryObject().toJson();
        assertThat(q).contains("\"appleOriginalTransactionId\": \"1000\"").contains("\"$lt\": " + NOW);
    }

    @Test
    @DisplayName("a notification signed by anyone other than Apple is rejected and changes nothing")
    void forgedSignature() throws Exception {
        Chain impostor = new Chain();
        String body = notificationBody(impostor, "DID_RENEW", null, "Production", BUNDLE,
            impostor.sign(transaction("Production", NOW + 30 * DAY)));

        var result = service.handleNotification(body, NOW);

        assertThat(result.outcome()).isEqualTo(AppleSubscriptionService.Outcome.REJECTED);
        verify(mongo, never()).updateFirst(any(Query.class), any(Update.class), eq(User.class));
    }

    @Test
    @DisplayName("an edited notification fails the signature check")
    void tamperedPayload() throws Exception {
        String jws = renewal().replace("{\"signedPayload\":\"", "").replace("\"}", "");
        String[] parts = jws.split("\\.");
        String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8)
            .replace("DID_RENEW", "REFUND_REVERSED");
        String edited = parts[0] + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8)) + "." + parts[2];

        var result = service.handleNotification(edited, NOW);

        assertThat(result.outcome()).isEqualTo(AppleSubscriptionService.Outcome.REJECTED);
        verify(mongo, never()).updateFirst(any(Query.class), any(Update.class), eq(User.class));
    }

    @Test
    @DisplayName("a real Apple notification for a different app is rejected")
    void otherApp() throws Exception {
        String body = notificationBody(apple, "DID_RENEW", null, "Production", "com.someone.else",
            apple.sign(transaction("Production", NOW + 30 * DAY)));
        assertThat(service.handleNotification(body, NOW).outcome()).isEqualTo(AppleSubscriptionService.Outcome.REJECTED);
    }

    @Test
    @DisplayName("sandbox notifications (TestFlight, App Review) are accepted")
    void sandbox() throws Exception {
        String body = notificationBody(apple, "DID_RENEW", null, "Sandbox", BUNDLE,
            apple.sign(transaction("Sandbox", NOW + DAY)));
        assertThat(service.handleNotification(body, NOW).outcome()).isEqualTo(AppleSubscriptionService.Outcome.APPLIED);
    }

    @Test
    @DisplayName("an expiry takes Plus away")
    void expired() throws Exception {
        String body = notificationBody(apple, "EXPIRED", "VOLUNTARY", "Production", BUNDLE,
            apple.sign(transaction("Production", NOW - DAY)));

        assertThat(service.handleNotification(body, NOW).outcome()).isEqualTo(AppleSubscriptionService.Outcome.APPLIED);
        assertThat(appliedUpdate().getUpdateObject().toJson()).contains("\"role\": \"USER\"").contains("\"expired\"");
    }

    @Test
    @DisplayName("a notification older than the last one applied is ignored")
    void outOfOrder() throws Exception {
        when(mongo.updateFirst(any(Query.class), any(Update.class), eq(User.class)))
            .thenReturn(UpdateResult.acknowledged(0, 0L, null));
        when(mongo.exists(any(Query.class), eq(User.class))).thenReturn(true);

        var result = service.handleNotification(renewal(), NOW);

        assertThat(result.outcome()).isEqualTo(AppleSubscriptionService.Outcome.IGNORED);
        assertThat(result.message()).contains("Older");
    }

    @Test
    @DisplayName("Apple's TEST notification and garbage bodies")
    void testAndGarbage() throws Exception {
        String test = notificationBody(apple, "TEST", null, "Production", BUNDLE, null);
        assertThat(service.handleNotification(test, NOW).outcome()).isEqualTo(AppleSubscriptionService.Outcome.IGNORED);
        assertThat(service.handleNotification("{}", NOW).outcome()).isEqualTo(AppleSubscriptionService.Outcome.REJECTED);
        assertThat(service.handleNotification("not.a.jws", NOW).outcome()).isEqualTo(AppleSubscriptionService.Outcome.REJECTED);
        verify(mongo, never()).updateFirst(any(Query.class), any(Update.class), eq(User.class));
    }

    @Test
    @DisplayName("what each notification type does")
    void decisions() {
        JWSTransactionDecodedPayload current = new JWSTransactionDecodedPayload().expiresDate(NOW + DAY);
        JWSTransactionDecodedPayload lapsed = new JWSTransactionDecodedPayload().expiresDate(NOW - DAY);
        JWSTransactionDecodedPayload refunded = new JWSTransactionDecodedPayload().expiresDate(NOW + DAY).revocationDate(NOW);

        assertThat(AppleSubscriptionService.decide(NotificationTypeV2.SUBSCRIBED, Subtype.INITIAL_BUY, current, NOW))
            .isEqualTo(new AppleSubscriptionService.Change("USERPLUS", "active"));
        assertThat(AppleSubscriptionService.decide(NotificationTypeV2.DID_RENEW, null, lapsed, NOW)).isNull();
        assertThat(AppleSubscriptionService.decide(NotificationTypeV2.DID_RENEW, null, refunded, NOW))
            .isEqualTo(new AppleSubscriptionService.Change("USER", "revoked"));
        assertThat(AppleSubscriptionService.decide(NotificationTypeV2.DID_CHANGE_RENEWAL_STATUS, Subtype.AUTO_RENEW_DISABLED, current, NOW))
            .isEqualTo(new AppleSubscriptionService.Change(null, "cancel_at_period_end"));
        assertThat(AppleSubscriptionService.decide(NotificationTypeV2.DID_FAIL_TO_RENEW, Subtype.GRACE_PERIOD, current, NOW))
            .isEqualTo(new AppleSubscriptionService.Change(null, "payment_failed"));
        assertThat(AppleSubscriptionService.decide(NotificationTypeV2.DID_FAIL_TO_RENEW, null, lapsed, NOW))
            .isEqualTo(new AppleSubscriptionService.Change("USER", "payment_failed"));
        assertThat(AppleSubscriptionService.decide(NotificationTypeV2.REFUND, null, refunded, NOW))
            .isEqualTo(new AppleSubscriptionService.Change("USER", "refunded"));
        assertThat(AppleSubscriptionService.decide(NotificationTypeV2.PRICE_INCREASE, Subtype.PENDING, current, NOW)).isNull();
    }

    @Test
    @DisplayName("one App Store subscription can't give Plus to a second account")
    void purchaseTakenByAnotherAccount() {
        when(mongo.exists(any(Query.class), eq(User.class))).thenReturn(true);

        assertThat(service.applyPurchase("bob", "1000", true)).isEqualTo(AppleSubscriptionService.LinkOutcome.TAKEN);
        verify(mongo, never()).updateFirst(any(Query.class), any(Update.class), eq(User.class));
    }

    @Test
    @DisplayName("a verified purchase sets only the subscription fields")
    void purchaseApplied() {
        when(mongo.exists(any(Query.class), eq(User.class))).thenReturn(false);

        assertThat(service.applyPurchase("bob", "1000", true)).isEqualTo(AppleSubscriptionService.LinkOutcome.LINKED);
        String set = appliedUpdate().getUpdateObject().toJson();
        assertThat(set).contains("USERPLUS").contains("\"appleOriginalTransactionId\": \"1000\"")
            .doesNotContain("password").doesNotContain("email");
    }

    @Test
    @DisplayName("the bundled Apple Root CA - G3 loads, and real Apple data signed by our test chain is still rejected")
    void realRootCertificate() throws Exception {
        AppleSubscriptionService real = new AppleSubscriptionService(mongo, BUNDLE, APP_ID, false);
        assertThat(real.handleNotification(renewal(), NOW).outcome()).isEqualTo(AppleSubscriptionService.Outcome.REJECTED);
    }
}
