package Feat.FeatureMe.Controller;

import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.CachedUserDetailsService;
import Feat.FeatureMe.Service.FileUploadService;
import Feat.FeatureMe.Service.JwtService;
import Feat.FeatureMe.Service.EmailVerificationService;
import Feat.FeatureMe.Service.PasswordResetService;
import Feat.FeatureMe.Service.RateLimitingService;
import Feat.FeatureMe.Service.S3Service;
import Feat.FeatureMe.Service.UserService;
import Feat.FeatureMe.config.SecurityConfig;

@WebMvcTest(controllers = UserController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "resend.api.key=test-key")
@DisplayName("UserController login and session cookie")
class UserControllerAuthTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private UserService userService;
    @MockitoBean private S3Service s3Service;
    @MockitoBean private JwtService jwtService;
    @MockitoBean private FileUploadService fileUploadService;
    @MockitoBean private PasswordResetService passwordResetService;
    @MockitoBean private EmailVerificationService emailVerificationService;
    @MockitoBean private CachedUserDetailsService cachedUserDetailsService;
    @MockitoBean private RateLimitingService rateLimitingService;

    private static final String LOGIN_BODY = "{\"username\":\"alice\",\"password\":\"pw\"}";

    @BeforeEach
    void setUp() {
        when(rateLimitingService.isLoginAttemptWithinLimit(anyString())).thenReturn(true);
        when(rateLimitingService.isWithinRateLimit(anyString(), anyString())).thenReturn(true);
        when(rateLimitingService.getRateLimitInfo(anyString(), any()))
            .thenReturn(new RateLimitingService.RateLimitInfo(0, 100, 60));
    }

    @ParameterizedTest(name = "\"{0}\" is not revealed")
    @ValueSource(strings = { "User not found", "Invalid password" })
    @DisplayName("failed logins give the same message whatever went wrong")
    void failedLoginIsGeneric(String internalReason) throws Exception {
        when(userService.authenticateUser("alice", "pw")).thenThrow(new IllegalArgumentException(internalReason));

        mockMvc.perform(post("/api/user/auth/login").contentType(MediaType.APPLICATION_JSON).content(LOGIN_BODY))
            .andExpect(status().isUnauthorized())
            .andExpect(content().string("Invalid username or password"));
    }

    @Test
    @DisplayName("login sets an HttpOnly, Secure, SameSite=Lax session cookie")
    void loginCookieAttributes() throws Exception {
        User alice = new User();
        alice.setUserName("alice");
        alice.setEmail("alice@example.com");
        when(userService.authenticateUser("alice", "pw")).thenReturn(alice);
        when(jwtService.generateToken(any(), any(), any())).thenReturn("jwt-token");

        mockMvc.perform(post("/api/user/auth/login").contentType(MediaType.APPLICATION_JSON).content(LOGIN_BODY))
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.SET_COOKIE, allOf(
                containsString("sessionToken=jwt-token"),
                containsString("HttpOnly"),
                containsString("Secure"),
                containsString("SameSite=Lax"),
                containsString("Path=/"),
                containsString("Max-Age=86400"))));
    }

    @Test
    @DisplayName("logout clears the cookie with matching attributes")
    void logoutClearsCookie() throws Exception {
        mockMvc.perform(post("/api/user/auth/logout"))
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.SET_COOKIE, allOf(
                containsString("sessionToken="),
                containsString("Max-Age=0"),
                containsString("SameSite=Lax"),
                containsString("Path=/"))));
    }
}
