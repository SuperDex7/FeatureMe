package Feat.FeatureMe.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import Feat.FeatureMe.Dto.CommentDTO;
import Feat.FeatureMe.Dto.CommentedOnDTO;
import Feat.FeatureMe.Dto.LikesDTO;
import Feat.FeatureMe.Dto.PostsDTO;
import Feat.FeatureMe.Dto.UserPostsDTO;
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
    

    private List<LikesDTO> convertUsernamesToLikesDTO(List<String> usernames) {
        if (usernames == null || usernames.isEmpty()) {
            return List.of();
        }
        
        return usernames.stream()
            .map(username -> {
                User user = userRepository.findByUserName(username).orElse(null);
                if (user != null) {
                    return new LikesDTO(user.getUserName(), user.getProfilePic(), LocalDateTime.now());
                } else {
                    // Fallback for deleted users
                    return new LikesDTO(username, null, LocalDateTime.now());
                }
            })
            .toList();
    }
        
    public Posts createPost(String authoruserName, Posts posts) {
        User author = userRepository.findByUserName(authoruserName)
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
        new UserPostsDTO(
            author.getId(),
            author.getUserName(),
            author.getProfilePic(),
            author.getBanner(),
            author.getBio(),
            author.getLocation()
                    
        ),
        savedPost.getTitle(),
        savedPost.getDescription(),
        savedPost.getFeatures(),
        savedPost.getGenre(),
        savedPost.getMusic(),
        savedPost.getComments(),
        savedPost.getTime(),
        convertUsernamesToLikesDTO(savedPost.getLikes())
    );

        // Update user's posts list
        if (author.getPosts() == null) {
            author.setPosts(new ArrayList<>());
        }
        author.getPosts().add(savedPost.getId());
        userRepository.save(author);

        List<User> features = userRepository.findByUserNameIn(post.getFeatures());
        
        for(int i = 0; i < features.size(); i++){
            if(features.get(i).getFeaturedOn() == null){
                features.get(i).setFeaturedOn(new ArrayList<>());
            }
            features.get(i).getFeaturedOn().add(postDto.id());
            userRepository.save(features.get(i));
        }
        /* 
        if(author.getFeaturedOn() == null){
            author.setFeaturedOn(new ArrayList<>());
        }
        author.getFeaturedOn().add(postDto.id());
        userRepository.save(author);
*/
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
            UserPostsDTO author = new UserPostsDTO(
                u.getId(),
                u.getUserName(),
                u.getProfilePic(),
                u.getBanner(),
                u.getBio(),
                u.getLocation() 
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
                convertUsernamesToLikesDTO(p.getLikes())
            );
        }).toList();
    }
    
    
    
    public PostsDTO getPostById(String id) {
        Posts post = postsRepository.findById(id)
                   .orElseThrow(() -> new IllegalArgumentException("Post not found"));
    User u = post.getAuthor();
    UserPostsDTO author = new UserPostsDTO(
        u.getId(),
        u.getUserName(),
        u.getProfilePic(),
        u.getBanner(),
        u.getBio(),
        u.getLocation()
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
        convertUsernamesToLikesDTO(post.getLikes())
    );
    }
    
    
    public List<PostsDTO> getPostsbyTitle(String getTitle){
        return postsRepository.findByTitleStartingWithIgnoreCase(getTitle);
    }
    
    
    public List<PostsDTO> findByLikesDesc(Posts posts){
        return postsRepository.findAllByOrderByLikesDesc().stream().map(p -> {
            User u = p.getAuthor();
            UserPostsDTO author = new UserPostsDTO(
                u.getId(),
                u.getUserName(),
                u.getProfilePic(),
                u.getBanner(),
                u.getBio(),
                u.getLocation()
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
                convertUsernamesToLikesDTO(p.getLikes())
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

    public List<PostsDTO> getFeaturedOn(String userName){
        return postsRepository.findByFeatures(userName).stream().map(p -> {
            User u = p.getAuthor();
            UserPostsDTO author = new UserPostsDTO(
                u.getId(),
                u.getUserName(),
                u.getProfilePic(),
                u.getBanner(),
                u.getBio(),
                u.getLocation()
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
                convertUsernamesToLikesDTO(p.getLikes())
            );
        }).toList();
    
    }




    public List<PostsDTO> getAllById(List<String> ids ) {
       
        return postsRepository.findAllById(ids).stream().map(p -> {
            User u = p.getAuthor();
            UserPostsDTO author = new UserPostsDTO(
                u.getId(),
                u.getUserName(),
                u.getProfilePic(),
                u.getBanner(),
                u.getBio(),
                u.getLocation()
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
                convertUsernamesToLikesDTO(p.getLikes())
            );
        }).toList();
    }

    public Optional<Posts> addLike(String id, String userName){
        Optional<Posts> post = postsRepository.findById(id);
    if (post.isPresent()) {
        Posts foundPost = post.get();
        List<String> currentLikes = foundPost.getLikes();
        
        // Initialize likes list if it's null
        if (currentLikes == null) {
            currentLikes = new ArrayList<>();
        }
        
        // Add the username if it's not already in the list
        if (!currentLikes.contains(userName)) {
            currentLikes.add(userName);
            foundPost.setLikes(currentLikes);
            
            // Save the updated post
            Posts savedPost = postsRepository.save(foundPost);
            User user = userRepository.findByUserName(userName).orElseThrow(() -> new IllegalArgumentException("User not found"));
            if(user.getLikedPosts() == null){
                user.setLikedPosts(new ArrayList<>());
            }
            user.getLikedPosts().add(id);
            userRepository.save(user);
            return Optional.of(savedPost);
        }else{
            currentLikes.remove(userName);
            foundPost.setLikes(currentLikes);
            Posts savedPost = postsRepository.save(foundPost);
            User user = userRepository.findByUserName(userName).orElseThrow(() -> new IllegalArgumentException("User not found"));
            user.getLikedPosts().remove(id);
            userRepository.save(user);
            if(user.getLikedPosts() == null){
                user.setLikedPosts(new ArrayList<>());
            }
            return Optional.of(savedPost);
        }
    }

    return post; // Return original post if no changes made
    }

    public Optional<Posts> addComment(String id, String userName, String comment){
        Optional<Posts> post = postsRepository.findById(id);
        User user = userRepository.findByUserName(userName).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if(post.isPresent()){
            Posts foundPost = post.get();
            List<CommentDTO> currentComments = foundPost.getComments();
            if(currentComments == null){
                currentComments = new ArrayList<>();
            }
            currentComments.add(new CommentDTO(userName,user.getProfilePic(), comment, LocalDateTime.now()));
            foundPost.setComments(currentComments);
            Posts savedPost = postsRepository.save(foundPost);
            if(user.getComments() == null){
                user.setComments(new ArrayList<>());
            }
            user.getComments().add(new CommentedOnDTO(id, comment, LocalDateTime.now()));
            userRepository.save(user);
            return Optional.of(savedPost);
        }
        return post;

        }
    }


