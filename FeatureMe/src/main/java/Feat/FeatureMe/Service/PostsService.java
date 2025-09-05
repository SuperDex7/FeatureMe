package Feat.FeatureMe.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.stereotype.Service;

import Feat.FeatureMe.Dto.CommentDTO;
import Feat.FeatureMe.Dto.CommentedOnDTO;
import Feat.FeatureMe.Dto.ViewsDTO;
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
    private final PostViewService postViewService;
    private final PostCommentService postCommentService;
    private final PostLikeService postLikeService;
    
    public PostsService(PostsRepository postsRepository, UserRepository userRepository, PostViewService postViewService, PostCommentService postCommentService, PostLikeService postLikeService) {
        this.postsRepository = postsRepository;
        this.userRepository = userRepository;
        this.postViewService = postViewService;
        this.postCommentService = postCommentService;
        this.postLikeService = postLikeService;
    }
    

    private List<LikesDTO> getLikesForPost(String postId) {
        try {
            // Get recent likes from the separate collection (limit to 10 for post DTOs)
            return postLikeService.getRecentLikes(postId, 10);
        } catch (Exception e) {
            return List.of(); // Return empty list on error
        }
    }
    
    private int getTotalLikesForPost(String postId) {
        try {
            return (int) postLikeService.getTotalLikes(postId);
        } catch (Exception e) {
            return 0;
        }
    }
    
    private List<CommentDTO> getCommentsForPost(String postId) {
        try {
            // Get recent comments from the separate collection (limit to 10 for post DTOs)
            return postCommentService.getRecentComments(postId, 10);
        } catch (Exception e) {
            return List.of(); // Return empty list on error
        }
    }
    
    private int getTotalCommentsForPost(String postId) {
        try {
            return (int) postCommentService.getTotalComments(postId);
        } catch (Exception e) {
            return 0;
        }
    }
    
    private List<ViewsDTO> getViewsForPost(String postId) {
        try {
            // Get recent views from the separate collection (limit to 10 for post DTOs)
            return postViewService.getRecentViews(postId, 10);
        } catch (Exception e) {
            return List.of(); // Return empty list on error
        }
    }
    
    private int getTotalViewsForPost(String postId) {
        try {
            return (int) postViewService.getTotalViews(postId);
        } catch (Exception e) {
            return 0;
        }
    }
        
    public Posts createPost(String authoruserName, Posts posts) {
        User author = userRepository.findByUserName(authoruserName)
                     .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Determine post status based on whether features are requested
        List<String> requestedFeatures = posts.getFeatures();
        String postStatus = (requestedFeatures != null && !requestedFeatures.isEmpty()) ? "DRAFT" : "PUBLISHED";
        
        Posts post = new Posts(
            null,
            author,
            posts.getTitle(),
            posts.getDescription(),
            new ArrayList<>(), // Start with empty approved features
            posts.getGenre(),
            posts.getMusic(),
            LocalDateTime.now(),
            0 // Initial totalViews
        );
        
        // Set the new fields
        post.setPendingFeatures(requestedFeatures != null ? new ArrayList<>(requestedFeatures) : new ArrayList<>());
        post.setStatus(postStatus);
        
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
            savedPost.getPendingFeatures(),
            savedPost.getStatus(),
            savedPost.getGenre(),
            savedPost.getMusic(),
            getCommentsForPost(savedPost.getId()),
            savedPost.getTime(),
            getLikesForPost(savedPost.getId()),
            getViewsForPost(savedPost.getId()),
            savedPost.getTotalViews()
        );

        // Update user's posts list
        if (author.getPosts() == null) {
            author.setPosts(new ArrayList<>());
        }
        author.getPosts().add(savedPost.getId());
        userRepository.save(author);

        // Send approval requests to featured users instead of auto-adding
        if (requestedFeatures != null && !requestedFeatures.isEmpty()) {
            List<User> featuredUsers = userRepository.findByUserNameIn(requestedFeatures);
            
            for(User featuredUser : featuredUsers) {
                if(featuredUser.getNotifications() == null){
                    featuredUser.setNotifications(new ArrayList<>());
                }
                // Send approval request notification instead of confirmation
                featuredUser.getNotifications().add(new NotificationsDTO(
                    postDto.id(), 
                    author.getUserName(), 
                    "Wants to feature you in their post '" + posts.getTitle() + "'. Approve or reject this feature request.", 
                    LocalDateTime.now()
                ));
                userRepository.save(featuredUser);
            }
        }
        
        return savedPost;
        
    }
    
    public boolean approveFeature(String postId, String approverUserName) {
        Posts post = postsRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found or has been deleted"));
        
        User approver = userRepository.findByUserName(approverUserName)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Check if user is in pending features
        if (post.getPendingFeatures() == null || !post.getPendingFeatures().contains(approverUserName)) {
            return false; // User not in pending features
        }
        
        // Move from pending to approved features
        post.getPendingFeatures().remove(approverUserName);
        if (post.getFeatures() == null) {
            post.setFeatures(new ArrayList<>());
        }
        post.getFeatures().add(approverUserName);
        
        // Add post to user's featuredOn list
        if (approver.getFeaturedOn() == null) {
            approver.setFeaturedOn(new ArrayList<>());
        }
        approver.getFeaturedOn().add(postId);
        
        // Check if all features are approved
        if (post.getPendingFeatures().isEmpty()) {
            post.setStatus("PUBLISHED");
            
            // Notify post author that post is now published
            User author = post.getAuthor();
            if (author.getNotifications() == null) {
                author.setNotifications(new ArrayList<>());
            }
            author.getNotifications().add(new NotificationsDTO(
                postId, 
                "System", 
                "Your post '" + post.getTitle() + "' is now published! All featured users have approved.", 
                LocalDateTime.now()
            ));
            userRepository.save(author);
        } else {
            post.setStatus("PARTIALLY_APPROVED");
        }
        
        // Notify approver
        if (approver.getNotifications() == null) {
            approver.setNotifications(new ArrayList<>());
        }
        approver.getNotifications().add(new NotificationsDTO(
            postId, 
            post.getAuthor().getUserName(), 
            "You approved the feature request for '" + post.getTitle() + "'", 
            LocalDateTime.now()
        ));
        
        postsRepository.save(post);
        userRepository.save(approver);
        
        return true;
    }
    
    public boolean rejectFeature(String postId, String rejecterUserName) {
        Posts post = postsRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found or has been deleted"));
        
        User rejecter = userRepository.findByUserName(rejecterUserName)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Check if user is in pending features
        if (post.getPendingFeatures() == null || !post.getPendingFeatures().contains(rejecterUserName)) {
            return false; // User not in pending features
        }
        
        // Remove from pending features
        post.getPendingFeatures().remove(rejecterUserName);
        
        // Check if there are remaining pending features
        if (post.getPendingFeatures().isEmpty()) {
            // If no pending features remain, publish with approved features only
            post.setStatus("PUBLISHED");
            
            // Notify post author
            User author = post.getAuthor();
            if (author.getNotifications() == null) {
                author.setNotifications(new ArrayList<>());
            }
            author.getNotifications().add(new NotificationsDTO(
                postId, 
                "System", 
                "Your post '" + post.getTitle() + "' is now published with approved features only.", 
                LocalDateTime.now()
            ));
            userRepository.save(author);
        } else if (!post.getFeatures().isEmpty()) {
            post.setStatus("PARTIALLY_APPROVED");
        }
        
        // Notify rejecter
        if (rejecter.getNotifications() == null) {
            rejecter.setNotifications(new ArrayList<>());
        }
        rejecter.getNotifications().add(new NotificationsDTO(
            postId, 
            post.getAuthor().getUserName(), 
            "You rejected the feature request for '" + post.getTitle() + "'", 
            LocalDateTime.now()
        ));
        
        // Notify post author about rejection
        User author = post.getAuthor();
        if (author.getNotifications() == null) {
            author.setNotifications(new ArrayList<>());
        }
        author.getNotifications().add(new NotificationsDTO(
            postId, 
            rejecterUserName, 
            rejecterUserName + " rejected the feature request for '" + post.getTitle() + "'", 
            LocalDateTime.now()
        ));
        
        postsRepository.save(post);
        userRepository.save(rejecter);
        userRepository.save(author);
        
        return true;
    }
    
    public List<PostsDTO> getPendingFeatureRequests(String userName) {
        // Find all posts where user is in pendingFeatures
        List<Posts> posts = postsRepository.findAll().stream()
            .filter(post -> post.getPendingFeatures() != null && post.getPendingFeatures().contains(userName))
            .collect(java.util.stream.Collectors.toList());
        
        return posts.stream().map(p -> {
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
                p.getPendingFeatures(),
                p.getStatus(),
                p.getGenre(),
                p.getMusic(),
                getCommentsForPost(p.getId()),
                p.getTime(),
                getLikesForPost(p.getId()),
                getViewsForPost(p.getId()),
                p.getTotalViews()
            );
        }).collect(java.util.stream.Collectors.toList());
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
            updatedPosts.getTime() != null ? updatedPosts.getTime() : posts.getTime(),
            posts.getTotalViews() // Preserve existing totalViews
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
                p.getPendingFeatures(),
                p.getStatus(),
                p.getGenre(),
                p.getMusic(),
                getCommentsForPost(p.getId()),
                p.getTime(),
                getLikesForPost(p.getId()),
                getViewsForPost(p.getId()),
                getTotalViewsForPost(p.getId())
            );
        }).toList();
    }
    
    
    
    public PostsDTO getPostById(String id) {
        try {
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
                post.getPendingFeatures(),
                post.getStatus(),
                post.getGenre(),
                post.getMusic(),
                getCommentsForPost(post.getId()),
                post.getTime(),
                getLikesForPost(post.getId()),
                getViewsForPost(post.getId()),
                getTotalViewsForPost(post.getId())
            );
        } catch (Exception e) {
            throw e;
        }
    }
    
    
    public List<PostsDTO> getPostsbyTitle(String getTitle){
        return postsRepository.findByTitleStartingWithIgnoreCase(getTitle);
    }
    
    
    
    
    
    public void deletePost(String id) {
        if (!postsRepository.existsById(id)) {
            throw new IllegalArgumentException("Post with id " + id + " does not exist.");
        }
        
        Posts post = postsRepository.findById(id).get();
        List<String> approvedFeatures = post.getFeatures();
        List<String> pendingFeatures = post.getPendingFeatures();
        User author = userRepository.findById(post.getAuthor().getId()).get();
        
        // Remove post from author's posts list
        if (author.getPosts() != null) {
            author.getPosts().remove(id);
        }
        userRepository.save(author);

        // Clean up APPROVED features (remove from their featuredOn lists)
        if (approvedFeatures != null && !approvedFeatures.isEmpty()) {
            List<User> approvedUsers = userRepository.findByUserNameIn(approvedFeatures);
            
            for (User featuredUser : approvedUsers) {
                if (featuredUser != null && featuredUser.getFeaturedOn() != null) {
                    featuredUser.getFeaturedOn().remove(id);
                    userRepository.save(featuredUser);
                }
            }
        }
        
        // Clean up PENDING features (notify them that post was deleted)
        if (pendingFeatures != null && !pendingFeatures.isEmpty()) {
            List<User> pendingUsers = userRepository.findByUserNameIn(pendingFeatures);
            
            for (User pendingUser : pendingUsers) {
                if (pendingUser != null) {
                    // Remove any existing notifications related to this post
                    if (pendingUser.getNotifications() != null) {
                        pendingUser.getNotifications().removeIf(notification -> 
                            id.equals(notification.id()));
                    }
                    
                    // Add deletion notification
                    if (pendingUser.getNotifications() == null) {
                        pendingUser.setNotifications(new ArrayList<>());
                    }
                    pendingUser.getNotifications().add(new NotificationsDTO(
                        null, // No post ID since it's deleted
                        author.getUserName(),
                        "Deleted their post '" + post.getTitle() + "' before you could approve/reject the feature request.",
                        LocalDateTime.now()
                    ));
                    userRepository.save(pendingUser);
                }
            }
        }
        
        // Finally, delete the post from database
        postsRepository.deleteById(id);
    }

    public List<PostsDTO> getFeaturedOn(String userName){
        return postsRepository.findByFeatures(userName).stream()
            .filter(p -> "PUBLISHED".equals(p.getStatus()))
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
                    p.getPendingFeatures(),
                    p.getStatus(),
                    p.getGenre(),
                    p.getMusic(),
                    getCommentsForPost(p.getId()),
                    p.getTime(),
                    getLikesForPost(p.getId()),
                    getViewsForPost(p.getId()),
                    getTotalViewsForPost(p.getId())
                );
            }).toList();
    
    }




    public PagedModel<PostsDTO> getAllById(List<String> ids, int page, int size ) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Posts> posts = postsRepository.findAllByIdIn(ids, pageable);
        
        Page<PostsDTO> postsDTOPage = posts.map(p -> {
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
                p.getPendingFeatures(),
                p.getStatus(),
                p.getGenre(),
                p.getMusic(),
                getCommentsForPost(p.getId()),
                p.getTime(),
                getLikesForPost(p.getId()),
                getViewsForPost(p.getId()),
                getTotalViewsForPost(p.getId())
            );
        });
        
        return new PagedModel<PostsDTO>(postsDTOPage);
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
        if (post.isPresent()) {
            Posts foundPost = post.get();
            User author = foundPost.getAuthor();
            User user = userRepository.findByUserName(userName).orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            // Use the new PostLikeService to toggle the like
            boolean isLiked = postLikeService.toggleLike(id, userName);
            
            // Update the cached totalLikes count in the Posts entity
            long newTotalLikes = postLikeService.getTotalLikes(id);
            foundPost.setTotalLikes((int) newTotalLikes);
            postsRepository.save(foundPost); // Save the updated like count
            
            // Handle notifications and user liked posts
            if(author.getNotifications() == null){
                author.setNotifications(new ArrayList<>());
            }
            if(user.getLikedPosts() == null){
                user.setLikedPosts(new ArrayList<>());
            }
            
            if (isLiked) {
                // User liked the post
                NotificationsDTO noti = new NotificationsDTO(foundPost.getId(), userName, "Liked Your Post!", LocalDateTime.now());
                user.getLikedPosts().add(id);
                author.getNotifications().add(noti);
                
                // Clean up notifications if they exceed 30
                cleanupNotifications(author);
            } else {
                // User unliked the post
                user.getLikedPosts().remove(id);
                
                // Remove the like notification
                List<NotificationsDTO> currentNoti = author.getNotifications();
                if(currentNoti != null){
                    currentNoti.removeIf(notification -> 
                        notification.id() != null && 
                        notification.id().equals(foundPost.getId()) && 
                        notification.userName().equals(userName) && 
                        notification.noti().equals("Liked Your Post!")
                    );
                }
            }
            
            userRepository.save(author);
            userRepository.save(user);
            return Optional.of(foundPost);
        }

        return post; // Return original post if no changes made
    }

    public Optional<Posts> addComment(String id, String userName, String comment){
        Optional<Posts> post = postsRepository.findById(id);
        if(post.isPresent()){
            Posts foundPost = post.get();
            User author = foundPost.getAuthor();
            User user = userRepository.findByUserName(userName).orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            // Use the new PostCommentService to add the comment
            postCommentService.addComment(id, userName, comment);
            
            // Handle notifications and user comment history
            NotificationsDTO noti = new NotificationsDTO(id, user.getUserName(), "Commented on Your Post!", LocalDateTime.now());
            
            if(author.getNotifications() == null){
                author.setNotifications(new ArrayList<>());
            }
            if(user.getComments() == null){
                user.setComments(new ArrayList<>());
            }
            
            user.getComments().add(new CommentedOnDTO(id, comment, LocalDateTime.now()));
            author.getNotifications().add(noti);
            
            // Clean up notifications if they exceed 30
            cleanupNotifications(author);
            
            userRepository.save(author);
            userRepository.save(user);
            return Optional.of(foundPost);
        }
        return post;
    }

    public Optional<Posts> deleteComment(String postId, String userName, String commentText){
        Optional<Posts> post = postsRepository.findById(postId);
        if(post.isPresent()){
            Posts foundPost = post.get();
            User author = foundPost.getAuthor();
            User user = userRepository.findByUserName(userName).orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            // Use the new PostCommentService to delete the comment
            // Note: This is a simplified approach. For better implementation, we'd need comment IDs
            // For now, we'll need to modify the frontend to provide more specific comment identification
            
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


    public PagedModel<PostsDTO> getAllPagedPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        // Only show published posts in public feed
        Page<Posts> postsPage = postsRepository.findByStatusOrderByTimeDesc("PUBLISHED", pageable);
        
        // Convert Page<Posts> to Page<PostsDTO>
        Page<PostsDTO> postsDTOPage = postsPage.map(p -> {
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
                p.getPendingFeatures(),
                p.getStatus(),
                p.getGenre(),
                p.getMusic(),
                getCommentsForPost(p.getId()),
                p.getTime(),
                getLikesForPost(p.getId()),
                getViewsForPost(p.getId()),
                getTotalViewsForPost(p.getId())
            );
        });
        
        return new PagedModel<PostsDTO>(postsDTOPage);
    }


    public PagedModel<PostsDTO> findByLikesDesc(int page, int size){
        // NOW FAST: Use database-level sorting with cached totalLikes field! - ONLY PUBLISHED
        Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by("totalLikes").descending().and(org.springframework.data.domain.Sort.by("time").descending()));
        Page<Posts> postsPage = postsRepository.findByStatusOrderByTotalLikesDescTimeDesc("PUBLISHED", pageable);
        
        // Convert to DTOs (much simpler now)
        Page<PostsDTO> postsDTOPage = postsPage.map(p -> {
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
                p.getPendingFeatures(),
                p.getStatus(),
                p.getGenre(),
                p.getMusic(),
                getCommentsForPost(p.getId()),
                p.getTime(),
                getLikesForPost(p.getId()),
                getViewsForPost(p.getId()),
                getTotalViewsForPost(p.getId())
            );
        });
        
        return new PagedModel<PostsDTO>(postsDTOPage);
    }


    public PagedModel<PostsDTO> getSearchedPost(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size);
        
        // Only search published posts
        Page<Posts> postsSearchedPage = postsRepository.findByTitleOrDescriptionContainingIgnoreCaseAndStatus(search, "PUBLISHED", pageable);
        
        Page<PostsDTO> postsDTOSearchedPage = postsSearchedPage.map(p -> {
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
                p.getPendingFeatures(),
                p.getStatus(),
                p.getGenre(),
                p.getMusic(),
                getCommentsForPost(p.getId()),
                p.getTime(),
                getLikesForPost(p.getId()),
                getViewsForPost(p.getId()),
                getTotalViewsForPost(p.getId())
            );
        });
        
        return new PagedModel<PostsDTO>(postsDTOSearchedPage);
    }
    
    // Comprehensive search method with multiple filters and sorting options
    public PagedModel<PostsDTO> searchPosts(String searchTerm, List<String> genres, String sortBy, int page, int size) {
        Pageable pageable;
        
        // Set up sorting - now we can use database-level sorting for likes too!
        if ("likes".equalsIgnoreCase(sortBy)) {
            pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by("totalLikes").descending().and(org.springframework.data.domain.Sort.by("time").descending()));
        } else {
            pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by("time").descending());
        }
        
        Page<Posts> postsPage;
        
        // Get posts based on search criteria with proper sorting - ONLY PUBLISHED POSTS
        if (searchTerm != null && !searchTerm.trim().isEmpty() && genres != null && !genres.isEmpty()) {
            // Both search term and genres provided - use AND logic (both must match)
            postsPage = postsRepository.findByTitleOrDescriptionAndGenreInAndStatus(searchTerm.trim(), genres, "PUBLISHED", pageable);
        } else if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            // Only search term provided
            postsPage = postsRepository.findByTitleOrDescriptionContainingIgnoreCaseAndStatus(searchTerm.trim(), "PUBLISHED", pageable);
        } else if (genres != null && !genres.isEmpty()) {
            // Only genres provided - filter by status
            postsPage = postsRepository.findByGenreInAndStatus(genres, "PUBLISHED", pageable);
        } else {
            // No filters provided - only published posts
            postsPage = postsRepository.findByStatusOrderByTimeDesc("PUBLISHED", pageable);
        }
        
        // Convert to DTOs (much simpler now with database sorting)
        Page<PostsDTO> postsDTOPage = postsPage.map(p -> {
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
                p.getPendingFeatures(),
                p.getStatus(),
                p.getGenre(),
                p.getMusic(),
                getCommentsForPost(p.getId()),
                p.getTime(),
                getLikesForPost(p.getId()),
                getViewsForPost(p.getId()),
                getTotalViewsForPost(p.getId())
            );
        });
        
        return new PagedModel<PostsDTO>(postsDTOPage);
    }


    public void addView(String id, String userName) {
        // Verify post exists
        postsRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        
        // Use the new PostViewService to handle view tracking
        postViewService.addView(id, userName);
    }
    
    public List<ViewsDTO> getPostViews(String postId) {
        // Verify post exists
        postsRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        
        // Get recent views from the separate collection (limit to 50 for performance)
        return postViewService.getRecentViews(postId, 50);
    }
    
    // New methods for the separate views system
    public PostViewService.PostViewSummary getPostViewSummary(String postId) {
        postsRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        return postViewService.getViewSummary(postId);
    }
    
    public PagedModel<ViewsDTO> getPostViewsPaginated(String postId, int page, int size) {
        postsRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        Page<ViewsDTO> viewsPage = postViewService.getPostViews(postId, page, size);
        return new PagedModel<>(viewsPage);
    }
    
    // New methods for the separate comments system
    public PostCommentService.PostCommentSummary getPostCommentSummary(String postId) {
        postsRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        return postCommentService.getCommentSummary(postId);
    }
    
    public PagedModel<CommentDTO> getPostCommentsPaginated(String postId, int page, int size) {
        postsRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        Page<CommentDTO> commentsPage = postCommentService.getPostComments(postId, page, size);
        return new PagedModel<>(commentsPage);
    }
    
    // New methods for the separate likes system
    public PostLikeService.PostLikeSummary getPostLikeSummary(String postId) {
        postsRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        return postLikeService.getLikeSummary(postId);
    }
    
    public PagedModel<LikesDTO> getPostLikesPaginated(String postId, int page, int size) {
        postsRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        Page<LikesDTO> likesPage = postLikeService.getPostLikes(postId, page, size);
        return new PagedModel<>(likesPage);
    }
    
    public boolean hasUserLikedPost(String postId, String userName) {
        postsRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        return postLikeService.hasUserLiked(postId, userName);
    }
    
   
    }


