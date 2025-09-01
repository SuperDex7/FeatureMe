import React, { useState } from "react";
import api from "../services/AuthService";
import "./CommentSection.css";

function CommentSection({ 
  postId, 
  comments = [], 
  onAddComment, 
  showComments, 
  setShowComments,
  maxHeight = "300px", // Configurable max height for comments list
  placeholder = "Add a comment..." // Configurable placeholder text
}) {
  const [commentInput, setCommentInput] = useState("");
  const userString = localStorage.getItem('user');
  const userrr = JSON.parse(userString);

  const handleComment = (e) => {
    e.preventDefault();
    
    if (commentInput.trim()) {
        const newComment = {
            userName: userrr.username,
            profilePic: userrr.profilePic,
            comment: commentInput,
            time: new Date().toISOString()
        };
        
        // Call parent callback to update the feed item immediately
        onAddComment(newComment);
        
        // Clear input
        setCommentInput("");
        
        // Send to backend and then refresh comments from server
        api.post(`/posts/add/comment/${postId}/${userrr.username}`, commentInput, {
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
            }
        })
        .catch(err => {
            console.error('Error posting comment:', err);
            // Could add error handling here if needed
        });
    }
  };

  return (
    <div className="comment-section-container">
      <div className="comment-section-header">
        <h3 className="comment-section-title">Comments</h3>
        <span className="comment-count">{comments?.length || 0}</span>
      </div>
      
      <div className="comment-section-body">
        <div className="comments-list" style={{ maxHeight }}>
          {comments && comments.length > 0 ? (
            comments.map((comment, index) => (
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
                      <span className="comment-time">
                        {comment.time ? new Date(comment.time).toLocaleDateString() : 'Just now'}
                      </span>
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
