package Feat.FeatureMe.Controller;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.springframework.data.web.PagedModel;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import java.util.Arrays;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import Feat.FeatureMe.Dto.PostsDTO;
import Feat.FeatureMe.Dto.ViewsDTO;
import Feat.FeatureMe.Dto.CommentDTO;
import Feat.FeatureMe.Dto.LikesDTO;
import Feat.FeatureMe.Dto.PostDownloadDTO;
import Feat.FeatureMe.Entity.Posts;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.PostsService;
import Feat.FeatureMe.Service.PostViewService;
import Feat.FeatureMe.Service.PostDownloadService;
import Feat.FeatureMe.Service.PostLikeService;
import Feat.FeatureMe.Service.S3Service;
import Feat.FeatureMe.Service.UserService;
import Feat.FeatureMe.Service.FileUploadService;
import com.fasterxml.jackson.databind.ObjectMapper;




@RestController
@RequestMapping("/api/posts")
public class PostsController {
    
    private final PostsService postsService;
    private final S3Service s3Service;
    private final UserService userService;
    private final PostDownloadService postDownloadService;
    private final FileUploadService fileUploadService;
    
    public PostsController(PostsService postsService, S3Service s3Service, UserService userService, PostDownloadService postDownloadService, FileUploadService fileUploadService) {
        this.postsService = postsService;
        this.s3Service = s3Service;
        this.userService = userService;
        this.postDownloadService = postDownloadService;
        this.fileUploadService = fileUploadService;
    }
    
    // Create a post with a file upload. The "post" part contains the post's JSON data,
    // while the "file" part is the uploaded song file.
    @PostMapping(path ="/create")
    public PostsDTO createPost(@RequestPart("post") String postJson,
                            @RequestPart("file") MultipartFile file) throws IOException {
                    
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        String email = authentication.getName();
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        // Validate file type and size based on user role
        //validateFileTypeForUser(file, user);
        fileUploadService.validateFileForUserByCategory(file, user, "audio"); // Role-based size limits and file types
        
        // Upload file to S3 bucket with unique filename and folder organization
        String keyName = fileUploadService.generateUniqueFilenameWithFolder(file, "audio/posts");
        File tempFile = File.createTempFile("temp", null);
        file.transferTo(tempFile);
        String filePath = tempFile.getAbsolutePath();
        
        // Upload the file and get its S3 URL
        String s3Url = s3Service.uploadFile(keyName, filePath);
        tempFile.delete();
        
        // Parse post JSON and set fields
        ObjectMapper mapper = new ObjectMapper();
        Posts posts = mapper.readValue(postJson, Posts.class);
        
        // Set the S3 URL (e.g., to the "music" field) in the Posts entity
        posts.setMusic(s3Url);
        
        // Create the post and return the DTO
        Posts createdPost = postsService.createPost(user.getId(), posts);
        return postsService.getPostById(createdPost.getId());
    }
    
    // Create a post with async file upload to prevent thread pool exhaustion
    @PostMapping(path ="/create-async", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CompletableFuture<PostsDTO> createPostAsync(@RequestPart("post") String postJson,
                            @RequestPart("file") MultipartFile file) throws IOException {
        // Get the authenticated user (capture for async propagation)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Validate file type and size based on user role
        validateFileTypeForUser(file, user);
        fileUploadService.validateFileForUserByCategory(file, user, "audio");
        
        // Generate unique filename and persist to a temp file to avoid loading the whole file into heap
        String keyName = fileUploadService.generateUniqueFilenameWithFolder(file, "audio/posts");
        java.io.File tempFile = java.io.File.createTempFile("post-upload-", ".tmp");
        file.transferTo(tempFile);

        // Upload file asynchronously from file path (streams from disk), then create post
        return s3Service.uploadFileAsync(keyName, tempFile.getAbsolutePath())
            .thenApply(s3Url -> {
                // Restore authentication in async thread
                SecurityContextHolder.getContext().setAuthentication(authentication);
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    Posts posts = mapper.readValue(postJson, Posts.class);
                    posts.setMusic(s3Url);
                    Posts createdPost = postsService.createPost(user.getUserName(), posts);
                    return postsService.getPostById(createdPost.getId());
                } catch (Exception e) {
                    throw new RuntimeException("Failed to create post after upload: " + e.getMessage(), e);
                } finally {
                    // Cleanup and avoid leaking auth to other tasks on this thread
                    try { tempFile.delete(); } catch (Exception ignore) {}
                    SecurityContextHolder.clearContext();
                }
            })
            .exceptionally(throwable -> {
                try { tempFile.delete(); } catch (Exception ignore) {}
                throw new RuntimeException("Failed to create post: " + throwable.getMessage(), throwable);
            });
    }
    
    @PatchMapping("/update/{id}")
    public Posts updatePost(@PathVariable String id, @RequestBody Posts posts) {
        return postsService.updatePost(id, posts);
    }
    @PostMapping("view/{id}")
    public void AddView(@PathVariable String id, @RequestParam(required = false) String userName) {
        String finalUserName;
        
        if (userName != null && !userName.isEmpty()) {
            // Frontend passed a username (could be "unknown")
            finalUserName = userName;
        } else {
            // Try to get authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                // No auth, treat as unknown user
                finalUserName = "unknown";
            } else {
                String email = authentication.getName();
                User user = userService.findByUsernameOrEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
                finalUserName = user.getUserName();
            }
        }
        
        postsService.addView(id, finalUserName);
    }
    
    @GetMapping("/views/{id}")
    public List<ViewsDTO> getPostViews(@PathVariable String id) {
        return postsService.getPostViews(id);
    }

    @PostMapping("/download/{id}")
    public ResponseEntity<String> trackDownload(@PathVariable String id, @RequestParam(required = false) String userName) {
        String finalUserName;
        String finalUserId;
        
        if (userName != null && !userName.isEmpty()) {
            // Frontend passed a username (could be "unknown")
            finalUserName = userName;
            finalUserId = "unknown".equals(userName) ? "unknown" : null;
        } else {
            // Try to get authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                // No auth, treat as unknown user
                finalUserName = "unknown";
                finalUserId = "unknown";
            } else {
                String email = authentication.getName();
                User user = userService.findByUsernameOrEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
                finalUserName = user.getUserName();
                finalUserId = user.getId();
            }
        }
        
        // Create download record
        postDownloadService.createDownload(id, finalUserId, finalUserName);
        
        // Increment total downloads counter
        postsService.incrementTotalDownloads(id);
        
        // Only send notification if it's a real user
        if (!"unknown".equals(finalUserName)) {
            postsService.notifyDownload(id, finalUserName);
        }
        
        return ResponseEntity.ok("Download tracked successfully");
    }
    
    @GetMapping("/downloads/{id}")
    public List<PostDownloadDTO> getPostDownloads(@PathVariable String id) {
        return postDownloadService.getDownloadsForPost(id);
    }
    
    @GetMapping("/downloads/{id}/count")
    public long getPostDownloadCount(@PathVariable String id) {
        return postDownloadService.getDownloadCountForPost(id);
    }
    
    @GetMapping("/downloads/{id}/paginated")
    public PagedModel<PostDownloadDTO> getPostDownloadsPaginated(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return postDownloadService.getDownloadsForPostPaginated(id, page, size);
    }
    
    
    @GetMapping("/views/{id}/paginated")
    public PagedModel<ViewsDTO> getPostViewsPaginated(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return postsService.getPostViewsPaginated(id, page, size);
    }
    
    @GetMapping("/views/{id}/summary")
    public PostViewService.PostViewSummary getPostViewSummary(@PathVariable String id) {
        return postsService.getPostViewSummary(id);
    }
    
    @GetMapping("/comments/{id}/paginated")
    public PagedModel<CommentDTO> getPostCommentsPaginated(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return postsService.getPostCommentsPaginated(id, page, size);
    }
    
    
    @GetMapping("/likes/{id}/paginated")
    public PagedModel<LikesDTO> getPostLikesPaginated(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return postsService.getPostLikesPaginated(id, page, size);
    }
    
    @GetMapping("/likes/{id}/summary")
    public PostLikeService.PostLikeSummary getPostLikeSummary(@PathVariable String id) {
        return postsService.getPostLikeSummary(id);
    }
    
    @GetMapping("/likes/{id}/check/{userName}")
    public boolean hasUserLikedPost(@PathVariable String id, @PathVariable String userName) {
        return postsService.hasUserLikedPost(id, userName);
    }
    
    
    @GetMapping("/get")
    public PagedModel<PostsDTO> getAllPosts(@RequestParam( defaultValue = "0") int page,
    @RequestParam( defaultValue = "6") int size) {

        return postsService.getAllPagedPosts(page, size);
    }

    @GetMapping("/get/search")
    public PagedModel<PostsDTO> getSearchedPosts(@RequestParam( defaultValue = "0") int page,
    @RequestParam( defaultValue = "6") int size, @RequestParam String search) {

        return postsService.getSearchedPost(page, size, search);
    }
    
    // Comprehensive search endpoint with multiple filters and sorting
    @GetMapping("/get/advanced-search")
    public PagedModel<PostsDTO> advancedSearch(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String genres,
            @RequestParam(defaultValue = "time") String sortBy) {
        
        // Parse genres from comma-separated string
        List<String> genreList = null;
        if (genres != null && !genres.trim().isEmpty()) {
            genreList = Arrays.asList(genres.split(","));
        }
        
        return postsService.searchPosts(search, genreList, sortBy, page, size);
    }
    

    @GetMapping("/get/id/{id}")
    public PostsDTO getPostById(@PathVariable String id, Posts posts) {
        return postsService.getPostById(id);
    }
    
    @GetMapping("get/title/{title}")
    public List<PostsDTO> getPostsByTitle(@PathVariable String title) {
        return postsService.getPostsbyTitle(title);
    }
    
    @GetMapping("/get/likesdesc")
    public PagedModel<PostsDTO> getPostsByLikesDesc(@RequestParam( defaultValue = "0") int page,
    @RequestParam( defaultValue = "5") int size) {
        return postsService.findByLikesDesc(page,size);
    }
    
    @GetMapping("/get/likesdesc/role/{role}")
    public PagedModel<PostsDTO> getPostsByLikesDescFilteredByRole(@PathVariable String role,
    @RequestParam( defaultValue = "0") int page,
    @RequestParam( defaultValue = "5") int size) {
        return postsService.findByUserRoleOrderByLikesDesc(role, page, size);
    }
    
    @DeleteMapping("/delete/{id}")
    public void deletePost(@PathVariable String id) {
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get the post to check if user is the author
        PostsDTO post = postsService.getPostById(id);
        if (post == null) {
            throw new RuntimeException("Post not found");
        }
        
        // Check if the authenticated user is the author of the post
        if (!post.author().userName().equals(user.getUserName())) {
            throw new RuntimeException("You can only delete your own posts");
        }
        
        postsService.deletePost(id);
    }
    
    @GetMapping("/get/featuredOn/{userName}")
    public List<PostsDTO> getFeaturedOn(@PathVariable String userName) {
        return postsService.getFeaturedOn(userName);
    }

    @GetMapping("/get/all/id/{ids}")
    public PagedModel<PostsDTO> getAllById(@PathVariable List<String> ids, @RequestParam( defaultValue = "0") int page,
    @RequestParam( defaultValue = "5") int size) {
        
        return postsService.getAllById(ids, page, size);
    }
    
    @GetMapping("/get/all/id/{ids}/sorted")
    public PagedModel<PostsDTO> getAllByIdSorted(@PathVariable List<String> ids, @RequestParam( defaultValue = "0") int page,
    @RequestParam( defaultValue = "5") int size) {
        
        return postsService.getAllByIdSortedByTime(ids, page, size);
    }
    
    @GetMapping("get/all/featuredOn/{ids}")
    public PagedModel<PostsDTO> getAllFeatureOn(@PathVariable List<String> ids, @RequestParam int page,
    @RequestParam int size) {
        return postsService.getAllById(ids, page, size);
    }
    
    @GetMapping("get/all/featuredOn/{ids}/sorted")
    public PagedModel<PostsDTO> getAllFeatureOnSorted(@PathVariable List<String> ids, @RequestParam int page,
    @RequestParam int size) {
        return postsService.getAllByIdSortedByTime(ids, page, size);
    }
    @PostMapping("/add/like/{id}")
    public ResponseEntity<String> addLikes(@PathVariable String id){
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        postsService.addLike(id, user.getUserName());
        return ResponseEntity.ok("like toggled");
    }
    
    @PostMapping("/add/comment/{id}")
    public ResponseEntity<String> addComment(@PathVariable String id, @RequestBody String comment){
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        postsService.addComment(id, user.getUserName(), comment);
        return ResponseEntity.ok("comment added");
    }
    
    @DeleteMapping("/delete/comment/{commentId}")
    public boolean deleteComment(@PathVariable String commentId){
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return postsService.deleteCommentById(commentId, user.getUserName());
    }
    
    @PostMapping("/approve-feature/{postId}")
    public boolean approveFeature(@PathVariable String postId) {
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return postsService.approveFeature(postId, user.getUserName());
    }
    
    @PostMapping("/reject-feature/{postId}")
    public boolean rejectFeature(@PathVariable String postId) {
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return postsService.rejectFeature(postId, user.getUserName());
    }
    
    @GetMapping("/pending-features")
    public List<PostsDTO> getPendingFeatureRequests() {
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return postsService.getPendingFeatureRequests(user.getUserName());
    }
    
    /**
     * Validates file type based on user role
     * USER: only .mp3 files
     * USERPLUS: .mp3 and .wav files
     * No other file types are allowed
     */
    private void validateFileTypeForUser(MultipartFile file, User user) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is required");
        }
        
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new RuntimeException("Invalid file name");
        }
        
        // Get file extension
        String fileExtension = "";
        int lastDotIndex = originalFilename.lastIndexOf('.');
        if (lastDotIndex > 0) {
            fileExtension = originalFilename.substring(lastDotIndex + 1).toLowerCase();
        }
        
        // Check MIME type as additional validation
        String contentType = file.getContentType();
        
        String userRole = user.getRole();
        
        if ("USERPLUS".equals(userRole)) {
            // USERPLUS can upload .mp3 and .wav files
            if (!"mp3".equals(fileExtension) && !"wav".equals(fileExtension)) {
                throw new RuntimeException("Plus users can only upload MP3 and WAV files. Uploaded file type: " + fileExtension);
            }
            
            // Additional MIME type validation for USERPLUS
            if (contentType != null && 
                !contentType.equals("audio/mpeg") && 
                !contentType.equals("audio/mp3") && 
                !contentType.equals("audio/wav") && 
                !contentType.equals("audio/wave") &&
                !contentType.equals("audio/x-wav")) {
                throw new RuntimeException("Invalid file type. Plus users can only upload MP3 and WAV audio files.");
            }
            
        } else if ("USER".equals(userRole)) {
            // Regular USER can only upload .mp3 files
           
            if (!"mp3".equals(fileExtension)) {
                throw new RuntimeException("Free users can only upload MP3 files. Uploaded file type: " + fileExtension + ". Upgrade to Plus for WAV support!");
            }
            
            // Additional MIME type validation for USER
            if (contentType != null && 
                !contentType.equals("audio/mpeg") && 
                !contentType.equals("audio/mp3")) {
                throw new RuntimeException("Invalid file type. Free users can only upload MP3 audio files. Upgrade to Plus for more formats!");
            }
            
        } else {
            // Unknown role or no role - deny upload
            throw new RuntimeException("Invalid user role. Cannot upload files.");
        }
        
        // Additional file size validation (optional - adjust as needed)
        long maxFileSize = "USERPLUS".equals(userRole) ? 90 * 1024 * 1024 : 15 * 1024 * 1024; // 90MB for Plus, 15MB for free
        if (file.getSize() > maxFileSize) {
            long maxSizeMB = maxFileSize / (1024 * 1024);
            throw new RuntimeException("File size exceeds limit. Maximum allowed: " + maxSizeMB + "MB for " + userRole + " users.");
        }
    }

}