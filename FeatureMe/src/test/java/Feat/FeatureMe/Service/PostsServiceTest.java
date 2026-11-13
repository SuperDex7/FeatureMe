package Feat.FeatureMe.Service;

import Feat.FeatureMe.Dto.PostsDTO;
import Feat.FeatureMe.Dto.UserPostsDTO;
import Feat.FeatureMe.Entity.Posts;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.PostsRepository;
import Feat.FeatureMe.Repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PostsService Unit Tests")
class PostsServiceTest {

    @Mock
    private PostsRepository postsRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PostViewService postViewService;

    @Mock
    private PostCommentService postCommentService;

    @Mock
    private PostLikeService postLikeService;

    @Mock
    private S3Service s3Service;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AtomicUpdates atomicUpdates;

    @InjectMocks
    private PostsService postsService;

    private Posts mockPost;
    private User mockUser;

    @BeforeEach
    void setUp() {
        // Setup mock user
        mockUser = new User();
        mockUser.setId("user123");
        mockUser.setUserName("testuser");
        mockUser.setEmail("test@example.com");
        mockUser.setRole("USER");
        mockUser.setPosts(new ArrayList<>());
        mockUser.setFeaturedOn(new ArrayList<>());
        mockUser.setNotifications(new ArrayList<>());

        // Setup mock post with author
        mockPost = new Posts();
        mockPost.setId("post123");
        mockPost.setAuthor(mockUser);
        mockPost.setTitle("Test Post");
        mockPost.setDescription("Test Description");
        mockPost.setMusic("https://s3.amazonaws.com/bucket/audio.mp3");
        mockPost.setGenre(List.of("Hip-Hop"));
        mockPost.setStatus("PUBLISHED");
        mockPost.setPrice(0.0);
        mockPost.setFreeDownload(true);
        mockPost.setTime(Instant.now());
        mockPost.setTotalViews(0);
        mockPost.setTotalComments(0);
        mockPost.setTotalDownloads(0);
        mockPost.setFeatures(new ArrayList<>());
        mockPost.setPendingFeatures(new ArrayList<>());

        // Mock dependent services to return empty lists (lenient - not all tests use them)
        lenient().when(postCommentService.getRecentComments(anyString(), anyInt())).thenReturn(List.of());
        lenient().when(postLikeService.getRecentLikes(anyString(), anyInt())).thenReturn(List.of());
        lenient().when(postViewService.getRecentViews(anyString(), anyInt())).thenReturn(List.of());
    }

    @Test
    @DisplayName("Should create post successfully")
    void testCreatePost() {
        // Arrange
        Posts inputPost = new Posts();
        inputPost.setTitle("Test Post");
        inputPost.setDescription("Test Description");
        inputPost.setMusic("https://s3.amazonaws.com/bucket/audio.mp3");
        inputPost.setGenre(List.of("Hip-Hop"));
        inputPost.setPrice(0.0);
        inputPost.setFreeDownload(true);
        inputPost.setFeatures(new ArrayList<>());

        when(userRepository.findById("user123")).thenReturn(Optional.of(mockUser));
        when(postsRepository.insert(any(Posts.class))).thenAnswer(invocation -> {
            Posts post = invocation.getArgument(0);
            if (post.getId() == null) {
                post.setId("post123");
            }
            return post;
        });

        // Act
        Posts result = postsService.createPost("user123", inputPost);

        // Assert
        assertNotNull(result);
        assertEquals("post123", result.getId());
        assertEquals("Test Post", result.getTitle());
        verify(postsRepository, times(1)).insert(any(Posts.class));
        // The post id is added to the author's list atomically, not by saving the whole user
        verify(atomicUpdates, times(1)).addToUserList(eq("testuser"), eq("posts"), anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when user not found")
    void testCreatePost_UserNotFound() {
        // Arrange
        when(userRepository.findById("invalid")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            postsService.createPost("invalid", mockPost);
        });
        verify(postsRepository, never()).insert(any(Posts.class));
    }

    @Test
    @DisplayName("Should get post by ID successfully")
    void testGetPostById() {
        // Arrange
        when(postsRepository.findById("post123")).thenReturn(Optional.of(mockPost));

        // Act
        PostsDTO result = postsService.getPostById("post123");

        // Assert
        assertNotNull(result);
        assertEquals("post123", result.id());
        assertEquals("Test Post", result.title());
        verify(postsRepository, times(1)).findById("post123");
    }

    @Test
    @DisplayName("Should throw exception when post not found")
    void testGetPostById_NotFound() {
        // Arrange
        when(postsRepository.findById("invalid")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            postsService.getPostById("invalid");
        });
        verify(postsRepository, times(1)).findById("invalid");
    }

    @Test
    @DisplayName("Should delete post successfully")
    void testDeletePost() {
        // Arrange - Post has no features, so some mocks won't be used (use lenient)
        when(postsRepository.existsById("post123")).thenReturn(true);
        when(postsRepository.findById("post123")).thenReturn(Optional.of(mockPost));
        when(userRepository.findById("user123")).thenReturn(Optional.of(mockUser));
        lenient().when(userRepository.findByUserNameIn(anyList())).thenReturn(List.of());
        doNothing().when(postCommentService).deleteCommentsForPost(anyString());
        doNothing().when(postLikeService).deleteLikesForPost(anyString());
        doNothing().when(postViewService).deleteViewsForPost(anyString());
        lenient().when(s3Service.extractKeyFromUrl(anyString())).thenReturn("test-key");
        lenient().when(s3Service.deleteFile(anyString())).thenReturn(true);
        doNothing().when(postsRepository).deleteById("post123");

        // Act
        postsService.deletePost("post123");

        // Assert
        verify(postsRepository, times(1)).existsById("post123");
        verify(postsRepository, times(1)).findById("post123");
        verify(postsRepository, times(1)).deleteById("post123");
        verify(postCommentService, times(1)).deleteCommentsForPost("post123");
        verify(postLikeService, times(1)).deleteLikesForPost("post123");
        verify(postViewService, times(1)).deleteViewsForPost("post123");
        verify(atomicUpdates).removeFromUserList("testuser", "posts", "post123");
    }

    @Test
    @DisplayName("Should throw exception when deleting non-existent post")
    void testDeletePost_NotFound() {
        // Arrange
        when(postsRepository.existsById("invalid")).thenReturn(false);

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            postsService.deletePost("invalid");
        });
        verify(postsRepository, times(1)).existsById("invalid");
        verify(postsRepository, never()).findById(anyString());
        verify(postsRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Should update post successfully")
    void testUpdatePost() {
        // Arrange
        Posts updatedPost = new Posts();
        updatedPost.setId("post123");
        updatedPost.setTitle("Updated Title");
        updatedPost.setDescription("Updated Description");

        when(postsRepository.findById("post123")).thenReturn(Optional.of(mockPost));
        when(postsRepository.save(any(Posts.class))).thenReturn(updatedPost);

        // Act
        Posts result = postsService.updatePost("post123", updatedPost);

        // Assert
        assertNotNull(result);
        assertEquals("Updated Title", result.getTitle());
        verify(postsRepository, times(1)).save(any(Posts.class));
    }

    @Test
    @DisplayName("Should get all paginated posts")
    void testGetAllPagedPosts() {
        // Arrange - Mock repository to return empty page
        Page<Posts> page = Page.empty();
        when(postsRepository.findByStatusOrderByTimeDesc(eq("PUBLISHED"), any(Pageable.class)))
                .thenReturn(page);

        // Act
        PagedModel<PostsDTO> result = postsService.getAllPagedPosts(0, 6);

        // Assert
        assertNotNull(result, "Paged posts should not be null");
        assertTrue(result.getContent().isEmpty(), "Should return empty page");
        verify(postsRepository, times(1)).findByStatusOrderByTimeDesc(eq("PUBLISHED"), any(Pageable.class));
    }

    @Test
    @DisplayName("a play adds one to the post's counter atomically instead of recounting expired view records")
    void addViewIncrementsCounter() {
        when(postsRepository.findById("post123")).thenReturn(Optional.of(mockPost));

        postsService.addView("post123", "listener");

        verify(postViewService).addView("post123", "listener");
        verify(atomicUpdates).incPost("post123", "totalViews", 1);
        verify(postsRepository, never()).save(any());
        verify(postViewService, never()).getTotalViews(anyString());
    }

    @Test
    @DisplayName("the view summary never reports fewer plays than the post's counter")
    void summaryUsesCounterWhenRecordsAreMissing() {
        mockPost.setTotalViews(500);
        when(postsRepository.findById("post123")).thenReturn(Optional.of(mockPost));
        when(postViewService.getViewSummary("post123")).thenReturn(new PostViewService.PostViewSummary(3, 2, 1.5));

        PostViewService.PostViewSummary summary = postsService.getPostViewSummary("post123");

        assertEquals(500, summary.getTotalViews());
        assertEquals(2, summary.getUniqueViewers());
        assertEquals(250.0, summary.getAvgViewsPerUser());
    }

    @Test
    @DisplayName("public post responses don't include who listened")
    void postDtoHasNoListeners() {
        when(postsRepository.findById("post123")).thenReturn(Optional.of(mockPost));

        PostsDTO dto = postsService.getPostById("post123");

        assertTrue(dto.views().isEmpty());
        verify(postViewService, never()).getRecentViews(anyString(), anyInt());
    }

    @Test
    @DisplayName("a page of posts loads all its authors in one query")
    void authorsBatched() {
        User bob = new User();
        bob.setId("bob-id");
        bob.setUserName("bob");
        Posts second = new Posts();
        second.setId("post456");
        second.setAuthor(bob);
        when(userRepository.findAllById(anyIterable())).thenReturn(List.of(mockUser, bob));

        List<PostsDTO> dtos = postsService.toDTOs(List.of(mockPost, second));

        verify(userRepository, times(1)).findAllById(anyIterable());
        assertEquals("testuser", dtos.get(0).author().userName());
        assertEquals("bob", dtos.get(1).author().userName());
    }

    @Test
    @DisplayName("post responses carry the real like count, not the size of the 10-like preview")
    void totalLikesInDto() {
        mockPost.setTotalLikes(250);
        when(userRepository.findAllById(anyIterable())).thenReturn(List.of(mockUser));
        assertEquals(250, postsService.toDTOs(List.of(mockPost)).get(0).totalLikes());
    }

    @Test
    @DisplayName("liked posts come back in the order they were liked")
    void likedPostsInLikeOrder() {
        Posts older = new Posts();
        older.setId("older");
        older.setAuthor(mockUser);
        Feat.FeatureMe.Entity.PostLike recent = new Feat.FeatureMe.Entity.PostLike("post123", "testuser", Instant.now());
        Feat.FeatureMe.Entity.PostLike earlier = new Feat.FeatureMe.Entity.PostLike("older", "testuser", Instant.now().minusSeconds(60));
        when(postLikeService.getLikesByUser("testuser", 0, 12)).thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(recent, earlier)));
        // the database returns them in a different order
        when(postsRepository.findAllById(anyIterable())).thenReturn(List.of(older, mockPost));
        when(userRepository.findAllById(anyIterable())).thenReturn(List.of(mockUser));

        PagedModel<PostsDTO> page = postsService.getLikedPosts("testuser", 0, 12);

        assertEquals(List.of("post123", "older"), page.getContent().stream().map(PostsDTO::id).toList());
    }

    @Test
    @DisplayName("liking updates single fields, never saving the whole post or user")
    void likeIsAtomic() {
        User liker = new User();
        liker.setUserName("liker");
        when(postsRepository.findById("post123")).thenReturn(Optional.of(mockPost));
        when(userRepository.findByUserName("liker")).thenReturn(Optional.of(liker));
        when(postLikeService.toggleLike("post123", "liker")).thenReturn(true);
        when(postLikeService.getTotalLikes("post123")).thenReturn(7L);

        postsService.addLike("post123", "liker");

        verify(atomicUpdates).setPost("post123", "totalLikes", 7);
        verify(atomicUpdates).addToUserList("liker", "likedPosts", "post123");
        verify(postsRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }
}
