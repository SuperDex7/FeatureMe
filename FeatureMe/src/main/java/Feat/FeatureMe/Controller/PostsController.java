package Feat.FeatureMe.Controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Feat.FeatureMe.Entity.Posts;
import Feat.FeatureMe.Service.PostsService;

@RestController
@RequestMapping("/api/posts")
public class PostsController {
    
    private final PostsService postsService;

    public PostsController(PostsService postsService) {
        this.postsService = postsService;
    }
    @PostMapping("/create")
    public Posts createPost(@RequestBody Posts posts) {
    return postsService.createPost(posts);
    }
    @PutMapping("/update/{id}")
    public Posts updatePost(@PathVariable String id, @RequestBody Posts posts) {
        return postsService.createPost(posts);
    
    }
    @GetMapping("/get")
    public List<Posts> getAllPosts() {
        return postsService.getAllPosts();
    }
    @GetMapping("/get/{id}")
    public void getPostByName(@PathVariable String id, Posts posts) {
        postsService.getPostByName(id);

    }
    @DeleteMapping("/delete/{id}")
    public void deletePost(@PathVariable String id) {
        // Check if the post exists before attempting to delete it
        if (!postsService.getPostByName(id).isPresent()) {
            throw new IllegalArgumentException("Post with id " + id + " does not exist.");
        }
        // Delete the post by its ID
       postsService.deletePost(id);
    }
}
