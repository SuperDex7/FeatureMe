package Feat.FeatureMe.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import Feat.FeatureMe.Dto.CommentDTO;
import Feat.FeatureMe.Dto.CommentedOnDTO;
import Feat.FeatureMe.Dto.LikesDTO;
import Feat.FeatureMe.Dto.NotificationsDTO;
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
        
        // Create a copy and reverse to show newest likes first
        List<String> reversedUsernames = new ArrayList<>(usernames);
        Collections.reverse(reversedUsernames);
        
        return reversedUsernames.stream()
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
    
    private List<CommentDTO> convertCommentsToSortedDTO(List<CommentDTO> comments) {
        if (comments == null || comments.isEmpty()) {
            return List.of();
        }
        
        // Create a copy and reverse to show newest comments first
        List<CommentDTO> reversedComments = new ArrayList<>(comments);
        Collections.reverse(reversedComments);
        
        return reversedComments;
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
            if(features.get(i).getNotifications() == null){
                features.get(i).setNotifications(new ArrayList<>());
            }
            features.get(i).getFeaturedOn().add(postDto.id());
            features.get(i).getNotifications().add(new NotificationsDTO(postDto.id(), author.getUserName(), "Posted with you as a feature!", LocalDateTime.now()));
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
                convertCommentsToSortedDTO(p.getComments()),
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
        convertCommentsToSortedDTO(post.getComments()),
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
                convertCommentsToSortedDTO(p.getComments()),
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
                convertCommentsToSortedDTO(p.getComments()),
                p.getTime(),
                convertUsernamesToLikesDTO(p.getLikes())
            );
        }).toList();
    
    }




    public List<PostsDTO> getAllById(List<String> ids ) {
        // Fetch all posts by IDs
        List<Posts> posts = postsRepository.findAllById(ids);
        
        // Create a map for quick lookup
        Map<String, Posts> postsMap = posts.stream()
            .collect(Collectors.toMap(Posts::getId, p -> p));
        
        // Return posts in the same order as the input IDs
        return ids.stream()
            .map(id -> postsMap.get(id))
            .filter(Objects::nonNull) // Filter out any posts that weren't found
            .map(p -> {
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
                    convertCommentsToSortedDTO(p.getComments()),
                    p.getTime(),
                    convertUsernamesToLikesDTO(p.getLikes())
                );
            }).toList();
    }

    /**
     * Ensures notifications list doesn't exceed 30 items by removing oldest ones
     */
    private void cleanupNotifications(User user) {
        List<NotificationsDTO> notifications = user.getNotifications();
        if (notifications != null && notifications.size() > 30) {
            // Sort by time (oldest first) and keep only the 30 most recent
            notifications.sort((n1, n2) -> n1.time().compareTo(n2.time()));
            // Remove oldest notifications, keeping only the 30 newest
            notifications.subList(0, notifications.size() - 30).clear();
        }
    }

    public Optional<Posts> addLike(String id, String userName){
        Optional<Posts> post = postsRepository.findById(id);
        User author = post.get().getAuthor();
    if (post.isPresent()) {
        Posts foundPost = post.get();
        List<String> currentLikes = foundPost.getLikes();
        List<NotificationsDTO> currentNoti = author.getNotifications();
        
        // Initialize likes list if it's null
        if (currentLikes == null) {
            currentLikes = new ArrayList<>();
        }
        if(author.getNotifications() == null){
            author.setNotifications(new ArrayList<>());
        }
       
        NotificationsDTO noti = new NotificationsDTO(foundPost.getId(), userName, "Liked Your Post!", LocalDateTime.now());
        // Add the username if it's not already in the list
        if (!currentLikes.contains(userName)) {
            currentLikes.add(userName);
           
            // Save the updated post
            Posts savedPost = postsRepository.save(foundPost);
             User user = userRepository.findByUserName(userName).orElseThrow(() -> new IllegalArgumentException("User not found"));
            if(user.getLikedPosts() == null){
                user.setLikedPosts(new ArrayList<>());
            }
            
            user.getLikedPosts().add(id);
            author.getNotifications().add(noti);
            
            // Clean up notifications if they exceed 30
            cleanupNotifications(author);
            
            userRepository.save(author);
            userRepository.save(user);
            return Optional.of(savedPost);
        }else{
            currentLikes.remove(userName);
            // Remove the original notification that was created when the like was added
            if(currentNoti != null){
                currentNoti.removeIf(notification -> 
                notification.id() != null && 
                notification.id().equals(foundPost.getId()) && 
                notification.userName().equals(userName) && 
                notification.noti().equals("Liked Your Post!")
            );
            }else{
                author.setNotifications(new ArrayList<>());
            }
            
            Posts savedPost = postsRepository.save(foundPost);
            User user = userRepository.findByUserName(userName).orElseThrow(() -> new IllegalArgumentException("User not found"));
            user.getLikedPosts().remove(id);
            userRepository.save(user);
            userRepository.save(author);
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
        User author = post.get().getAuthor();
        User user = userRepository.findByUserName(userName).orElseThrow(() -> new IllegalArgumentException("User not found"));
        NotificationsDTO noti = new NotificationsDTO(id, user.getUserName(), "Commented on Your Post!",LocalDateTime.now());
        if(post.isPresent()){
            Posts foundPost = post.get();
            List<CommentDTO> currentComments = foundPost.getComments();
            if(currentComments == null){
                currentComments = new ArrayList<>();
            }
            if(author.getNotifications() == null){
                author.setNotifications(new ArrayList<>());
            }
            if(user.getComments() == null){
                        user.setComments(new ArrayList<>());
                    }
            currentComments.add(new CommentDTO(userName,user.getProfilePic(), comment, LocalDateTime.now()));
            
            
            foundPost.setComments(currentComments);
            Posts savedPost = postsRepository.save(foundPost);
            user.getComments().add(new CommentedOnDTO(id, comment, LocalDateTime.now()));
            author.getNotifications().add(noti);
            
            // Clean up notifications if they exceed 30
            cleanupNotifications(author);
            
            userRepository.save(author);
            userRepository.save(user);
            return Optional.of(savedPost);
        }
        return post;
    }

    public Optional<Posts> deleteComment(String postId, String userName, String commentText){
        Optional<Posts> post = postsRepository.findById(postId);
        if(post.isPresent()){
            Posts foundPost = post.get();
            User author = foundPost.getAuthor();
            User user = userRepository.findByUserName(userName).orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            List<CommentDTO> currentComments = foundPost.getComments();
            if(currentComments != null){
                // Remove the comment by matching username and comment text
                currentComments.removeIf(comment -> 
                    comment.userName() != null &&
                    comment.userName().equals(userName) && 
                    comment.comment() != null &&
                    comment.comment().equals(commentText)
                );
                foundPost.setComments(currentComments);
            }
            
            // Remove the notification that was created when the comment was added
            List<NotificationsDTO> currentNoti = author.getNotifications();
            if(currentNoti != null){
                currentNoti.removeIf(notification -> 
                    notification.id() != null &&
                    notification.id().equals(postId) && 
                    notification.userName() != null &&
                    notification.userName().equals(userName) && 
                    notification.noti() != null &&
                    notification.noti().equals("Commented on Your Post!")
                );
            }else{
                author.setNotifications(new ArrayList<>());
            }
            
            // Remove the comment from user's comments list
            List<CommentedOnDTO> userComments = user.getComments();
            if(userComments != null){
                userComments.removeIf(comment -> 
                    comment.id() != null &&
                    comment.id().equals(postId) && 
                    comment.commented() != null &&
                    comment.commented().equals(commentText)
                );
            }else{
                user.setComments(new ArrayList<>());
            }
            
            Posts savedPost = postsRepository.save(foundPost);
            userRepository.save(author);
            userRepository.save(user);
            return Optional.of(savedPost);
        }
        return post;
    }
    }


