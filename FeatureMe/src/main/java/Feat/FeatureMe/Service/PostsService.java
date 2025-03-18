package Feat.FeatureMe.Service;

import org.springframework.stereotype.Service;

import Feat.FeatureMe.Repository.PostsRepository;

@Service
public class PostsService {

    private final PostsRepository postsRepository;

    public PostsService(PostsRepository postsRepository) {
        this.postsRepository = postsRepository;
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
