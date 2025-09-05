package Feat.FeatureMe.Repository;

import Feat.FeatureMe.Entity.PostComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostCommentRepository extends MongoRepository<PostComment, String> {
    
    // Get all comments for a specific post with pagination (most recent first)
    Page<PostComment> findByPostIdOrderByTimeDesc(String postId, Pageable pageable);
    
    // Get all comments for a specific post (for counting)
    List<PostComment> findByPostId(String postId);
    
    // Count total comments for a post
    long countByPostId(String postId);
    
    // Get comments for a post within a date range
    List<PostComment> findByPostIdAndTimeBetween(String postId, LocalDateTime startDate, LocalDateTime endDate);
    
    // Get most recent comments across all posts (for activity feed)
    Page<PostComment> findAllByOrderByTimeDesc(Pageable pageable);
    
    // Delete all comments for a specific post (when post is deleted)
    void deleteByPostId(String postId);
    
    // Get comments by specific user (for user analytics)
    Page<PostComment> findByUserNameOrderByTimeDesc(String userName, Pageable pageable);
    
    // Delete a specific comment by user and post (for comment deletion)
    void deleteByPostIdAndUserNameAndTime(String postId, String userName, LocalDateTime time);
}
