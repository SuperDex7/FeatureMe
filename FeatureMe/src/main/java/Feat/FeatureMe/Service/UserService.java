package Feat.FeatureMe.Service;


import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import Feat.FeatureMe.Dto.CommentedOnDTO;
import Feat.FeatureMe.Dto.NotificationsDTO;
import Feat.FeatureMe.Dto.UserDTO;
import Feat.FeatureMe.Dto.UserSearchDTO;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.UserRepository;
import Feat.FeatureMe.Repository.PostsRepository;
import Feat.FeatureMe.Repository.DemoRepository;
import Feat.FeatureMe.Repository.PostLikeRepository;
import Feat.FeatureMe.Repository.PostCommentRepository;
import Feat.FeatureMe.Repository.PostViewRepository;
import Feat.FeatureMe.Repository.PostDownloadRepository;
import Feat.FeatureMe.Repository.UserRelationRepository;
import Feat.FeatureMe.Repository.ChatsRepository;
import Feat.FeatureMe.Dto.UserPostsDTO;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final UserRelationService userRelationService;
    private final PostsRepository postsRepository;
    private final DemoRepository demoRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostCommentRepository postCommentRepository;
    private final PostViewRepository postViewRepository;
    private final PostDownloadRepository postDownloadRepository;
    private final UserRelationRepository userRelationRepository;
    private final ChatsRepository chatsRepository;
    private final PasswordEncoder passwordEncoder;
    private final S3Service s3Service;

    public UserService(UserRepository userRepository, UserRelationService userRelationService, 
                      PostsRepository postsRepository, DemoRepository demoRepository,
                      PostLikeRepository postLikeRepository, PostCommentRepository postCommentRepository,
                      PostViewRepository postViewRepository, PostDownloadRepository postDownloadRepository,
                      UserRelationRepository userRelationRepository, ChatsRepository chatsRepository,
                      PasswordEncoder passwordEncoder, S3Service s3Service, NotificationService notificationService) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.userRelationService = userRelationService;
        this.postsRepository = postsRepository;
        this.demoRepository = demoRepository;
        this.postLikeRepository = postLikeRepository;
        this.postCommentRepository = postCommentRepository;
        this.postViewRepository = postViewRepository;
        this.postDownloadRepository = postDownloadRepository;
        this.userRelationRepository = userRelationRepository;
        this.chatsRepository = chatsRepository;
        this.passwordEncoder = passwordEncoder;
        this.s3Service = s3Service;
    }

    public void saveUser(User user){
        userRepository.save(user);
    }

    public void clearNotifications(User user) {
        notificationService.clear(user.getUserName());
    }

    public User createUser(User user) {
        if(userRepository.existsByUserName(user.getUserName())){
            throw new IllegalArgumentException("User already exists with this username");
        }
        if(userRepository.existsByEmail(user.getEmail())){
            throw new IllegalArgumentException("User already exists with this email");
        }
        // Encode the password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.insert(user);
    }
    /**
     * Change user password with current password verification
     */
    public boolean changePassword(String userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return false; // Current password is incorrect
        }
        
        // Update password with new encoded password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return true;
    }

    /**
     * Profile edits: only the fields a user may change about themselves (the
     * same ones the web and mobile editors send). Picture uploads are handled
     * by the controller. Everything else (role, email, user name, password,
     * Stripe/Apple ids, counts, lists) is never taken from the request.
     *
     * This used to rebuild the whole User from the request, which let anyone
     * set their own role (free Plus) or email, and wiped the fields its
     * constructor doesn't cover (Stripe ids, subscription status, follower
     * counts, createdAt) on every profile edit.
     */
    public void updateUser(String id, User updatedUser) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        // null = not sent (keep); "" = cleared
        if (updatedUser.getBio() != null) user.setBio(limit(updatedUser.getBio(), 50));
        if (updatedUser.getAbout() != null) user.setAbout(limit(updatedUser.getAbout(), 250));
        if (updatedUser.getLocation() != null) user.setLocation(limit(updatedUser.getLocation(), 50));
        if (updatedUser.getSocialMedia() != null) {
            user.setSocialMedia(updatedUser.getSocialMedia().stream()
                .filter(link -> link != null && !link.isBlank())
                .map(link -> limit(link, 300))
                .limit(10)
                .toList());
        }
        userRepository.save(user);
    }

    private static String limit(String value, int max) {
        String trimmed = value.trim();
        return trimmed.length() > max ? trimmed.substring(0, max) : trimmed;
    }
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll()
        .stream()
        .map(u -> {
            // Sort notifications by time in descending order (newest first)
            List<NotificationsDTO> sortedNotifications = notificationService.recent(u.getUserName());
            
            // Sort posts by ID (assuming newer posts have higher IDs)
            List<String> sortedPosts = u.getPosts();
            if (sortedPosts != null) {
                sortedPosts = new ArrayList<>(sortedPosts);
                Collections.reverse(sortedPosts);
            }
            
            // Sort featuredOn by ID (assuming newer features have higher IDs)
            List<String> sortedFeaturedOn = u.getFeaturedOn();
            if (sortedFeaturedOn != null) {
                sortedFeaturedOn = new ArrayList<>(sortedFeaturedOn);
                Collections.reverse(sortedFeaturedOn);
            }
            
            // Sort likedPosts by ID (assuming newer likes have higher IDs)
            // Reverse to show newest likes first (since we add to the end)
            List<String> sortedLikedPosts = u.getLikedPosts();
            if (sortedLikedPosts != null) {
                sortedLikedPosts = new ArrayList<>(sortedLikedPosts);
                Collections.reverse(sortedLikedPosts);
            }
            
            // Sort comments by time in descending order (newest first)
            List<CommentedOnDTO> sortedComments = u.getComments();
            if (sortedComments != null) {
                sortedComments = new ArrayList<>(sortedComments);
                sortedComments.sort((c1, c2) -> c2.time().compareTo(c1.time()));
            }
            
            return new UserDTO(
                u.getId(),
                u.getUserName(),
                u.getProfilePic(),
                u.getBanner(),
                u.getRole(),
                u.getBio(),
                u.getAbout(),
                u.getDemo(),
                u.getLocation(),
                u.getSocialMedia(),
                u.getBadges(),
                sortedFeaturedOn,
                sortedPosts,
                u.getChats(),
                sortedLikedPosts,
                sortedComments,
                sortedNotifications,
                u.getFollowersCount(),
                u.getFollowingCount()
            );
        })
        .toList();
    }
    
    public UserDTO getUserById(String id) {
        User user = userRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Sort notifications by time in descending order (newest first)
        List<NotificationsDTO> sortedNotifications = notificationService.recent(user.getUserName());
        
        // Sort posts by ID (assuming newer posts have higher IDs or you can sort by creation time)
        List<String> sortedPosts = user.getPosts();
        if (sortedPosts != null) {
            sortedPosts = new ArrayList<>(sortedPosts);
            // Reverse to show newest posts first (assuming newer posts are added to the end)
            Collections.reverse(sortedPosts);
        }
        
        // Sort featuredOn by ID (assuming newer features have higher IDs)
        List<String> sortedFeaturedOn = user.getFeaturedOn();
        if (sortedFeaturedOn != null) {
            sortedFeaturedOn = new ArrayList<>(sortedFeaturedOn);
            // Reverse to show newest features first
            Collections.reverse(sortedFeaturedOn);
        }
        
        // Sort likedPosts by ID (assuming newer likes have higher IDs)
        List<String> sortedLikedPosts = user.getLikedPosts();
        if (sortedLikedPosts != null) {
            sortedLikedPosts = new ArrayList<>(sortedLikedPosts);
            Collections.reverse(sortedLikedPosts);
        }
        
        // Sort comments by time in descending order (newest first)
        List<CommentedOnDTO> sortedComments = user.getComments();
        if (sortedComments != null) {
            sortedComments = new ArrayList<>(sortedComments);
            sortedComments.sort((c1, c2) -> c2.time().compareTo(c1.time()));
        }
        
        return new UserDTO(
            user.getId(),
            user.getUserName(),
            user.getProfilePic(),
            user.getBanner(),
            user.getRole(),
            user.getBio(),
            user.getAbout(),
            user.getDemo(),
            user.getLocation(),
            user.getSocialMedia(),
            user.getBadges(),
            sortedFeaturedOn,
            sortedPosts,
            user.getChats(),
            sortedLikedPosts,
            sortedComments,
            sortedNotifications,
            user.getFollowersCount(),
            user.getFollowingCount()
        );
    }
    public PagedModel<UserPostsDTO> getUserByName(String userName, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
       
        Page<User> users = userRepository.findByUserNameContainingIgnoreCase(userName, pageable);
        
        Page<UserPostsDTO> usersDTO = users.map(u -> {
            return new UserPostsDTO(
                u.getId(),
                u.getUserName(),
                u.getProfilePic(),
                u.getBanner(),
                u.getBio(),
                u.getLocation(),
                u.getRole()
            );
        });
        return new PagedModel<UserPostsDTO>(usersDTO);
    }

    // Optimized search method with more data for enhanced search cards
    public PagedModel<UserSearchDTO> getUserByNameEnhanced(String userName, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
       
        Page<User> users = userRepository.findByUserNameContainingIgnoreCase(userName, pageable);
       
        Page<UserSearchDTO> usersDTO = users.map(u -> {
            return new UserSearchDTO(
                u.getId(),
                u.getUserName(),
                u.getProfilePic(),
                u.getBanner(),
                u.getBio(),
                u.getLocation(),
                u.getRole(),
                u.getBadges() != null ? u.getBadges() : Collections.emptyList(),
                u.getDemo() != null ? u.getDemo() : Collections.emptyList(),
                u.getSocialMedia() != null ? u.getSocialMedia() : Collections.emptyList(),
                u.getFollowersCount(),
                u.getFollowingCount(),
                u.getPosts() != null ? u.getPosts().size() : 0
            );
        });
        return new PagedModel<UserSearchDTO>(usersDTO);
    }
    /**
     * Comprehensive user deletion that removes all user-related data while preserving chats
     * @param id User ID to delete
     */
    public void deleteUser(String id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        String userName = user.getUserName();
        
        // 1. Delete all posts created by the user
        if (user.getPosts() != null && !user.getPosts().isEmpty()) {
            for (String postId : user.getPosts()) {
                // Get post details to access music file URL and cleanup featuredOn references
                postsRepository.findById(postId).ifPresent(post -> {
                    // 1) Remove this post ID from all featured users' featuredOn lists
                    try {
                        List<String> featureUsernames = post.getFeatures();
                        if (featureUsernames != null && !featureUsernames.isEmpty()) {
                            List<User> featuredUsers = userRepository.findByUserNameIn(featureUsernames);
                            for (User featuredUser : featuredUsers) {
                                List<String> featuredOn = featuredUser.getFeaturedOn();
                                if (featuredOn != null && featuredOn.remove(post.getId())) {
                                    userRepository.save(featuredUser);
                                }
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("Failed to clean up featuredOn references for post " + postId + ": " + e.getMessage());
                    }

                    // 2) Delete music file from S3 if it exists and is not a default file
                    if (post.getMusic() != null && !post.getMusic().isEmpty() && 
                        !post.getMusic().startsWith("/") && post.getMusic().contains("amazonaws.com")) {
                        try {
                            // Extract S3 key from full URL
                            String s3Key = extractS3KeyFromUrl(post.getMusic());
                            if (s3Key != null) {
                                s3Service.deleteFile(s3Key);
                            }
                        } catch (Exception e) {
                            System.err.println("Failed to delete music file from S3: " + post.getMusic() + " - " + e.getMessage());
                        }
                    }
                });
                
                // Delete all related data for each post
                postLikeRepository.deleteByPostId(postId);
                postCommentRepository.deleteByPostId(postId);
                postViewRepository.deleteByPostId(postId);
                postDownloadRepository.deleteByPostId(postId);
                
                // Delete the post itself
                postsRepository.deleteById(postId);
            }
        }
        
        // 2. Delete all demos created by the user
        if (user.getDemo() != null && !user.getDemo().isEmpty()) {
            for (String demoId : user.getDemo()) {
                // Get demo details to access song file URL
                demoRepository.findById(demoId).ifPresent(demo -> {
                    // Delete song file from S3 if it exists and is not a default file
                    if (demo.getSongUrl() != null && !demo.getSongUrl().isEmpty() && 
                        !demo.getSongUrl().startsWith("/") && demo.getSongUrl().contains("amazonaws.com")) {
                        try {
                            // Extract S3 key from full URL
                            String s3Key = extractS3KeyFromUrl(demo.getSongUrl());
                            if (s3Key != null) {
                                s3Service.deleteFile(s3Key);
                            }
                        } catch (Exception e) {
                            System.err.println("Failed to delete demo song file from S3: " + demo.getSongUrl() + " - " + e.getMessage());
                        }
                    }
                });
                
                demoRepository.deleteById(demoId);
            }
        }
        
        // 3. Remove follow relationships (handled by relations collection below)
        
        // 4. Friends no longer supported
        
        // 5. Remove user from all posts' features lists (where they are featured)
        postsRepository.removeUserFromAllPostsFeatures(userName);
        
        // 6. Remove user from liked posts (clean up likes by this user)
        if (user.getLikedPosts() != null && !user.getLikedPosts().isEmpty()) {
            for (String likedPostId : user.getLikedPosts()) {
                postLikeRepository.deleteByPostIdAndUserName(likedPostId, userName);
            }
        }
        
        // 7. Delete user relations (follow relationships)
        userRelationRepository.deleteByFollowerUserNameOrFollowingUserName(userName, userName);
        
        // 8. Remove user from all chat rooms they're part of
        if (user.getChats() != null && !user.getChats().isEmpty()) {
            chatsRepository.removeUserFromAllChats(userName);
        }
        
        // 9. Delete user's profile picture and banner from S3
        if (user.getProfilePic() != null && !user.getProfilePic().isEmpty() && 
            !user.getProfilePic().startsWith("/") && user.getProfilePic().contains("amazonaws.com")) {
            try {
                // Extract S3 key from full URL
                String s3Key = s3Service.extractKeyFromUrl(user.getProfilePic());
                if (s3Key != null && s3Key.contains("images/profiles")) {
                    s3Service.deleteFile(s3Key);
                }
            } catch (Exception e) {
                System.err.println("Failed to delete profile picture from S3: " + user.getProfilePic() + " - " + e.getMessage());
            }
        }
        
        if (user.getBanner() != null && !user.getBanner().isEmpty() && 
            !user.getBanner().startsWith("/") && user.getBanner().contains("amazonaws.com")) {
            try {
                // Extract S3 key from full URL
                String s3Key = s3Service.extractKeyFromUrl(user.getBanner());
                if (s3Key != null && s3Key.contains("images/banners")) {
                    s3Service.deleteFile(s3Key);
                }
            } catch (Exception e) {
                System.err.println("Failed to delete banner from S3: " + user.getBanner() + " - " + e.getMessage());
            }
        }
        
        // 10. Finally, delete the user profile
        notificationService.clear(user.getUserName());
        userRepository.deleteById(id);
    }
    
    public User authenticateUser(String usernameOrEmail, String password) {
        User user = findByUsernameOrEmail(usernameOrEmail)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Use password encoder to match the provided password with the stored encoded password
        if (passwordEncoder.matches(password, user.getPassword())) {
            return user;
        } else {
            throw new IllegalArgumentException("Invalid password");
        }
    }
    
    public Optional<User> findByUsernameOrEmail(String usernameOrEmail) {
        // Try to find by username first
        Optional<User> userByUsername = userRepository.findByUserName(usernameOrEmail);
        if (userByUsername.isPresent()) {
            return userByUsername;
        }
        
        // If not found by username, try by email
        return userRepository.findByEmail(usernameOrEmail);
    }
    
    public Optional<User> findByStripeCustomerId(String stripeCustomerId) {
        return userRepository.findByStripeCustomerId(stripeCustomerId);
    }
    
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        User user = findByUsernameOrEmail(usernameOrEmail)
            .orElseThrow(() -> new UsernameNotFoundException("User not found with: " + usernameOrEmail));
        
        return org.springframework.security.core.userdetails.User
            .withUsername(user.getEmail()) // Use email as the principal
            .password(user.getPassword())
            .authorities(user.getRole() != null ? user.getRole() : "USER")
            .build();
    }
    public UserDTO getAUser(String userName) {
        User user = userRepository.findByUserName(userName)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Sort notifications by time in descending order (newest first)
        List<NotificationsDTO> sortedNotifications = notificationService.recent(user.getUserName());
        
        // Sort posts by ID (assuming newer posts have higher IDs)
        List<String> sortedPosts = user.getPosts();
        if (sortedPosts != null) {
            sortedPosts = new ArrayList<>(sortedPosts);
            Collections.reverse(sortedPosts);
        }
        
        // Sort featuredOn by ID (assuming newer features have higher IDs)
        List<String> sortedFeaturedOn = user.getFeaturedOn();
        if (sortedFeaturedOn != null) {
            sortedFeaturedOn = new ArrayList<>(sortedFeaturedOn);
            Collections.reverse(sortedFeaturedOn);
        }
        
        // Sort likedPosts by ID (assuming newer likes have higher IDs)
        List<String> sortedLikedPosts = user.getLikedPosts();
        if (sortedLikedPosts != null) {
            sortedLikedPosts = new ArrayList<>(sortedLikedPosts);
            Collections.reverse(sortedLikedPosts);
        }
        
        // Sort comments by time in descending order (newest first)
        List<CommentedOnDTO> sortedComments = user.getComments();
        if (sortedComments != null) {
            sortedComments = new ArrayList<>(sortedComments);
            sortedComments.sort((c1, c2) -> c2.time().compareTo(c1.time()));
        }
        
        return new UserDTO(
            user.getId(),
            user.getUserName(),
            user.getProfilePic(),
            user.getBanner(), 
            user.getRole(),
            user.getBio(),
            user.getAbout(),
            user.getDemo(),
            user.getLocation(),
            user.getSocialMedia(),
            user.getBadges(),
            sortedFeaturedOn,
            sortedPosts,
            user.getChats(),
            sortedLikedPosts,
            sortedComments,
            sortedNotifications,
            user.getFollowersCount(),
            user.getFollowingCount()
        );
    }

    /** The 30 newest notifications (older ones are reachable through paging) */
    public List<NotificationsDTO> getNoti(String userName){
        return notificationService.recent(userName);
    }
    

    // Refactored follow method - delegates to UserRelationService
    public String follow(String follower, String following) {
        return userRelationService.toggleFollow(follower, following);
    }

    /**
     * Check if username exists
     */
    public boolean existsByUserName(String userName) {
        return userRepository.existsByUserName(userName);
    }

    /**
     * Check if email exists
     */
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
    
    /**
     * Extracts S3 key from a full S3 URL
     * @param s3Url Full S3 URL (e.g., https://bucket.s3.region.amazonaws.com/path/file.ext)
     * @return S3 key (path/file.ext) or null if URL is invalid
     */
    private String extractS3KeyFromUrl(String s3Url) {
        try {
            if (s3Url == null || s3Url.isEmpty()) {
                return null;
            }
            
            // Extract the key part after the domain
            // URL format: https://featuremellc.s3.us-east-2.amazonaws.com/images/profiles/filename.jpg
            String[] parts = s3Url.split("amazonaws\\.com/");
            if (parts.length > 1) {
                String key = parts[1];
                // URL decode the key in case it contains encoded characters
                return java.net.URLDecoder.decode(key, "UTF-8");
            }
            
            return null;
        } catch (Exception e) {
            System.err.println("Error extracting S3 key from URL: " + s3Url + " - " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Find user by Apple originalTransactionId
     */
    public Optional<User> findByAppleOriginalTransactionId(String appleOriginalTransactionId) {
        return userRepository.findByAppleOriginalTransactionId(appleOriginalTransactionId);
    }
    
}
