package Feat.FeatureMe.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
        posts.getTitle(),
        posts.getDescription(),
        posts.getFeatures(),
        posts.getGenre(),
        posts.getMusic(),
        posts.getComments(),
        LocalDateTime.now(),
        List.of()
    );
    Posts savedPost = postsRepository.insert(post);
    PostsDTO postDto = new PostsDTO(
        savedPost.getId(),
        new UserDTO(
            author.getId(),
            author.getUserName(),
            author.getProfilePic(),
            author.getBanner(),
            author.getBio(),
            author.getAbout(),
            null,
            author.getFriends(),
            author.getFollowers(),
            author.getPosts() != null ? author.getPosts().stream().map(
                p -> new PostsDTO(
                    p.id(),
                    p.author(),
                    p.title(),
                    p.description(),
                    p.features(),
                    p.genre(),
                    p.music(),
                    p.comments(),
                    p.time(),
                    p.likes()  // already a list of Strings
                )
            ).toList() : List.of(),
            author.getFollowing()
        ),
        savedPost.getTitle(),
        savedPost.getDescription(),
        savedPost.getFeatures(),
        savedPost.getGenre(),
        savedPost.getMusic(),
        savedPost.getComments(),
        savedPost.getTime(),
        savedPost.getLikes() == null ? List.of() : savedPost.getLikes()
    );

        // Update user's posts list
        if (author.getPosts() == null) {
            author.setPosts(new ArrayList<>());
        }
        author.getPosts().add(postDto);
        userRepository.save(author);

        return savedPost;
        
    }
    
    
    public Posts updatePost(String id, Posts updatedPosts){
        Posts posts = postsRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("posts not found"));
        posts = new Posts(
            posts.getId(),
            posts.getAuthor(),
            updatedPosts.getTitle() != null && !updatedPosts.getTitle().isBlank() ? updatedPosts.getTitle() : posts.getTitle(),
            updatedPosts.getDescription() != null && !updatedPosts.getDescription().isBlank() ? updatedPosts.getDescription() : posts.getDescription(),
            updatedPosts.getFeatures() != null && !updatedPosts.getFeatures().isEmpty() ? updatedPosts.getFeatures() : posts.getFeatures(),
            updatedPosts.getGenre() != null && !updatedPosts.getGenre().isEmpty() ? updatedPosts.getGenre() : posts.getGenre(),
            updatedPosts.getMusic() != null && !updatedPosts.getMusic().isBlank() ? updatedPosts.getMusic() : posts.getMusic(),
            updatedPosts.getComments() != null && !updatedPosts.getComments().isEmpty() ? updatedPosts.getComments() : posts.getComments(),
            updatedPosts.getTime() != null ? updatedPosts.getTime() : posts.getTime(),
            updatedPosts.getLikes() != null && !updatedPosts.getLikes().isEmpty() ? updatedPosts.getLikes() : posts.getLikes()
    
        );
        return postsRepository.save(posts);
    }
    
    
    public List<PostsDTO> getAllPosts() {
        return postsRepository.findAll().stream().map(p -> {
            User u = p.getAuthor();
            UserDTO author = new UserDTO(
                u.getId(),
                u.getUserName(),
                u.getProfilePic(),
                u.getBanner(),
                u.getBio(),
                u.getAbout(),
                null, 
                u.getFriends(),
                u.getFollowers(),
                u.getPosts(),
                u.getFollowing()
            );
            return new PostsDTO(
                p.getId(),
                author,
                p.getTitle(),
                p.getDescription(),
                p.getFeatures(),
                p.getGenre(),
                p.getMusic(),
                p.getComments(),
                p.getTime(),
                p.getLikes() == null ? List.of() : p.getLikes()
            );
        }).toList();
    }
    
    
    
    public PostsDTO getPostById(String id) {
        Posts post = postsRepository.findById(id)
                   .orElseThrow(() -> new IllegalArgumentException("Post not found"));
    User u = post.getAuthor();
    UserDTO author = new UserDTO(
        u.getId(),
        u.getUserName(),
        u.getProfilePic(),
        u.getBanner(),
        u.getBio(),
        u.getAbout(),
        null, 
        u.getFriends(),
        u.getFollowers(),
        u.getPosts(),
        u.getFollowing()
    );
    return new PostsDTO(
        post.getId(),
        author,
        post.getTitle(),
        post.getDescription(),
        post.getFeatures(),
        post.getGenre(),
        post.getMusic(),
        post.getComments(),
        post.getTime(),
        post.getLikes() == null ? List.of() : post.getLikes()
    );
    }
    
    
    public List<PostsDTO> getPostsbyTitle(String getTitle){
        return postsRepository.findByTitleStartingWithIgnoreCase(getTitle);
    }
    
    
    public List<PostsDTO> findByLikesDesc(Posts posts){
        return postsRepository.findAllByOrderByLikesDesc().stream().map(p -> {
            User u = p.getAuthor();
            UserDTO author = new UserDTO(
                u.getId(),
                u.getUserName(),
                u.getProfilePic(),
                u.getBanner(),
                u.getBio(),
                u.getAbout(),
                null, 
                u.getFriends(),
                u.getFollowers(),
                u.getPosts(),
                u.getFollowing()
            );
            return new PostsDTO(
                p.getId(),
                author,
                p.getTitle(),
                p.getDescription(),
                p.getFeatures(),
                p.getGenre(),
                p.getMusic(),
                p.getComments(),
                p.getTime(),
                p.getLikes() == null ? List.of() : p.getLikes()
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
