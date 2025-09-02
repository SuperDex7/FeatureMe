package Feat.FeatureMe.Controller;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import Feat.FeatureMe.Dto.PostsDTO;
import Feat.FeatureMe.Entity.Posts;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.PostsService;
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
    
    @GetMapping("/get")
    public List<PostsDTO> getAllPosts() {
        return postsService.getAllPosts();
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
    public List<PostsDTO> getPostsByLikesDesc(Posts post) {
        return postsService.findByLikesDesc(post);
    }
    
    @DeleteMapping("/delete/{id}")
    public void deletePost(@PathVariable String id) {
        postsService.deletePost(id);
    }
    
    @GetMapping("/get/featuredOn/{userName}")
    public List<PostsDTO> getFeaturedOn(@PathVariable String userName) {
        return postsService.getFeaturedOn(userName);
    }

    @GetMapping("/get/all/id/{ids}")
    public List<PostsDTO> getAllById(@PathVariable List<String> ids) {
        return postsService.getAllById(ids);
    }
    @GetMapping("get/all/featuredOn/{ids}")
    public List<PostsDTO> getAllFeatureOn(@PathVariable List<String> ids) {
        return postsService.getAllById(ids);
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
    /* 
    @DeleteMapping("/posts/{postId}/comments/{commentId}")
public ResponseEntity<?> deleteComment(@PathVariable String postId, 
                                     @PathVariable String commentId,
                                     @RequestHeader("Authorization") String token) {
    
    // 1. Extract user from JWT token
    String currentUser = jwtService.extractUsername(token.replace("Bearer ", ""));
    
    // 2. Find the comment in the post
    Posts post = postsRepository.findById(postId)
        .orElseThrow(() -> new RuntimeException("Post not found"));
    
    Comment commentToDelete = post.getComments().stream()
        .filter(c -> c.getId().equals(commentId))
        .findFirst()
        .orElseThrow(() -> new CommentNotFoundException(commentId));
    
    // 3. Check authorization (comment owner OR post owner)
    if (!commentToDelete.getUserName().equals(currentUser) && 
        !post.getAuthor().getUserName().equals(currentUser)) {
        throw new UnauthorizedException("Cannot delete this comment");
    }
    
    // 4. Delete the comment
    post.getComments().removeIf(c -> c.getId().equals(commentId));
    postsRepository.save(post);
    
    return ResponseEntity.ok().build();
}
    */
    

}