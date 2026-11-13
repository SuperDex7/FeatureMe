package Feat.FeatureMe.Controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

import com.stripe.Stripe;
import com.stripe.net.Webhook;

import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.CachedUserDetailsService;
import Feat.FeatureMe.Service.JwtService;
import Feat.FeatureMe.Service.RateLimitingService;
import Feat.FeatureMe.Service.SubscriptionAccess;
import Feat.FeatureMe.Service.SubscriptionAccess.Access;
import Feat.FeatureMe.Service.SubscriptionAccess.Store;
import Feat.FeatureMe.Service.UserService;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import Feat.FeatureMe.config.SecurityConfig;

@WebMvcTest(controllers = StripeController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = { "stripe.webhook.secret=whsec_test", "frontend.url=https://featureme.test" })
@DisplayName("Stripe webhook")
class StripeControllerWebhookTest {

    private static final String SECRET = "whsec_test";

    @Autowired private MockMvc mockMvc;

    @MockitoBean private UserService userService;
    @MockitoBean private Feat.FeatureMe.Service.AppleSubscriptionService appleSubscriptionService;
    @MockitoBean private SubscriptionAccess subscriptionAccess;
    @MockitoBean private JwtService jwtService;
    @MockitoBean private CachedUserDetailsService cachedUserDetailsService;
    @MockitoBean private RateLimitingService rateLimitingService;

    private User alice;

    @BeforeEach
    void setUp() {
        when(rateLimitingService.isWithinRateLimit(anyString(), anyString())).thenReturn(true);
        when(rateLimitingService.getRateLimitInfo(anyString(), any()))
            .thenReturn(new RateLimitingService.RateLimitInfo(0, 100, 60));

        alice = new User();
        alice.setUserName("alice");
        alice.setEmail("alice@example.com");
        alice.setRole("USER");
        when(userService.findByStripeCustomerId("cus_1")).thenReturn(Optional.of(alice));
        when(subscriptionAccess.apply(any(), any(), any(), any(), any())).thenReturn(true);
    }

    /** The account the update targeted */
    private static String target(Criteria account) {
        return new Query(account).getQueryObject().toJson();
    }

    private static String event(String apiVersion, String type, String object) {
        return "{\"id\":\"evt_1\",\"object\":\"event\",\"api_version\":\"" + apiVersion + "\",\"created\":1700000000,"
            + "\"livemode\":false,\"pending_webhooks\":1,\"type\":\"" + type + "\",\"data\":{\"object\":" + object + "}}";
    }

    private static String signature(String payload) throws Exception {
        long timestamp = System.currentTimeMillis() / 1000;
        String sig = Webhook.Util.computeHmacSha256(SECRET, timestamp + "." + payload);
        return "t=" + timestamp + ",v1=" + sig;
    }

    private org.springframework.test.web.servlet.ResultActions send(String payload, String signatureHeader) throws Exception {
        return mockMvc.perform(post("/api/payment/webhook")
            .contentType(MediaType.APPLICATION_JSON)
            .header("Stripe-Signature", signatureHeader)
            .content(payload));
    }

    @ParameterizedTest(name = "API version {0}")
    @ValueSource(strings = { "2025-08-27.basil", Stripe.API_VERSION })
    @DisplayName("checkout.session.completed upgrades the user, whether the endpoint is on the old or new API version")
    void checkoutCompleted(String apiVersion) throws Exception {
        String payload = event(apiVersion, "checkout.session.completed",
            "{\"id\":\"cs_1\",\"object\":\"checkout.session\",\"mode\":\"subscription\",\"customer\":\"cus_1\",\"subscription\":\"sub_1\"}");

        send(payload, signature(payload)).andExpect(status().isOk());

        ArgumentCaptor<Criteria> account = ArgumentCaptor.forClass(Criteria.class);
        ArgumentCaptor<Update> extra = ArgumentCaptor.forClass(Update.class);
        verify(subscriptionAccess).apply(account.capture(), eq(Store.STRIPE), eq("active"), eq(Access.GRANT), extra.capture());
        assertThat(target(account.getValue())).contains("\"stripeCustomerId\": \"cus_1\"");
        assertThat(extra.getValue().getUpdateObject().toJson()).contains("\"stripeSubscriptionId\": \"sub_1\"");
        verify(userService, never()).saveUser(any());
    }

    @ParameterizedTest(name = "API version {0}")
    @ValueSource(strings = { "2025-08-27.basil", Stripe.API_VERSION })
    @DisplayName("customer.subscription.deleted downgrades the user on either API version")
    void subscriptionDeleted(String apiVersion) throws Exception {
        alice.setRole("USERPLUS");
        String payload = event(apiVersion, "customer.subscription.deleted",
            "{\"id\":\"sub_1\",\"object\":\"subscription\",\"customer\":\"cus_1\",\"status\":\"canceled\"}");

        send(payload, signature(payload)).andExpect(status().isOk());

        verify(subscriptionAccess).apply(any(), eq(Store.STRIPE), eq("canceled"), eq(Access.REMOVE), isNull());
    }

    @Test
    @DisplayName("cancel at period end keeps Plus but records the pending cancellation")
    void cancelAtPeriodEnd() throws Exception {
        alice.setRole("USERPLUS");
        String payload = event("2025-08-27.basil", "customer.subscription.updated",
            "{\"id\":\"sub_1\",\"object\":\"subscription\",\"customer\":\"cus_1\",\"status\":\"active\",\"cancel_at_period_end\":true}");

        send(payload, signature(payload)).andExpect(status().isOk());

        verify(subscriptionAccess).apply(any(), eq(Store.STRIPE), eq("cancel_at_period_end"), eq(Access.KEEP), isNull());
    }

    @Test
    @DisplayName("a forged or mis-signed event is rejected with 400 and changes nothing")
    void badSignature() throws Exception {
        String payload = event(Stripe.API_VERSION, "checkout.session.completed",
            "{\"id\":\"cs_1\",\"object\":\"checkout.session\",\"mode\":\"subscription\",\"customer\":\"cus_1\",\"subscription\":\"sub_1\"}");

        send(payload, "t=1700000000,v1=deadbeef").andExpect(status().isBadRequest());

        verify(subscriptionAccess, never()).apply(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("a processing failure returns 500 so Stripe retries")
    void processingErrorRetries() throws Exception {
        when(subscriptionAccess.apply(any(), any(), any(), any(), any())).thenThrow(new RuntimeException("database down"));
        String payload = event(Stripe.API_VERSION, "customer.subscription.deleted",
            "{\"id\":\"sub_1\",\"object\":\"subscription\",\"customer\":\"cus_1\",\"status\":\"canceled\"}");

        send(payload, signature(payload)).andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("Apple webhook: 400 for anything Apple didn't sign, 200 when applied, 503 so Apple retries")
    void appleWebhookStatuses() throws Exception {
        when(appleSubscriptionService.handleNotification(org.mockito.ArgumentMatchers.eq("forged"), org.mockito.ArgumentMatchers.anyLong()))
            .thenReturn(new Feat.FeatureMe.Service.AppleSubscriptionService.Result(Feat.FeatureMe.Service.AppleSubscriptionService.Outcome.REJECTED, "bad"));
        when(appleSubscriptionService.handleNotification(org.mockito.ArgumentMatchers.eq("good"), org.mockito.ArgumentMatchers.anyLong()))
            .thenReturn(new Feat.FeatureMe.Service.AppleSubscriptionService.Result(Feat.FeatureMe.Service.AppleSubscriptionService.Outcome.APPLIED, "ok"));
        when(appleSubscriptionService.handleNotification(org.mockito.ArgumentMatchers.eq("later"), org.mockito.ArgumentMatchers.anyLong()))
            .thenThrow(org.mockito.Mockito.mock(Feat.FeatureMe.Service.AppleSubscriptionService.RetryLaterException.class));

        mockMvc.perform(post("/api/payment/apple-webhook").content("forged")).andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/payment/apple-webhook").content("good")).andExpect(status().isOk());
        mockMvc.perform(post("/api/payment/apple-webhook").content("later")).andExpect(status().isServiceUnavailable());
    }

    @Test
    @WithMockUser(username = "alice@example.com")
    @DisplayName("an Android purchase never grants Plus (Android subscribes through the web)")
    void androidReceiptRefused() throws Exception {
        when(userService.findByUsernameOrEmail("alice@example.com")).thenReturn(Optional.of(alice));
        mockMvc.perform(post("/api/payment/validate-receipt").contentType(MediaType.APPLICATION_JSON)
                .content("{\"platform\":\"android\",\"receipt\":\"anything\",\"transactionId\":\"GPA.123\",\"productId\":\"plus\"}"))
            .andExpect(status().isOk())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.success").value(false));
        verify(subscriptionAccess, never()).apply(any(), any(), any(), any(), any());
        verify(userService, never()).saveUser(any());
    }
}
