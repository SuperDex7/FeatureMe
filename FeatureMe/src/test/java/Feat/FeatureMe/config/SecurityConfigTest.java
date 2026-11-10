package Feat.FeatureMe.config;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Feat.FeatureMe.Service.CachedUserDetailsService;
import Feat.FeatureMe.Service.JwtService;
import Feat.FeatureMe.Service.RateLimitingService;

/**
 * Verifies the access rules in {@link SecurityConfig} through the real filter chain.
 * A stub controller stands in for the real ones so no database, Redis or S3 is needed.
 */
@WebMvcTest(controllers = SecurityConfigTest.StubController.class)
@Import({ SecurityConfig.class, SecurityConfigTest.StubController.class })
@DisplayName("SecurityConfig access rules")
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CachedUserDetailsService cachedUserDetailsService;

    @MockitoBean
    private RateLimitingService rateLimitingService;

    @BeforeEach
    void allowAllRateLimits() {
        when(rateLimitingService.isWithinRateLimit(anyString(), anyString())).thenReturn(true);
        when(rateLimitingService.isLoginAttemptWithinLimit(anyString())).thenReturn(true);
        when(rateLimitingService.isFileUploadWithinLimit(anyString())).thenReturn(true);
        when(rateLimitingService.isEmailVerificationWithinLimit(anyString())).thenReturn(true);
        when(rateLimitingService.getRateLimitInfo(anyString(), any()))
            .thenReturn(new RateLimitingService.RateLimitInfo(0, 100, 60));
    }

    /** Answers every path with 200 and whether the caller counts as logged in. */
    @RestController
    static class StubController {
        @RequestMapping("/**")
        String any() {
            return "loggedIn=" + AuthUtils.isLoggedIn(SecurityContextHolder.getContext().getAuthentication());
        }
    }

    @Nested
    @DisplayName("Logged-out visitors")
    class Anonymous {

        @ParameterizedTest(name = "{0} {1} is public")
        @CsvSource({
            "GET,  /api/posts/get/id/abc",
            "GET,  /api/posts/get/search",
            "GET,  /api/posts/comments/abc/paginated",
            "GET,  /api/posts/likes/abc/summary",
            "GET,  /api/posts/views/abc/summary",
            "GET,  /api/posts/downloads/abc/paginated",
            "POST, /api/posts/view/abc",
            "POST, /api/posts/download/abc",
            "POST, /api/user/auth/login",
            "GET,  /api/user/auth/check-username/someone",
            "POST, /api/payment/webhook",
            "POST, /api/payment/apple-webhook",
        })
        void publicEndpointsAreReachable(String method, String path) throws Exception {
            mockMvc.perform(MockMvcRequestBuilders.request(HttpMethod.valueOf(method), path))
                .andExpect(status().isOk());
        }

        @ParameterizedTest(name = "{0} {1} requires login")
        @CsvSource({
            // previously open because of /api/posts/** permitAll
            "POST,   /api/posts/create",
            "PATCH,  /api/posts/update/abc",
            "DELETE, /api/posts/delete/abc",
            "POST,   /api/posts/add/like/abc",
            "POST,   /api/posts/add/comment/abc",
            "GET,    /api/posts/download/file/abc",
            // previously open because of anyRequest().permitAll()
            "POST,   /api/s3/upload",
            "POST,   /api/s3/upload-async",
            "GET,    /api/chats/get/chats",
            "POST,   /api/demos/create",
            "GET,    /api/payment/subscription-status",
            "POST,   /api/payment/validate-receipt",
            "GET,    /api/user-relations/suggestions",
            "GET,    /api/user/me",
            "GET,    /api/some/future/endpoint",
        })
        void protectedEndpointsReturn401(String method, String path) throws Exception {
            mockMvc.perform(MockMvcRequestBuilders.request(HttpMethod.valueOf(method), path))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("are not treated as logged in on public endpoints")
        void anonymousIsNotLoggedIn() throws Exception {
            mockMvc.perform(post("/api/posts/view/abc"))
                .andExpect(status().isOk())
                .andExpect(content().string("loggedIn=false"));
        }
    }

    @Nested
    @DisplayName("Logged-in users")
    @WithMockUser(username = "artist@example.com")
    class Authenticated {

        @ParameterizedTest(name = "{0} {1} is allowed")
        @CsvSource({
            "POST, /api/posts/create",
            "POST, /api/s3/upload",
            "GET,  /api/chats/get/chats",
            "GET,  /api/user/me",
        })
        void protectedEndpointsAreReachable(String method, String path) throws Exception {
            mockMvc.perform(MockMvcRequestBuilders.request(HttpMethod.valueOf(method), path))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("are recognised as logged in")
        void userIsLoggedIn() throws Exception {
            mockMvc.perform(get("/api/posts/get/id/abc"))
                .andExpect(content().string("loggedIn=true"));
        }
    }
}
