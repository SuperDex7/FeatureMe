import React, { useState, useEffect } from "react";
import api, { getCurrentUser } from "../services/AuthService";
import { deleteComment } from "../services/PostsService";
import "./CommentSection.css";

function CommentSection({ 
  postId, 
  comments = [], 
  onAddComment, 
  showComments, 
  setShowComments,
  postAuthor = null, // Post author information
  maxHeight = "300px", // Configurable max height for comments list
  placeholder = "Add a comment..." // Configurable placeholder text
}) {
  const [commentInput, setCommentInput] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [deletingComment, setDeletingComment] = useState(null);
  const [paginatedComments, setPaginatedComments] = useState([]);
  const [totalComments, setTotalComments] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showAllComments, setShowAllComments] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    fetchUser();
    
    // Get total comment count
    fetchCommentSummary();
  }, [postId]);

  // Fetch comment summary to get total count
  const fetchCommentSummary = async () => {
    try {
      const response = await api.get(`/posts/comments/${postId}/summary`);
      setTotalComments(response.data.totalComments || 0);
    } catch (error) {
      console.error('Error fetching comment summary:', error);
      setTotalComments(comments?.length || 0);
    }
  };

  // Load paginated comments
  const loadPaginatedComments = async (page = 0, append = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/posts/comments/${postId}/paginated?page=${page}&size=${pageSize}`);
      const newComments = response.data.content || [];
      
      if (append) {
        setPaginatedComments(prev => [...prev, ...newComments]);
      } else {
        setPaginatedComments(newComments);
      }
      
      setCurrentPage(page);
      setHasMore(newComments.length === pageSize && (page + 1) * pageSize < totalComments);
    } catch (error) {
      console.error('Error loading paginated comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load more comments
  const loadMoreComments = () => {
    loadPaginatedComments(currentPage + 1, true);
  };

  // Toggle between showing recent comments and all comments
  const toggleShowAllComments = () => {
    if (!showAllComments) {
      loadPaginatedComments(0, false);
    }
    setShowAllComments(!showAllComments);
  };

  const handleComment = (e) => {
    e.preventDefault();
    
    if (commentInput.trim() && currentUser) {
        const newComment = {
            userName: currentUser.userName,
            profilePic: currentUser.profilePic,
            comment: commentInput,
            time: new Date().toISOString()
        };
        
        // Call parent callback to update the feed item immediately
        onAddComment(newComment);
        
        // Clear input
        setCommentInput("");
        
        // Send to backend and then refresh comments from server
        api.post(`/posts/add/comment/${postId}`, commentInput, {
            headers: {
                'Content-Type': 'text/plain'
            }
        })
        .then(res => {
            // Fetch updated comments from server to get proper profile pics
            return api.get(`/posts/get/id/${postId}`);
        })
        .then(postRes => {
            if (postRes.data && postRes.data.comments) {
                // Update parent with server data (has proper profile pics)
                // Pass a flag to indicate this is a server refresh
                onAddComment(postRes.data.comments, true);
                
                // Refresh pagination data
                fetchCommentSummary();
                if (showAllComments) {
                    loadPaginatedComments(0, false);
                }
            }
        })
        .catch(err => {
            console.error('Error posting comment:', err);
            // Could add error handling here if needed
        });
    }
  };

  const handleDeleteComment = async (commentText) => {
    if (!currentUser) return;
    
    setDeletingComment(commentText);
    
    try {
      await deleteComment(postId, commentText);
      
      // Fetch updated comments from server
      const postRes = await api.get(`/posts/get/id/${postId}`);
      if (postRes.data && postRes.data.comments) {
        // Update parent with server data
        onAddComment(postRes.data.comments, true);
        
        // Refresh pagination data
        fetchCommentSummary();
        if (showAllComments) {
          loadPaginatedComments(0, false);
        }
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      // Could add error handling here if needed
    } finally {
      setDeletingComment(null);
    }
  };

  return (
    <div className="comment-section-container">
      <div className="comment-section-header">
        <h3 className="comment-section-title">Comments</h3>
        <div className="comment-header-controls">
          <span className="comment-count">{totalComments || comments?.length || 0}</span>
          {totalComments > (comments?.length || 0) && (
            <button 
              className="view-all-comments-btn"
              onClick={toggleShowAllComments}
            >
              {showAllComments ? 'Show Recent' : `View All ${totalComments}`}
            </button>
          )}
        </div>
      </div>
      
      <div className="comment-section-body">
        <div className="comments-list" style={{ maxHeight }}>
          {(showAllComments ? paginatedComments : comments) && (showAllComments ? paginatedComments : comments).length > 0 ? (
            (showAllComments ? paginatedComments : comments).map((comment, index) => (
              // Only render comment if it has required fields
              comment && comment.userName && comment.comment ? (
                <div key={index} className="comment-item">
                  <div className="comment-avatar-container">
                    <a href={`/profile/${comment.userName}`}>
                      <img 
                        className="comment-avatar" 
                        src={comment.profilePic} 
                        alt={comment.userName} 
                      />
                    </a>
                  </div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <a href={`/profile/${comment.userName}`} className="comment-username">
                        {comment.userName}
                      </a>
                      <div className="comment-header-right">
                        <span className="comment-time">
                          {comment.time ? new Date(comment.time).toLocaleDateString() : 'Just now'}
                        </span>
                        {currentUser && (currentUser.userName === comment.userName || (postAuthor && currentUser.userName === postAuthor.userName)) && (
                          <button
                            className="delete-comment-btn"
                            onClick={() => handleDeleteComment(comment.comment)}
                            disabled={deletingComment === comment.comment}
                            title={currentUser.userName === comment.userName ? "Delete your comment" : "Delete comment (as post author)"}
                          >
                            {deletingComment === comment.comment ? '...' : '🗑️'}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="comment-text">{comment.comment}</p>
                  </div>
                </div>
              ) : null
            ))
          ) : (
            <div className="no-comments">
              <div className="no-comments-icon">💬</div>
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
          
          {/* Load More Button for Pagination */}
          {showAllComments && hasMore && !loading && (
            <div className="load-more-comments">
              <button 
                className="load-more-btn"
                onClick={loadMoreComments}
              >
                Load More Comments
              </button>
            </div>
          )}
          
          {loading && (
            <div className="comments-loading">
              <span>Loading comments...</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="comment-section-footer">
        <div className="add-comment-row">
          <input
            className="add-comment-input"
            type="text"
            placeholder={placeholder}
            value={commentInput}
            onChange={e => setCommentInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleComment(); }}
          />
          <button 
            className="add-comment-btn" 
            onClick={handleComment}
            disabled={!commentInput.trim()}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

export default CommentSection;
