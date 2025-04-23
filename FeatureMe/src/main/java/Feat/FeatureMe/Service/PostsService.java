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
    public Posts updatePost(String id, Posts updatedPosts){
        Posts posts = postsRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("posts not found"));
        posts = new Posts(
            posts.id(),
            posts.author(),
            updatedPosts.title() != null && !updatedPosts.title().isBlank() ? updatedPosts.title() : posts.title(),
            updatedPosts.description() != null && !updatedPosts.description().isBlank() ? updatedPosts.description() : posts.description(),
            updatedPosts.features() != null && !updatedPosts.features().isEmpty() ? updatedPosts.features() : posts.features(),
            updatedPosts.genre() != null && !updatedPosts.genre().isEmpty() ? updatedPosts.genre() : posts.genre(),
            updatedPosts.music() != null && !updatedPosts.music().isBlank() ? updatedPosts.music() : posts.music(),
            updatedPosts.comments() != null && !updatedPosts.comments().isEmpty() ? updatedPosts.comments() : posts.comments(),
            updatedPosts.time() != null ? updatedPosts.time() : posts.time(),
            updatedPosts.likes() != null && !updatedPosts.likes().isEmpty() ? updatedPosts.likes() : posts.likes()
    
        );
        return postsRepository.save(posts);
    }
    
    public List<Posts> getAllPosts() {
        return postsRepository.findAll();
    }
    public Optional<Posts> getPostById(String id) {
        return postsRepository.findById(id);
    }
    public List<Posts> getPostsbyTitle(String title){
        return postsRepository.findByTitleStartingWithIgnoreCase(title);
    }
    public List<Posts> findByLikesDesc(Posts posts){
        return postsRepository.findAllByOrderByLikesDesc(posts);
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
