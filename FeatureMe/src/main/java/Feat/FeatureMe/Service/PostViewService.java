package Feat.FeatureMe.Service;

import Feat.FeatureMe.Dto.ViewsDTO;
import Feat.FeatureMe.Entity.PostView;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.PostViewRepository;
import Feat.FeatureMe.Repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PostViewService {
    
    private final PostViewRepository postViewRepository;
    private final UserRepository userRepository;
    
    public PostViewService(PostViewRepository postViewRepository, UserRepository userRepository) {
        this.postViewRepository = postViewRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Add a view for a post by a user
     */
    public void addView(String postId, String userName) {
        User user = userRepository.findByUserName(userName)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        LocalDateTime now = LocalDateTime.now();
        
        // Check if user has already viewed this post
        Optional<PostView> existingView = postViewRepository.findByPostIdAndUserName(postId, userName);
        
        if (existingView.isPresent()) {
            // Update existing view - increment count and update last view time
            PostView view = existingView.get();
            view.setLastView(now);
            view.setViewCount(view.getViewCount() + 1);
            postViewRepository.save(view);
        } else {
            // Create new view entry
            PostView newView = new PostView(
                postId,
                userName,
                user.getProfilePic(),
                now, // First view time
                now, // Last view time (same as first for new views)
                1    // Initial view count
            );
            postViewRepository.save(newView);
        }
    }
    
    /**
     * Get paginated views for a specific post
     */
    public Page<ViewsDTO> getPostViews(String postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PostView> viewsPage = postViewRepository.findByPostIdOrderByLastViewDesc(postId, pageable);
        
        return viewsPage.map(this::convertToViewsDTO);
    }
    
    /**
     * Get total view count for a post
     */
    public long getTotalViews(String postId) {
        return postViewRepository.findByPostId(postId)
                .stream()
                .mapToInt(PostView::getViewCount)
                .sum();
    }
    
    /**
     * Get unique viewer count for a post
     */
    public long getUniqueViewers(String postId) {
        return postViewRepository.countByPostId(postId);
    }
    
    /**
     * Get recent views for a post (for analytics preview)
     */
    public List<ViewsDTO> getRecentViews(String postId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        Page<PostView> viewsPage = postViewRepository.findByPostIdOrderByLastViewDesc(postId, pageable);
        
        return viewsPage.getContent()
                .stream()
                .map(this::convertToViewsDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Delete all views for a post (when post is deleted)
     */
    public void deleteViewsForPost(String postId) {
        postViewRepository.deleteByPostId(postId);
    }
    
    /**
     * Convert PostView entity to ViewsDTO
     */
    private ViewsDTO convertToViewsDTO(PostView postView) {
        return new ViewsDTO(
            postView.getUserName(),
            postView.getProfilePic(),
            postView.getFirstView(),
            postView.getLastView(),
            postView.getViewCount()
        );
    }
    
    /**
     * Get analytics summary for a post
     */
    public PostViewSummary getViewSummary(String postId) {
        long totalViews = getTotalViews(postId);
        long uniqueViewers = getUniqueViewers(postId);
        double avgViewsPerUser = uniqueViewers > 0 ? (double) totalViews / uniqueViewers : 0;
        
        return new PostViewSummary(totalViews, uniqueViewers, avgViewsPerUser);
    }
    
    /**
     * Inner class for view summary data
     */
    public static class PostViewSummary {
        private final long totalViews;
        private final long uniqueViewers;
        private final double avgViewsPerUser;
        
        public PostViewSummary(long totalViews, long uniqueViewers, double avgViewsPerUser) {
            this.totalViews = totalViews;
            this.uniqueViewers = uniqueViewers;
            this.avgViewsPerUser = avgViewsPerUser;
        }
        
        public long getTotalViews() { return totalViews; }
        public long getUniqueViewers() { return uniqueViewers; }
        public double getAvgViewsPerUser() { return avgViewsPerUser; }
    }
}
