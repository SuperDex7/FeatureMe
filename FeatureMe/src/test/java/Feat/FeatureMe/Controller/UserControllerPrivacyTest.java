package Feat.FeatureMe.Controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import Feat.FeatureMe.Dto.NotificationsDTO;
import Feat.FeatureMe.Dto.UserDTO;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.CachedUserDetailsService;
import Feat.FeatureMe.Service.FileUploadService;
import Feat.FeatureMe.Service.JwtService;
import Feat.FeatureMe.Service.EmailVerificationService;
import Feat.FeatureMe.Service.NotificationService;
import Feat.FeatureMe.Service.PasswordResetService;
import Feat.FeatureMe.Service.RateLimitingService;
import Feat.FeatureMe.Service.S3Service;
import Feat.FeatureMe.Service.UserService;
import Feat.FeatureMe.config.SecurityConfig;

@WebMvcTest(controllers = UserController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "resend.api.key=test-key")
@WithMockUser(username = "alice@example.com")
@DisplayName("UserController privacy")
class UserControllerPrivacyTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private UserService userService;
    @MockitoBean private S3Service s3Service;
    @MockitoBean private JwtService jwtService;
    @MockitoBean private FileUploadService fileUploadService;
    @MockitoBean private PasswordResetService passwordResetService;
    @MockitoBean private EmailVerificationService emailVerificationService;
    @MockitoBean private NotificationService notificationService;
    @MockitoBean private CachedUserDetailsService cachedUserDetailsService;
    @MockitoBean private RateLimitingService rateLimitingService;

    @BeforeEach
    void setUp() {
        when(rateLimitingService.isWithinRateLimit(anyString(), anyString())).thenReturn(true);
        when(rateLimitingService.getRateLimitInfo(anyString(), any()))
            .thenReturn(new RateLimitingService.RateLimitInfo(0, 100, 60));

        User alice = new User();
        alice.setUserName("alice");
        alice.setEmail("alice@example.com");
        when(userService.findByUsernameOrEmail("alice@example.com")).thenReturn(Optional.of(alice));

        when(userService.getNoti("alice")).thenReturn(List.of(new NotificationsDTO(
            "chat-1", "bob", "Added you to chat", Instant.now(), NotificationsDTO.NotiType.CHAT)));

        // Mocked rather than constructed so the test doesn't depend on UserDTO's field count
        UserDTO bob = mock(UserDTO.class);
        when(bob.id()).thenReturn("bob-id");
        when(bob.userName()).thenReturn("bob");
        when(bob.bio()).thenReturn("producer");
        when(bob.followersCount()).thenReturn(12);
        when(bob.chats()).thenReturn(List.of("secret-chat"));
        when(bob.likedPosts()).thenReturn(List.of("post-9"));
        when(bob.notifications()).thenReturn(List.of(new NotificationsDTO(
            "chat-2", "carol", "DM", Instant.now(), NotificationsDTO.NotiType.CHAT)));
        when(userService.getAUser("bob")).thenReturn(bob);
        when(userService.getUserById("bob-id")).thenReturn(bob);
        when(userService.getAllUsers()).thenReturn(List.of(bob));
    }

    private static void assertNoPrivateFields(ResultActions result, String prefix) throws Exception {
        result
            .andExpect(jsonPath(prefix + ".chats").doesNotExist())
            .andExpect(jsonPath(prefix + ".notifications").doesNotExist())
            .andExpect(jsonPath(prefix + ".likedPosts").doesNotExist())
            .andExpect(jsonPath(prefix + ".purchasedPosts").doesNotExist())
            .andExpect(jsonPath(prefix + ".comments").doesNotExist());
    }

    @Test
    @DisplayName("profile by username shows public fields only")
    void profileByUserNameIsPublic() throws Exception {
        ResultActions result = mockMvc.perform(get("/api/user/get/bob"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.userName").value("bob"))
            .andExpect(jsonPath("$.bio").value("producer"))
            .andExpect(jsonPath("$.followersCount").value(12));
        assertNoPrivateFields(result, "$");
    }

    @Test
    @DisplayName("profile by id shows public fields only")
    void profileByIdIsPublic() throws Exception {
        ResultActions result = mockMvc.perform(get("/api/user/get/id/bob-id"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.userName").value("bob"));
        assertNoPrivateFields(result, "$");
    }

    @Test
    @DisplayName("user list shows public fields only")
    void userListIsPublic() throws Exception {
        ResultActions result = mockMvc.perform(get("/api/user/get"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].userName").value("bob"));
        assertNoPrivateFields(result, "$[0]");
    }

    @Test
    @DisplayName("users can read their own notifications")
    void ownNotifications() throws Exception {
        mockMvc.perform(get("/api/user/get/notifications/alice"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].noti").exists());
    }

    @Test
    @DisplayName("users can't read someone else's notifications")
    void othersNotificationsForbidden() throws Exception {
        mockMvc.perform(get("/api/user/get/notifications/bob"))
            .andExpect(status().isForbidden());
        verify(userService, never()).getNoti("bob");
    }

    @Test
    @DisplayName("the old follow-anyone endpoint is gone")
    void oldFollowEndpointRemoved() throws Exception {
        mockMvc.perform(post("/api/user/follow/bob/carol"))
            .andExpect(result -> {
                int code = result.getResponse().getStatus();
                if (code < 400) {
                    throw new AssertionError("expected an error status, got " + code);
                }
            });
        verify(userService, never()).follow(anyString(), anyString());
    }

    @Test
    @DisplayName("notifications are paged for the logged-in user only")
    void notificationsPaged() throws Exception {
        when(notificationService.page("alice", 1, 20)).thenReturn(new org.springframework.data.domain.PageImpl<>(
            List.of(new NotificationsDTO("p1", "bob", "Liked Your Post!", Instant.now(), NotificationsDTO.NotiType.POST, "n1")),
            org.springframework.data.domain.PageRequest.of(1, 20), 21));

        mockMvc.perform(get("/api/user/notifications").param("page", "1").param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].notificationId").value("n1"))
            .andExpect(jsonPath("$.page.totalElements").value(21));
    }

    @Test
    @DisplayName("deleting a notification that isn't yours is a 404")
    void deleteNotification() throws Exception {
        when(notificationService.delete("alice", "n1")).thenReturn(true);
        when(notificationService.delete("alice", "someone-elses")).thenReturn(false);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/user/notifications/n1"))
            .andExpect(status().isNoContent());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/user/notifications/someone-elses"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("before= returns the next notifications older than that time")
    void notificationsBefore() throws Exception {
        Instant cutoff = Instant.parse("2026-11-01T00:00:00Z");
        when(notificationService.olderThan("alice", cutoff, 20)).thenReturn(new org.springframework.data.domain.PageImpl<>(
            List.of(new NotificationsDTO("p2", "bob", "Liked Your Post!", cutoff.minusSeconds(60), NotificationsDTO.NotiType.POST, "n2"))));

        mockMvc.perform(get("/api/user/notifications").param("before", cutoff.toString()).param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].notificationId").value("n2"));
    }
}
