package Feat.FeatureMe.Controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Feat.FeatureMe.Dto.PostsDTO;
import Feat.FeatureMe.Entity.Posts;
import Feat.FeatureMe.Service.PostsService;




@CrossOrigin("*")
@RestController
@RequestMapping("/api/posts")
public class PostsController {
    
    private final PostsService postsService;

    public PostsController(PostsService postsService) {
        this.postsService = postsService;
    }
    @PostMapping("/create/{id}")
    public Posts createPost(@PathVariable String id, @RequestBody Posts posts) {
    return postsService.createPost(id, posts);
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
    public void getPostById(@PathVariable String id, Posts posts) {
        postsService.getPostById(id);

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
        // Check if the post exists before attempting to delete it
        if (!postsService.getPostById(id).isPresent()) {
            throw new IllegalArgumentException("Post with id " + id + " does not exist.");
        }
        // Delete the post by its ID
       postsService.deletePost(id);
    }
}
