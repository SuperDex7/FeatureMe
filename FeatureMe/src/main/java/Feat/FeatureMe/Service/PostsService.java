package Feat.FeatureMe.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import Feat.FeatureMe.Dto.PostsDTO;
import Feat.FeatureMe.Dto.UserDTO;
import Feat.FeatureMe.Entity.Posts;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.PostsRepository;
import Feat.FeatureMe.Repository.UserRepository;

@Service
public class PostsService {

    private final PostsRepository postsRepository;
    private final UserRepository userRepository;
    
    public PostsService(PostsRepository postsRepository, UserRepository userRepository) {
        this.postsRepository = postsRepository;
        this.userRepository = userRepository;
    }
    public Posts createPost(String authorId, Posts posts) {
        User author = userRepository.findById(authorId)
                         .orElseThrow(() -> new IllegalArgumentException("User not found"));
                         Posts post = new Posts(
            null,
            author,
            posts.title(),
            posts.description(),
            posts.features(),
            posts.genre(),
            posts.music(),
            posts.comments(),
            LocalDate.now(),
            List.of()
        );
        return postsRepository.insert(post);
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
    
    public List<PostsDTO> getAllPosts() {
        return postsRepository.findAll().stream().map(p -> {
            User u = p.author();
            UserDTO author = new UserDTO(
                    u.getId(),
                    u.getUserName(),
                    u.getProfilePic(),
                    u.getBanner()
            );
            return new PostsDTO(
                    p.id(),
                    author,
                    p.title(),
                    p.description(),
                    p.features(),
                    p.genre(),
                    p.music(),
                    p.comments(),
                    p.time(),
                    p.likes() == null ? 0 : p.likes().size()
            );
        }).toList();
    }
    
    public Optional<Posts> getPostById(String id) {
        return postsRepository.findById(id);
    }
    public List<PostsDTO> getPostsbyTitle(String title){
        return postsRepository.findByTitleStartingWithIgnoreCase(title);
    }
    public List<PostsDTO> findByLikesDesc(Posts posts){
        return postsRepository.findAllByOrderByLikesDesc().stream().map(p -> {
            User u = p.author();
            UserDTO author = new UserDTO(
                    u.getId(),
                    u.getUserName(),
                    u.getProfilePic(),
                    u.getBanner()
            );
            return new PostsDTO(
                    p.id(),
                    author,
                    p.title(),
                    p.description(),
                    p.features(),
                    p.genre(),
                    p.music(),
                    p.comments(),
                    p.time(),
                    p.likes() == null ? 0 : p.likes().size()
            );
        }).toList();
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
