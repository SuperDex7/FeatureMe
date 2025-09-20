package Feat.FeatureMe.Repository;

import Feat.FeatureMe.Entity.PostView;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PostViewRepository extends MongoRepository<PostView, String> {
    
    // Find a specific user's view record for a post
    Optional<PostView> findByPostIdAndUserName(String postId, String userName);
    
    // Get all views for a specific post with pagination (most recent first)
    Page<PostView> findByPostIdOrderByLastViewDesc(String postId, Pageable pageable);
    
    // Get all views for a specific post (for counting)
    List<PostView> findByPostId(String postId);
    
    // Count total views for a post
    long countByPostId(String postId);
    
    // Count unique viewers for a post
    @Query(value = "{'postId': ?0}", count = true)
    long countUniqueViewersByPostId(String postId);
    
    // Get views for a post within a date range
    List<PostView> findByPostIdAndLastViewBetween(String postId, Instant startDate, Instant endDate);
    
    // Get most recent views across all posts (for activity feed)
    Page<PostView> findAllByOrderByLastViewDesc(Pageable pageable);
    
    // Delete all views for a specific post (when post is deleted)
    void deleteByPostId(String postId);
    
    // Get views by specific user (for user analytics)
    Page<PostView> findByUserNameOrderByLastViewDesc(String userName, Pageable pageable);
}
