package Feat.FeatureMe.Service;

import Feat.FeatureMe.Dto.NotificationsDTO;
import Feat.FeatureMe.Dto.UserRelationDTO;
import Feat.FeatureMe.Dto.UserRelationSummaryDTO;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Entity.UserRelation;
import Feat.FeatureMe.Repository.UserRelationRepository;
import Feat.FeatureMe.Repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserRelationService {
    
    private final UserRelationRepository userRelationRepository;
    private final UserRepository userRepository;
    
    public UserRelationService(UserRelationRepository userRelationRepository, UserRepository userRepository) {
        this.userRelationRepository = userRelationRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Follow/Unfollow a user
     */
    public String toggleFollow(String followerUserName, String followingUserName) {
        if (followerUserName.equals(followingUserName)) {
            throw new IllegalArgumentException("Users cannot follow themselves");
        }
        
        // Check if relationship already exists
        Optional<UserRelation> existingRelation = userRelationRepository
            .findByFollowerUserNameAndFollowingUserNameAndStatus(
                followerUserName, followingUserName, UserRelation.RelationStatus.ACTIVE);
        
        User follower = userRepository.findByUserName(followerUserName)
            .orElseThrow(() -> new IllegalArgumentException("Follower user not found"));
        User following = userRepository.findByUserName(followingUserName)
            .orElseThrow(() -> new IllegalArgumentException("Following user not found"));
        
        if (existingRelation.isPresent()) {
            // Unfollow
            userRelationRepository.deleteByFollowerUserNameAndFollowingUserNameAndStatus(
                followerUserName, followingUserName, UserRelation.RelationStatus.ACTIVE);
            
            // Update counters
            following.setFollowersCount(Math.max(0, following.getFollowersCount() - 1));
            follower.setFollowingCount(Math.max(0, follower.getFollowingCount() - 1));
            userRepository.save(following);
            userRepository.save(follower);
            
            // Remove notification
            removeFollowNotification(following, followerUserName);
            
            return "Unfollowed";
        } else {
            // Follow
            UserRelation newRelation = new UserRelation(
                followerUserName,
                followingUserName,
                UserRelation.RelationType.FOLLOW,
                UserRelation.RelationStatus.ACTIVE,
                follower.getProfilePic(),
                following.getProfilePic()
            );
            
            userRelationRepository.save(newRelation);
            
            // Update counters
            following.setFollowersCount(following.getFollowersCount() + 1);
            follower.setFollowingCount(follower.getFollowingCount() + 1);
            userRepository.save(following);
            userRepository.save(follower);
            
            // Add notification
            addFollowNotification(following, followerUserName);
            
            return "Followed";
        }
    }
    
    /**
     * Check if user A follows user B
     */
    public boolean isFollowing(String followerUserName, String followingUserName) {
        return userRelationRepository.existsByFollowerUserNameAndFollowingUserNameAndStatus(
            followerUserName, followingUserName, UserRelation.RelationStatus.ACTIVE);
    }
    
    /**
     * Get paginated followers
     */
    public PagedModel<UserRelationDTO> getFollowers(String userName, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserRelation> relations = userRelationRepository
            .findByFollowingUserNameAndStatusOrderByCreatedAtDesc(
                userName, UserRelation.RelationStatus.ACTIVE, pageable);
        
        Page<UserRelationDTO> relationDTOPage = relations.map(relation -> {
            // Fetch current profile picture from User entity instead of using stored one
            String currentProfilePic = userRepository.findByUserName(relation.getFollowerUserName())
                .map(User::getProfilePic)
                .orElse(relation.getFollowerProfilePic()); // Fallback to stored if user not found
            
            return UserRelationDTO.fromFollower(
                relation.getId(),
                relation.getFollowerUserName(),
                currentProfilePic,
                relation.getCreatedAt(),
                relation.getRelationType().toString(),
                relation.getStatus().toString()
            );
        });
        
        return new PagedModel<>(relationDTOPage);
    }
    
    /**
     * Get paginated following
     */
    public PagedModel<UserRelationDTO> getFollowing(String userName, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserRelation> relations = userRelationRepository
            .findByFollowerUserNameAndStatusOrderByCreatedAtDesc(
                userName, UserRelation.RelationStatus.ACTIVE, pageable);
        
        Page<UserRelationDTO> relationDTOPage = relations.map(relation -> {
            // Fetch current profile picture from User entity instead of using stored one
            String currentProfilePic = userRepository.findByUserName(relation.getFollowingUserName())
                .map(User::getProfilePic)
                .orElse(relation.getFollowingProfilePic()); // Fallback to stored if user not found
            
            return UserRelationDTO.fromFollowing(
                relation.getId(),
                relation.getFollowingUserName(),
                currentProfilePic,
                relation.getCreatedAt(),
                relation.getRelationType().toString(),
                relation.getStatus().toString()
            );
        });
        
        return new PagedModel<>(relationDTOPage);
    }
    
    /**
     * Get relationship summary for a user
     */
    public UserRelationSummaryDTO getRelationshipSummary(String userName, String currentUserName) {
        // Get counts from User entity (stored counts, no need to query UserRelation)
        User user = userRepository.findByUserName(userName)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userName));
        
        long followersCount = user.getFollowersCount();
        long followingCount = user.getFollowingCount();
        
        boolean isFollowing = false;
        boolean isFollowedBy = false;
        
        if (currentUserName != null && !currentUserName.equals(userName)) {
            isFollowing = isFollowing(currentUserName, userName);
            isFollowedBy = isFollowing(userName, currentUserName);
        }
        
        // Get recent followers
        List<UserRelation> recentFollowers = userRelationRepository
            .findTop10ByFollowingUserNameAndStatusOrderByCreatedAtDesc(
                userName, UserRelation.RelationStatus.ACTIVE);
        
        List<UserRelationDTO> recentFollowerDTOs = recentFollowers.stream()
            .map(relation -> UserRelationDTO.fromFollower(
                relation.getId(),
                relation.getFollowerUserName(),
                relation.getFollowerProfilePic(),
                relation.getCreatedAt(),
                relation.getRelationType().toString(),
                relation.getStatus().toString()
            ))
            .collect(Collectors.toList());
        
        // TODO: Implement mutual followers logic
        List<String> mutualFollowers = new ArrayList<>();
        
        return new UserRelationSummaryDTO(
            followersCount,
            followingCount,
            isFollowing,
            isFollowedBy,
            mutualFollowers,
            recentFollowerDTOs
        );
    }
    
    /**
     * Get follower usernames for backward compatibility
     */
    public List<String> getFollowerUserNames(String userName) {
        List<UserRelation> relations = userRelationRepository
            .findFollowerUserNames(userName, UserRelation.RelationStatus.ACTIVE);
        return relations.stream()
            .map(UserRelation::getFollowerUserName)
            .collect(Collectors.toList());
    }
    
    /**
     * Get following usernames for backward compatibility
     */
    public List<String> getFollowingUserNames(String userName) {
        List<UserRelation> relations = userRelationRepository
            .findFollowingUserNames(userName, UserRelation.RelationStatus.ACTIVE);
        return relations.stream()
            .map(UserRelation::getFollowingUserName)
            .collect(Collectors.toList());
    }
    
    /**
     * Get friend suggestions based on mutual connections
     */
    public List<UserRelationDTO> getFriendSuggestions(String userName, int limit) {
        // Get users that the current user follows
        List<String> following = getFollowingUserNames(userName);
        
        if (following.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Find suggestions
        List<UserRelation> suggestions = userRelationRepository
            .findFriendSuggestions(following, userName, following, UserRelation.RelationStatus.ACTIVE);
        
        return suggestions.stream()
            .limit(limit)
            .map(relation -> {
                // Fetch current profile picture from User entity instead of using stored one
                String currentProfilePic = userRepository.findByUserName(relation.getFollowingUserName())
                    .map(User::getProfilePic)
                    .orElse(relation.getFollowingProfilePic()); // Fallback to stored if user not found
                
                return UserRelationDTO.fromFollowing(
                    relation.getId(),
                    relation.getFollowingUserName(),
                    currentProfilePic,
                    relation.getCreatedAt(),
                    relation.getRelationType().toString(),
                    relation.getStatus().toString()
                );
            })
            .collect(Collectors.toList());
    }
    
    /**
     * Add follow notification
     */
    private void addFollowNotification(User following, String followerUserName) {
        NotificationsDTO notification = new NotificationsDTO(
            null, followerUserName, "Started Following You!", Instant.now(), NotificationsDTO.NotiType.PROFILE);
        
        if (following.getNotifications() == null) {
            following.setNotifications(new ArrayList<>());
        }
        
        following.getNotifications().add(notification);
        cleanupNotifications(following);
        userRepository.save(following);
    }
    
    /**
     * Remove follow notification
     */
    private void removeFollowNotification(User following, String followerUserName) {
        if (following.getNotifications() != null) {
            following.getNotifications().removeIf(notification ->
                notification.userName().equals(followerUserName) &&
                notification.noti().equals("Started Following You!")
            );
            userRepository.save(following);
        }
    }
    
    
    
    /**
     * Cleanup notifications if they exceed 30
     */
    private void cleanupNotifications(User user) {
        List<NotificationsDTO> notifications = user.getNotifications();
        if (notifications != null && notifications.size() > 30) {
            notifications.sort((n1, n2) -> n1.time().compareTo(n2.time()));
            notifications.subList(0, notifications.size() - 30).clear();
        }
    }
}
