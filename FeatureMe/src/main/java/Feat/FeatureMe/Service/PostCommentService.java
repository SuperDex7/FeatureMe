package Feat.FeatureMe.Service;

import Feat.FeatureMe.Dto.CommentDTO;
import Feat.FeatureMe.Entity.PostComment;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.PostCommentRepository;
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
public class PostCommentService {
    
    private final PostCommentRepository postCommentRepository;
    private final UserRepository userRepository;
    
    public PostCommentService(PostCommentRepository postCommentRepository, UserRepository userRepository) {
        this.postCommentRepository = postCommentRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Add a comment to a post
     */
    public PostComment addComment(String postId, String userName, String commentText) {
        // Verify user exists
        userRepository.findByUserName(userName)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        LocalDateTime now = LocalDateTime.now();
        
        PostComment newComment = new PostComment(
            postId,
            userName,
            commentText,
            now
        );
        
        return postCommentRepository.save(newComment);
    }
    
    /**
     * Get paginated comments for a specific post
     */
    public Page<CommentDTO> getPostComments(String postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PostComment> commentsPage = postCommentRepository.findByPostIdOrderByTimeDesc(postId, pageable);
        
        return commentsPage.map(this::convertToCommentDTO);
    }
    
    /**
     * Get total comment count for a post
     */
    public long getTotalComments(String postId) {
        return postCommentRepository.countByPostId(postId);
    }
    
    /**
     * Get recent comments for a post (for post DTOs)
     */
    public List<CommentDTO> getRecentComments(String postId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        Page<PostComment> commentsPage = postCommentRepository.findByPostIdOrderByTimeDesc(postId, pageable);
        
        return commentsPage.getContent()
                .stream()
                .map(this::convertToCommentDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Delete a specific comment by comment ID
     * Returns the deleted comment for cleanup purposes, or null if not found/unauthorized
     */
    public PostComment deleteCommentById(String commentId, String userName) {
        Optional<PostComment> commentOpt = postCommentRepository.findById(commentId);
        
        if (commentOpt.isPresent()) {
            PostComment comment = commentOpt.get();
            
            // Verify the user owns this comment
            if (comment.getUserName().equals(userName)) {
                postCommentRepository.deleteById(commentId);
                return comment;
            }
        }
        
        return null;
    }
    
    /**
     * Delete all comments for a post (when post is deleted)
     */
    public void deleteCommentsForPost(String postId) {
        postCommentRepository.deleteByPostId(postId);
    }
    
    /**
     * Get comments by a specific user (for user analytics)
     */
    public Page<CommentDTO> getUserComments(String userName, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PostComment> commentsPage = postCommentRepository.findByUserNameOrderByTimeDesc(userName, pageable);
        
        return commentsPage.map(this::convertToCommentDTO);
    }
    
    /**
     * Convert PostComment entity to CommentDTO
     */
    private CommentDTO convertToCommentDTO(PostComment postComment) {
        // Fetch current profile picture from User entity
        String profilePic = userRepository.findByUserName(postComment.getUserName())
            .map(User::getProfilePic)
            .orElse(null); // Fallback to null if user not found
        
        return new CommentDTO(
            postComment.getId(),
            postComment.getUserName(),
            profilePic,
            postComment.getComment(),
            postComment.getTime()
        );
    }
    
}
