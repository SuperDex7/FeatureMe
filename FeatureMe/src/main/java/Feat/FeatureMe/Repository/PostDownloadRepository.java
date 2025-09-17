package Feat.FeatureMe.Repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import Feat.FeatureMe.Entity.PostDownload;

@Repository
public interface PostDownloadRepository extends MongoRepository<PostDownload, String> {
    
    List<PostDownload> findByPostId(String postId);
    
    List<PostDownload> findByPostIdOrderByDownloadTimeDesc(String postId);
    
    Page<PostDownload> findByPostIdOrderByDownloadTimeDesc(String postId, Pageable pageable);
    
    long countByPostId(String postId);
    
    List<PostDownload> findByUserId(String userId);
    
    boolean existsByPostIdAndUserId(String postId, String userId);
    
    // Delete all downloads for a specific post (when post is deleted)
    void deleteByPostId(String postId);
}
