package Feat.FeatureMe.Controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Feat.FeatureMe.Service.PostsService;

@RestController
@RequestMapping("/api/posts")
public class PostsController {
    
    private final PostsService postsService;

    public PostsController(PostsService postsService) {
        this.postsService = postsService;
    }
    public void addPost() {

    }
    public void updatePost() {

    }
    public void getAllPosts() {

    }
    public void getPostByName() {

    }
    public void deletePost() {

    }
}
