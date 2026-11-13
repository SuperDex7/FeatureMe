package Feat.FeatureMe.Service;

import Feat.FeatureMe.Dto.LikesDTO;
import Feat.FeatureMe.Entity.PostLike;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.PostLikeRepository;
import Feat.FeatureMe.Repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PostLikeService {
    
    private final PostLikeRepository postLikeRepository;
    private final UserRepository userRepository;
    
    public PostLikeService(PostLikeRepository postLikeRepository, UserRepository userRepository) {
        this.postLikeRepository = postLikeRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Add a like to a post (or remove if already liked)
     * Returns true if liked, false if unliked
     */
    public boolean toggleLike(String postId, String userName) {
        // Verify user exists
        userRepository.findByUserName(userName)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Check if user has already liked this post
        if (postLikeRepository.existsByPostIdAndUserName(postId, userName)) {
            // Unlike - remove the like
            postLikeRepository.deleteByPostIdAndUserName(postId, userName);
            return false; // Unliked
        } else {
            // Like - add new like
            Instant now = Instant.now();
            PostLike newLike = new PostLike(postId, userName, now);
            postLikeRepository.save(newLike);
            return true; // Liked
        }
    }
    
    /**
     * Add a like to a post (only if not already liked)
     */
    public boolean addLike(String postId, String userName) {
        if (postLikeRepository.existsByPostIdAndUserName(postId, userName)) {
            return false; // Already liked
        }
        
        // Verify user exists
        userRepository.findByUserName(userName)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        Instant now = Instant.now();
        PostLike newLike = new PostLike(postId, userName, now);
        postLikeRepository.save(newLike);
        return true; // Successfully liked
    }
    
    /**
     * Remove a like from a post
     */
    public boolean removeLike(String postId, String userName) {
        if (postLikeRepository.existsByPostIdAndUserName(postId, userName)) {
            postLikeRepository.deleteByPostIdAndUserName(postId, userName);
            return true; // Successfully unliked
        }
        return false; // Wasn't liked
    }
    
    /**
     * Check if a user has liked a post
     */
    public boolean hasUserLiked(String postId, String userName) {
        return postLikeRepository.existsByPostIdAndUserName(postId, userName);
    }
    
    /**
     * Get paginated likes for a specific post
     */
    public Page<LikesDTO> getPostLikes(String postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PostLike> likesPage = postLikeRepository.findByPostIdOrderByLikedAtDesc(postId, pageable);
        
        Map<String, String> pics = profilePicsFor(likesPage.getContent());
        return likesPage.map(item -> convertToLikesDTO(item, pics));
    }
    
    /**
     * Get total like count for a post
     */
    public long getTotalLikes(String postId) {
        return postLikeRepository.countByPostId(postId);
    }
    
    /**
     * Get like counts for multiple posts (batch operation for better performance)
     */
    public java.util.Map<String, Long> getLikeCounts(List<String> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return java.util.Map.of();
        }
        
        // Use aggregation to get counts for all posts in one query
        return postIds.stream()
            .collect(java.util.stream.Collectors.toMap(
                postId -> postId,
                this::getTotalLikes
            ));
    }
    
    /**
     * Get recent likes for a post (for post DTOs)
     */
    /** A user's likes, most recent first */
    public Page<PostLike> getLikesByUser(String userName, int page, int size) {
        return postLikeRepository.findByUserNameOrderByLikedAtDesc(userName, PageRequest.of(page, size));
    }

    public List<LikesDTO> getRecentLikes(String postId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        Page<PostLike> likesPage = postLikeRepository.findByPostIdOrderByLikedAtDesc(postId, pageable);
        
        Map<String, String> pics = profilePicsFor(likesPage.getContent());
        return likesPage.getContent()
                .stream()
                .map(item -> convertToLikesDTO(item, pics))
                .collect(Collectors.toList());
    }
    
    /**
     * Delete all likes for a post (when post is deleted)
     */
    public void deleteLikesForPost(String postId) {
        postLikeRepository.deleteByPostId(postId);
    }
    
    /**
     * Get likes by a specific user (for user analytics)
     */
    public Page<LikesDTO> getUserLikes(String userName, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PostLike> likesPage = postLikeRepository.findByUserNameOrderByLikedAtDesc(userName, pageable);
        
        Map<String, String> pics = profilePicsFor(likesPage.getContent());
        return likesPage.map(item -> convertToLikesDTO(item, pics));
    }
    
    /**
     * Convert PostLike entity to LikesDTO
     */
    private LikesDTO convertToLikesDTO(PostLike postLike, Map<String, String> pics) {
        return new LikesDTO(
            postLike.getUserName(),
            pics.get(postLike.getUserName()),
            postLike.getLikedAt()
        );
    }

    /** Everyone's current profile picture in one query, instead of one per item */
    private Map<String, String> profilePicsFor(java.util.Collection<PostLike> items) {
        List<String> names = items.stream().map(PostLike::getUserName).filter(java.util.Objects::nonNull).distinct().toList();
        Map<String, String> pics = new java.util.HashMap<>();
        if (!names.isEmpty()) {
            for (User user : userRepository.findByUserNameIn(names)) {
                pics.put(user.getUserName(), user.getProfilePic());
            }
        }
        return pics;
    }
    
    /**
     * Get likes summary for a post
     */
    public PostLikeSummary getLikeSummary(String postId) {
        long totalLikes = getTotalLikes(postId);
        
        return new PostLikeSummary(totalLikes);
    }
    
    /**
     * Inner class for like summary data
     */
    public static class PostLikeSummary {
        private final long totalLikes;
        
        public PostLikeSummary(long totalLikes) {
            this.totalLikes = totalLikes;
        }
        
        public long getTotalLikes() { 
            return totalLikes; 
        }
    }
}
