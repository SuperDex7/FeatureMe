package Feat.FeatureMe.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import Feat.FeatureMe.Entity.Posts;
import Feat.FeatureMe.Repository.PostsRepository;

@Service
public class PostsService {

    private final PostsRepository postsRepository;

    public PostsService(PostsRepository postsRepository) {
        this.postsRepository = postsRepository;
    }
    public Posts createPost(Posts posts) {
        return postsRepository.insert(posts);
    }
    
    public List<Posts> getAllPosts() {
        return postsRepository.findAll();
    }
    public Optional<Posts> getPostByName(String id) {
        return postsRepository.findById(id);
    }
    public void deletePost(String id) {
        // Check if the post exists before attempting to delete it
        if (!postsRepository.existsById(id)) {
            throw new IllegalArgumentException("Post with id " + id + " does not exist.");
        }
        // Delete the post by its ID
      postsRepository.deleteById(id);
    }
}
