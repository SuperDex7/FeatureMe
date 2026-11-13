package Feat.FeatureMe.Controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PagedModel;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import Feat.FeatureMe.Dto.PostsDTO;
import Feat.FeatureMe.Dto.UserPostsDTO;
import Feat.FeatureMe.Dto.ViewsDTO;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.CachedUserDetailsService;
import Feat.FeatureMe.Service.FileUploadService;
import Feat.FeatureMe.Service.JwtService;
import Feat.FeatureMe.Service.PostDownloadService;
import Feat.FeatureMe.Service.PostsService;
import Feat.FeatureMe.Service.RateLimitingService;
import Feat.FeatureMe.Service.S3Service;
import Feat.FeatureMe.Service.UserService;
import Feat.FeatureMe.config.SecurityConfig;

@WebMvcTest(controllers = PostsController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "resend.api.key=test-key")
@DisplayName("PostsController analytics access and play/download tracking")
class PostsControllerAnalyticsTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private PostsService postsService;
    @MockitoBean private S3Service s3Service;
    @MockitoBean private UserService userService;
    @MockitoBean private PostDownloadService postDownloadService;
    @MockitoBean private FileUploadService fileUploadService;
    @MockitoBean private JwtService jwtService;
    @MockitoBean private CachedUserDetailsService cachedUserDetailsService;
    @MockitoBean private RateLimitingService rateLimitingService;

    private User user(String name, String id) {
        User user = new User();
        user.setUserName(name);
        user.setEmail(name + "@example.com");
        user.setId(id);
        return user;
    }

    @BeforeEach
    void setUp() {
        when(rateLimitingService.isWithinRateLimit(anyString(), anyString())).thenReturn(true);
        when(rateLimitingService.isLoginAttemptWithinLimit(anyString())).thenReturn(true);
        when(rateLimitingService.isFileUploadWithinLimit(anyString())).thenReturn(true);
        when(rateLimitingService.getRateLimitInfo(anyString(), any()))
            .thenReturn(new RateLimitingService.RateLimitInfo(0, 100, 60));

        when(userService.findByUsernameOrEmail("alice@example.com")).thenReturn(Optional.of(user("alice", "alice-id")));
        when(userService.findByUsernameOrEmail("bob@example.com")).thenReturn(Optional.of(user("bob", "bob-id")));

        UserPostsDTO author = mock(UserPostsDTO.class);
        when(author.userName()).thenReturn("alice");
        PostsDTO post = mock(PostsDTO.class);
        when(post.author()).thenReturn(author);
        when(postsService.getPostById("p1")).thenReturn(post);

        PagedModel<ViewsDTO> empty = new PagedModel<>(new PageImpl<ViewsDTO>(List.of(), PageRequest.of(0, 10), 0));
        when(postsService.getPostViewsPaginated(anyString(), anyInt(), anyInt())).thenReturn(empty);
    }

    @Test
    @DisplayName("logged-out visitors can't see who listened or downloaded")
    void visitorsBlocked() throws Exception {
        mockMvc.perform(get("/api/posts/views/p1/paginated")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/posts/downloads/p1/paginated")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/posts/views/p1")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/posts/downloads/p1")).andExpect(status().isUnauthorized());
        verify(postsService, never()).getPostViewsPaginated(anyString(), anyInt(), anyInt());
    }

    @Test
    @WithMockUser(username = "bob@example.com")
    @DisplayName("other users can't see someone else's listener or download lists")
    void otherUsersBlocked() throws Exception {
        mockMvc.perform(get("/api/posts/views/p1/paginated")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/posts/downloads/p1/paginated")).andExpect(status().isForbidden());
        verify(postDownloadService, never()).getDownloadsForPostPaginated(anyString(), anyInt(), anyInt());
    }

    @Test
    @WithMockUser(username = "alice@example.com")
    @DisplayName("the author can, and huge page sizes are capped at 50")
    void authorAllowedWithCappedSize() throws Exception {
        mockMvc.perform(get("/api/posts/views/p1/paginated").param("page", "0").param("size", "100000"))
            .andExpect(status().isOk());
        verify(postsService).getPostViewsPaginated("p1", 0, 50);
    }

    @Test
    @DisplayName("counts stay public")
    void countsPublic() throws Exception {
        when(postDownloadService.getDownloadCountForPost("p1")).thenReturn(7L);
        mockMvc.perform(get("/api/posts/downloads/p1/count")).andExpect(status().isOk());
        mockMvc.perform(get("/api/posts/views/p1/summary")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "bob@example.com")
    @DisplayName("plays and downloads are credited to the logged-in user, not a userName parameter")
    void trackingIgnoresUserNameParam() throws Exception {
        mockMvc.perform(post("/api/posts/view/p1").param("userName", "alice")).andExpect(status().isOk());
        verify(postsService).addView("p1", "bob");

        mockMvc.perform(post("/api/posts/download/p1").param("userName", "alice")).andExpect(status().isOk());
        verify(postDownloadService).createDownload("p1", "bob-id", "bob");
        verify(postsService).notifyDownload("p1", "bob");
    }

    @Test
    @DisplayName("logged-out plays and downloads count as unknown and notify nobody")
    void visitorTracking() throws Exception {
        mockMvc.perform(post("/api/posts/view/p1").param("userName", "alice")).andExpect(status().isOk());
        verify(postsService).addView("p1", "unknown");

        mockMvc.perform(post("/api/posts/download/p1")).andExpect(status().isOk());
        verify(postDownloadService).createDownload("p1", "unknown", "unknown");
        verify(postsService, never()).notifyDownload(anyString(), anyString());
    }

    @Test
    @DisplayName("liked-by returns only the names that liked the post")
    void likedBy() throws Exception {
        when(postsService.hasUserLikedPost("p1", "maya")).thenReturn(true);
        when(postsService.hasUserLikedPost(eq("p1"), eq("jay"))).thenReturn(false);

        mockMvc.perform(get("/api/posts/likes/p1/liked-by").param("userNames", "maya,jay,maya"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0]").value("maya"));
    }

    @Test
    @DisplayName("a user's posts and features are looked up server-side, not passed in the URL")
    void postsByUserAndFeaturing() throws Exception {
        User alice = user("alice", "alice-id");
        java.util.List<String> many = java.util.stream.IntStream.range(0, 500).mapToObj(i -> "post" + i).toList();
        alice.setPosts(many);
        alice.setFeaturedOn(List.of("f1"));
        when(userService.findByUsernameOrEmail("alice")).thenReturn(Optional.of(alice));
        PagedModel<PostsDTO> empty = new PagedModel<>(new PageImpl<PostsDTO>(List.of()));
        when(postsService.getAllByIdSortedByTime(any(), anyInt(), anyInt())).thenReturn(empty);

        mockMvc.perform(get("/api/posts/get/by-user/alice").param("page", "2").param("size", "999")).andExpect(status().isOk());
        verify(postsService).getAllByIdSortedByTime(many, 2, 50);

        mockMvc.perform(get("/api/posts/get/featuring/alice")).andExpect(status().isOk());
        verify(postsService).getAllByIdSortedByTime(List.of("f1"), 0, 12);
    }

    @Test
    @DisplayName("looking up a user by email address doesn't work on the public lists")
    void byUserNeedsUserName() throws Exception {
        when(userService.findByUsernameOrEmail("alice@example.com")).thenReturn(Optional.of(user("alice", "alice-id")));
        mockMvc.perform(get("/api/posts/get/by-user/alice@example.com")).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "bob@example.com")
    @DisplayName("liked posts are your own")
    void likedIsMine() throws Exception {
        User bob = user("bob", "bob-id");
        bob.setLikedPosts(List.of("l1", "l2"));
        when(userService.findByUsernameOrEmail("bob@example.com")).thenReturn(Optional.of(bob));
        when(postsService.getLikedPosts(anyString(), anyInt(), anyInt())).thenReturn(new PagedModel<>(new PageImpl<PostsDTO>(List.of())));

        mockMvc.perform(get("/api/posts/liked").param("size", "500")).andExpect(status().isOk());
        // Read from post_likes for the logged-in user, page size capped
        verify(postsService).getLikedPosts("bob", 0, 50);
    }

    @Test
    @DisplayName("liked posts need a login")
    void likedNeedsLogin() throws Exception {
        mockMvc.perform(get("/api/posts/liked")).andExpect(status().is4xxClientError());
        verify(postsService, never()).getLikedPosts(anyString(), anyInt(), anyInt());
    }
}
