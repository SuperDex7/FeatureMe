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

import com.stripe.Stripe;
import com.stripe.net.Webhook;

import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.CachedUserDetailsService;
import Feat.FeatureMe.Service.JwtService;
import Feat.FeatureMe.Service.RateLimitingService;
import Feat.FeatureMe.Service.UserService;
import Feat.FeatureMe.config.SecurityConfig;

@WebMvcTest(controllers = StripeController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = { "stripe.webhook.secret=whsec_test", "frontend.url=https://featureme.test" })
@DisplayName("Stripe webhook")
class StripeControllerWebhookTest {

    private static final String SECRET = "whsec_test";

    @Autowired private MockMvc mockMvc;

    @MockitoBean private UserService userService;
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

        verify(userService).saveUser(alice);
        assertThat(alice.getRole()).isEqualTo("USERPLUS");
        assertThat(alice.getStripeSubscriptionId()).isEqualTo("sub_1");
    }

    @ParameterizedTest(name = "API version {0}")
    @ValueSource(strings = { "2025-08-27.basil", Stripe.API_VERSION })
    @DisplayName("customer.subscription.deleted downgrades the user on either API version")
    void subscriptionDeleted(String apiVersion) throws Exception {
        alice.setRole("USERPLUS");
        String payload = event(apiVersion, "customer.subscription.deleted",
            "{\"id\":\"sub_1\",\"object\":\"subscription\",\"customer\":\"cus_1\",\"status\":\"canceled\"}");

        send(payload, signature(payload)).andExpect(status().isOk());

        assertThat(alice.getRole()).isEqualTo("USER");
        assertThat(alice.getSubscriptionStatus()).isEqualTo("canceled");
    }

    @Test
    @DisplayName("cancel at period end keeps Plus but records the pending cancellation")
    void cancelAtPeriodEnd() throws Exception {
        alice.setRole("USERPLUS");
        String payload = event("2025-08-27.basil", "customer.subscription.updated",
            "{\"id\":\"sub_1\",\"object\":\"subscription\",\"customer\":\"cus_1\",\"status\":\"active\",\"cancel_at_period_end\":true}");

        send(payload, signature(payload)).andExpect(status().isOk());

        assertThat(alice.getRole()).isEqualTo("USERPLUS");
        assertThat(alice.getSubscriptionStatus()).isEqualTo("cancel_at_period_end");
    }

    @Test
    @DisplayName("a forged or mis-signed event is rejected with 400 and changes nothing")
    void badSignature() throws Exception {
        String payload = event(Stripe.API_VERSION, "checkout.session.completed",
            "{\"id\":\"cs_1\",\"object\":\"checkout.session\",\"mode\":\"subscription\",\"customer\":\"cus_1\",\"subscription\":\"sub_1\"}");

        send(payload, "t=1700000000,v1=deadbeef").andExpect(status().isBadRequest());

        verify(userService, never()).saveUser(any());
        assertThat(alice.getRole()).isEqualTo("USER");
    }

    @Test
    @DisplayName("a processing failure returns 500 so Stripe retries")
    void processingErrorRetries() throws Exception {
        when(userService.findByStripeCustomerId("cus_1")).thenThrow(new RuntimeException("database down"));
        String payload = event(Stripe.API_VERSION, "customer.subscription.deleted",
            "{\"id\":\"sub_1\",\"object\":\"subscription\",\"customer\":\"cus_1\",\"status\":\"canceled\"}");

        send(payload, signature(payload)).andExpect(status().isInternalServerError());
    }
}
