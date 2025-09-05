package Feat.FeatureMe.Controller;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.data.web.PagedModel;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
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
import Feat.FeatureMe.Entity.Posts;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.PostsService;
import Feat.FeatureMe.Service.PostViewService;
import Feat.FeatureMe.Service.PostCommentService;
import Feat.FeatureMe.Service.PostLikeService;
import Feat.FeatureMe.Service.S3Service;
import Feat.FeatureMe.Service.UserService;




@CrossOrigin("*")
@RestController
@RequestMapping("/api/posts")
public class PostsController {
    
    private final PostsService postsService;
    private final S3Service s3Service;
    private final UserService userService;
    
    public PostsController(PostsService postsService, S3Service s3Service, UserService userService) {
        this.postsService = postsService;
        this.s3Service = s3Service;
        this.userService = userService;
    }
    
    // Create a post with a file upload. The "post" part contains the post's JSON data,
    // while the "file" part is the uploaded song file.
    @PostMapping(path ="/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PostsDTO createPost(@RequestPart("post") Posts posts,
                            @RequestPart("file") MultipartFile file) throws IOException {
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Upload file to S3 bucket
        String keyName = file.getOriginalFilename();
        File tempFile = File.createTempFile("temp", null);
        file.transferTo(tempFile);
        String filePath = tempFile.getAbsolutePath();
        
        // Upload the file and get its S3 URL
        String s3Url = s3Service.uploadFile(keyName, filePath);
        
        // Set the S3 URL (e.g., to the "music" field) in the Posts entity
        posts.setMusic(s3Url);
        
        // Create the post and return the DTO
        Posts createdPost = postsService.createPost(user.getUserName(), posts);
        return postsService.getPostById(createdPost.getId());
    }
    
    @PatchMapping("/update/{id}")
    public Posts updatePost(@PathVariable String id, @RequestBody Posts posts) {
        return postsService.updatePost(id, posts);
    }
    @PostMapping("view/{id}")
    public void AddView(@PathVariable String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        postsService.addView(id, user.getUserName());
    }
    
    @GetMapping("/views/{id}")
    public List<ViewsDTO> getPostViews(@PathVariable String id) {
        return postsService.getPostViews(id);
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
    
    @GetMapping("/comments/{id}/summary")
    public PostCommentService.PostCommentSummary getPostCommentSummary(@PathVariable String id) {
        return postsService.getPostCommentSummary(id);
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
    @GetMapping("get/all/featuredOn/{ids}")
    public PagedModel<PostsDTO> getAllFeatureOn(@PathVariable List<String> ids, @RequestParam int page,
    @RequestParam int size) {
        return postsService.getAllById(ids, page, size);
    }
    @PostMapping("/add/like/{id}")
    public Optional<Posts> addLikes(@PathVariable String id){
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return postsService.addLike(id, user.getUserName());
    }
    
    @PostMapping("/add/comment/{id}")
    public Optional<Posts> addComment(@PathVariable String id, @RequestBody String comment){
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return postsService.addComment(id, user.getUserName(), comment);
    }
    
    @DeleteMapping("/delete/comment/{postId}")
    public Optional<Posts> deleteComment(@PathVariable String postId, @RequestBody String commentText){
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = authentication.getName();
        User user = userService.findByUsernameOrEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return postsService.deleteComment(postId, user.getUserName(), commentText);
    }
    
    

}