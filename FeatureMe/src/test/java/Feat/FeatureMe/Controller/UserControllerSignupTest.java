package Feat.FeatureMe.Controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.RETURNS_DEEP_STUBS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;

import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.CachedUserDetailsService;
import Feat.FeatureMe.Service.EmailVerificationException;
import Feat.FeatureMe.Service.EmailVerificationService;
import Feat.FeatureMe.Service.NotificationService;
import Feat.FeatureMe.Service.FileUploadService;
import Feat.FeatureMe.Service.JwtService;
import Feat.FeatureMe.Service.PasswordResetService;
import Feat.FeatureMe.Service.RateLimitingService;
import Feat.FeatureMe.Service.S3Service;
import Feat.FeatureMe.Service.UserService;
import Feat.FeatureMe.config.SecurityConfig;

@WebMvcTest(controllers = UserController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "resend.api.key=test-key")
@DisplayName("UserController signup email verification")
class UserControllerSignupTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserController controller;

    @MockitoBean private UserService userService;
    @MockitoBean private S3Service s3Service;
    @MockitoBean private JwtService jwtService;
    @MockitoBean private FileUploadService fileUploadService;
    @MockitoBean private PasswordResetService passwordResetService;
    @MockitoBean private EmailVerificationService emailVerificationService;
    @MockitoBean private NotificationService notificationService;
    @MockitoBean private CachedUserDetailsService cachedUserDetailsService;
    @MockitoBean private RateLimitingService rateLimitingService;

    private Resend resend;

    @BeforeEach
    void setUp() {
        when(rateLimitingService.isLoginAttemptWithinLimit(anyString())).thenReturn(true);
        when(rateLimitingService.isWithinRateLimit(anyString(), anyString())).thenReturn(true);
        when(rateLimitingService.isEmailVerificationWithinLimit(anyString())).thenReturn(true);
        when(rateLimitingService.getRateLimitInfo(anyString(), any()))
            .thenReturn(new RateLimitingService.RateLimitInfo(0, 100, 60));

        resend = mock(Resend.class, RETURNS_DEEP_STUBS);
        ReflectionTestUtils.setField(controller, "resend", resend);
    }

    @Test
    @DisplayName("sending a code emails it and never returns it")
    void sendDoesNotLeakCode() throws Exception {
        when(userService.existsByEmail("new@example.com")).thenReturn(false);
        when(emailVerificationService.issueCode("new@example.com")).thenReturn("482913");

        mockMvc.perform(post("/api/user/auth/email-verification/send")
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\" new@example.com \"}"))
            .andExpect(status().isOk())
            .andExpect(content().string(not(containsString("482913"))))
            .andExpect(content().string(not(containsString("NDgyOTEz")))); // base64 of the code

        ArgumentCaptor<CreateEmailOptions> sent = ArgumentCaptor.forClass(CreateEmailOptions.class);
        verify(resend.emails()).send(sent.capture());
        assertThat(sent.getValue().getHtml()).contains("482913");
    }

    @Test
    @DisplayName("no code for an email that already has an account")
    void sendRejectsTakenEmail() throws Exception {
        when(userService.existsByEmail("taken@example.com")).thenReturn(true);

        mockMvc.perform(post("/api/user/auth/email-verification/send")
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"taken@example.com\"}"))
            .andExpect(status().isConflict());
        verify(emailVerificationService, never()).issueCode(anyString());
    }

    @Test
    @DisplayName("verify returns the token, or the service's message on failure")
    void verifyCode() throws Exception {
        when(emailVerificationService.verifyCode("new@example.com", "482913")).thenReturn("tok");
        when(emailVerificationService.verifyCode("new@example.com", "000000"))
            .thenThrow(new EmailVerificationException(HttpStatus.BAD_REQUEST, "That code doesn't match. 4 tries left."));

        mockMvc.perform(post("/api/user/auth/email-verification/verify")
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"new@example.com\",\"code\":\"482913\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.verificationToken").value("tok"));
        mockMvc.perform(post("/api/user/auth/email-verification/verify")
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"new@example.com\",\"code\":\"000000\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("That code doesn't match. 4 tries left."));
    }

    @Test
    @DisplayName("the old endpoint that returned the code is gone")
    void oldEndpointRemoved() throws Exception {
        mockMvc.perform(get("/api/user/auth/email/new@example.com"))
            .andExpect(status().is4xxClientError());
    }

    private static MockMultipartFile userPart(String json) {
        return new MockMultipartFile("user", "", "application/json", json.getBytes());
    }

    private static final String SIGNUP_JSON =
        "{\"userName\":\"newbie\",\"email\":\"new@example.com\",\"password\":\"secret1\",\"role\":\"USERPLUS\","
        + "\"badges\":[\"Verified\"],\"followersCount\":9999,\"bio\":\"Producer\",\"location\":\"Atlanta\"}";

    @Test
    @DisplayName("an account can't be created without a verified email")
    void createRequiresVerification() throws Exception {
        when(emailVerificationService.isVerified(eq("new@example.com"), any())).thenReturn(false);

        mockMvc.perform(multipart("/api/user/auth/create").file(userPart(SIGNUP_JSON)))
            .andExpect(status().isForbidden());
        mockMvc.perform(multipart("/api/user/auth/create").file(userPart(SIGNUP_JSON)).param("verificationToken", "forged"))
            .andExpect(status().isForbidden());

        verify(userService, never()).createUser(any());
        verify(s3Service, never()).uploadFile(anyString(), anyString());
    }

    @Test
    @DisplayName("a verified signup can't choose its own role, badges or counts, and gets no password hash back")
    void createIgnoresPrivilegedFields() throws Exception {
        when(emailVerificationService.isVerified("new@example.com", "tok")).thenReturn(true);
        when(userService.createUser(any())).thenAnswer(inv -> {
            User saved = inv.getArgument(0);
            saved.setPassword("$2a$10$hashhashhash");
            return saved;
        });

        mockMvc.perform(multipart("/api/user/auth/create").file(userPart(SIGNUP_JSON)).param("verificationToken", "tok"))
            .andExpect(status().isOk())
            .andExpect(content().string(not(containsString("$2a$"))))
            .andExpect(content().string(not(containsString("secret1"))));

        ArgumentCaptor<User> created = ArgumentCaptor.forClass(User.class);
        verify(userService).createUser(created.capture());
        User user = created.getValue();
        assertThat(user.getRole()).isEqualTo("USER");
        assertThat(user.getBadges()).isEmpty();
        assertThat(user.getFollowersCount()).isZero();
        assertThat(user.getUserName()).isEqualTo("newbie");
        assertThat(user.getBio()).isEqualTo("Producer");
        verify(emailVerificationService).consume("new@example.com");
    }
}
