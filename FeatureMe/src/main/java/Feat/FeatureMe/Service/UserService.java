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
import org.springframework.stereotype.Service;

import Feat.FeatureMe.Dto.CommentedOnDTO;
import Feat.FeatureMe.Dto.NotificationsDTO;
import Feat.FeatureMe.Dto.UserDTO;
import Feat.FeatureMe.Dto.UserSearchDTO;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.UserRepository;
import Feat.FeatureMe.Dto.UserPostsDTO;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserRelationService userRelationService;

    public UserService(UserRepository userRepository, UserRelationService userRelationService) {
        this.userRepository = userRepository;
        this.userRelationService = userRelationService;
    }

    public void saveUser(User user){
        userRepository.save(user);
    }

    public User createUser(User user) {
        if(userRepository.existsByUserName(user.getUserName())){
            throw new IllegalArgumentException("User already exists with this username");
        }
        if(userRepository.existsByEmail(user.getEmail())){
            throw new IllegalArgumentException("User already exists with this email");
        }
        return userRepository.insert(user);
    }
    public void updateUser(String id, User updatedUser) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));

        user = new User(
            user.getId(),
            updatedUser.getUserName() != null && !updatedUser.getUserName().isBlank() ? updatedUser.getUserName() : user.getUserName(),
            updatedUser.getPassword() != null && !updatedUser.getPassword().isBlank() ? updatedUser.getPassword() : user.getPassword(),
            updatedUser.getEmail() != null && !updatedUser.getEmail().isBlank() ? updatedUser.getEmail() : user.getEmail(),
            updatedUser.getRole() != null && !updatedUser.getRole().isBlank() ? updatedUser.getRole() : user.getRole(),
            updatedUser.getBio() != null && !updatedUser.getBio().isBlank() ? updatedUser.getBio() : user.getBio(),
            updatedUser.getAbout() != null && !updatedUser.getAbout().isBlank() ? updatedUser.getAbout() : user.getAbout(),
            updatedUser.getProfilePic() != null && !updatedUser.getProfilePic().isBlank() ? updatedUser.getProfilePic() : user.getProfilePic(),
            updatedUser.getBanner() != null && !updatedUser.getBanner().isBlank() ? updatedUser.getBanner() : user.getBanner(),
            updatedUser.getLocation() != null && !updatedUser.getLocation().isBlank() ? updatedUser.getLocation() : user.getLocation(),
            updatedUser.getSocialMedia() != null && !updatedUser.getSocialMedia().isEmpty() ? updatedUser.getSocialMedia() : user.getSocialMedia(),
            updatedUser.getBadges() != null && !updatedUser.getBadges().isEmpty() ? updatedUser.getBadges() : user.getBadges(),
            updatedUser.getDemo() != null && !updatedUser.getDemo().isEmpty() ? updatedUser.getDemo() : user.getDemo(),
            updatedUser.getFriends() != null ? updatedUser.getFriends() : user.getFriends(),
            updatedUser.getFollowers() != null ? updatedUser.getFollowers() : user.getFollowers(),  
            updatedUser.getFollowing() != null ? updatedUser.getFollowing() : user.getFollowing(),
            updatedUser.getFeaturedOn() != null && !updatedUser.getFeaturedOn().isEmpty() ? updatedUser.getFeaturedOn() : user.getFeaturedOn(),
            updatedUser.getLikedPosts() != null && !updatedUser.getLikedPosts().isEmpty() ? updatedUser.getLikedPosts() : user.getLikedPosts(),
            updatedUser.getPosts() != null && !updatedUser.getPosts().isEmpty() ? updatedUser.getPosts() : user.getPosts(),
            updatedUser.getNotifications() != null && !updatedUser.getNotifications().isEmpty() ? updatedUser.getNotifications() : user.getNotifications(),
            updatedUser.getComments() != null && !updatedUser.getComments().isEmpty() ? updatedUser.getComments() : user.getComments(),
            updatedUser.getCreatedAt() != null ? updatedUser.getCreatedAt() : user.getCreatedAt()    
        );
        userRepository.save(user);
        
    }
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll()
        .stream()
        .map(u -> {
            // Sort notifications by time in descending order (newest first)
            List<NotificationsDTO> sortedNotifications = u.getNotifications();
            if (sortedNotifications != null) {
                sortedNotifications = new ArrayList<>(sortedNotifications); // Create a copy to avoid modifying original
                sortedNotifications.sort((n1, n2) -> n2.time().compareTo(n1.time()));
            }
            
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
                u.getFriends(),
                u.getFollowers(),   
                u.getFollowing(),
                sortedFeaturedOn,
                sortedPosts,
                sortedLikedPosts,
                sortedComments,
                sortedNotifications
            );
        })
        .toList();
    }
    
    public UserDTO getUserById(String id) {
        User user = userRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Sort notifications by time in descending order (newest first)
        List<NotificationsDTO> sortedNotifications = user.getNotifications();
        if (sortedNotifications != null) {
            sortedNotifications = new ArrayList<>(sortedNotifications);
            sortedNotifications.sort((n1, n2) -> n2.time().compareTo(n1.time()));
        }
        
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
            user.getFriends(),
            user.getFollowers(),
            user.getFollowing(),
            sortedFeaturedOn,
            sortedPosts,
            sortedLikedPosts,
            sortedComments,
            sortedNotifications
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
                u.getLocation()
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
                u.getFollowers() != null ? u.getFollowers().size() : 0,
                u.getFollowing() != null ? u.getFollowing().size() : 0,
                u.getPosts() != null ? u.getPosts().size() : 0
            );
        });
        return new PagedModel<UserSearchDTO>(usersDTO);
    }
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }
    
    public User authenticateUser(String usernameOrEmail, String password) {
        User user = findByUsernameOrEmail(usernameOrEmail)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // For now, simple password comparison (you should hash passwords later)
        if (password.equals(user.getPassword())) {
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
        List<NotificationsDTO> sortedNotifications = user.getNotifications();
        if (sortedNotifications != null) {
            sortedNotifications = new ArrayList<>(sortedNotifications);
            sortedNotifications.sort((n1, n2) -> n2.time().compareTo(n1.time()));
        }
        
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
            user.getFriends(),
            user.getFollowers(),
            user.getFollowing(),
            sortedFeaturedOn,
            sortedPosts,
            sortedLikedPosts,
            sortedComments,
            sortedNotifications
        );
    }

    public List<NotificationsDTO> getNoti(String userName){
        Optional<User> user = userRepository.findByUserName(userName);
        List<NotificationsDTO> notifications = user.get().getNotifications();
        
        // Sort notifications by time in descending order (newest first)
        if (notifications != null) {
            notifications.sort((n1, n2) -> n2.time().compareTo(n1.time()));
        }
        
        return notifications;
    }
    

    // Refactored follow method - delegates to UserRelationService
    public String follow(String follower, String following) {
        return userRelationService.toggleFollow(follower, following);
    }
}
