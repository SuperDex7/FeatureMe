package Feat.FeatureMe.Repository;

import Feat.FeatureMe.Entity.PostLike;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PostLikeRepository extends MongoRepository<PostLike, String> {
    
    // Find a specific user's like for a post
    Optional<PostLike> findByPostIdAndUserName(String postId, String userName);
    
    // Get all likes for a specific post with pagination (most recent first)
    Page<PostLike> findByPostIdOrderByLikedAtDesc(String postId, Pageable pageable);
    
    // Get all likes for a specific post (for counting)
    List<PostLike> findByPostId(String postId);
    
    // Count total likes for a post
    long countByPostId(String postId);
    
    // Get likes for a post within a date range
    List<PostLike> findByPostIdAndLikedAtBetween(String postId, Instant startDate, Instant endDate);
    
    // Get most recent likes across all posts (for activity feed)
    Page<PostLike> findAllByOrderByLikedAtDesc(Pageable pageable);
    
    // Delete all likes for a specific post (when post is deleted)
    void deleteByPostId(String postId);
    
    // Get likes by specific user (for user analytics)
    Page<PostLike> findByUserNameOrderByLikedAtDesc(String userName, Pageable pageable);
    
    // Delete a specific like (for unlike functionality)
    void deleteByPostIdAndUserName(String postId, String userName);
    
    // Check if a user has already liked a post
    boolean existsByPostIdAndUserName(String postId, String userName);
}
