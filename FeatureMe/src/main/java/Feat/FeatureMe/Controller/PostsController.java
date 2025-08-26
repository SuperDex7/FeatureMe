package Feat.FeatureMe.Controller;

import java.io.File;
import java.io.IOException;
import java.util.List;

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

import Feat.FeatureMe.Dto.PostsDTO;
import Feat.FeatureMe.Entity.Posts;
import Feat.FeatureMe.Service.PostsService;
import Feat.FeatureMe.Service.S3Service;
import org.springframework.web.bind.annotation.RequestParam;


@CrossOrigin("*")
@RestController
@RequestMapping("/api/posts")
public class PostsController {
    
    private final PostsService postsService;
    private final S3Service s3Service;

    
    public PostsController(PostsService postsService, S3Service s3Service) {
        this.postsService = postsService;
        this.s3Service = s3Service;
    }
    
    // Create a post with a file upload. The "post" part contains the post's JSON data,
    // while the "file" part is the uploaded song file.
    @PostMapping(path ="/create/{userName}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PostsDTO createPost(@PathVariable String userName, 
                            @RequestPart("post") Posts posts,
                            @RequestPart("file") MultipartFile file) throws IOException {
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
        Posts createdPost = postsService.createPost(userName, posts);
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
    public List<Posts> getAllById(@PathVariable List<String> ids) {
        return postsService.getAllById(ids);
    }
    @GetMapping("get/all/featuredOn/{ids}")
    public List<Posts> getAllFeatureOn(@PathVariable List<String> ids) {
        return postsService.getAllById(ids);
    }
    
    

}