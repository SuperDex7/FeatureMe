import React, { useState, useEffect, useRef } from "react";
import api, { getCurrentUser } from "../services/AuthService";
import { deleteComment } from "../services/PostsService";
import "./CommentSection2.css";

function CommentSection2({ 
  postId, 
  comments = [], 
  onAddComment, 
  showComments, 
  setShowComments,
  postAuthor = null,
  maxHeight = "400px",
  placeholder = "Share your thoughts...",
  totalCommentsFromPost = 0,
  theme = "modern" // modern, dark, light
}) {
  const [commentInput, setCommentInput] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [deletingComment, setDeletingComment] = useState(null);
  const [paginatedComments, setPaginatedComments] = useState([]);
  const [totalComments, setTotalComments] = useState(totalCommentsFromPost);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyInput, setReplyInput] = useState("");
  const [commentReactions, setCommentReactions] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  
  const pageSize = 10;
  const inputRef = useRef(null);
  const replyInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Available reaction emojis
  const reactions = ['❤️', '👍', '😂', '😮', '😢', '🔥', '💯', '👏'];

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, [postId]);

  useEffect(() => {
    setTotalComments(totalCommentsFromPost);
  }, [totalCommentsFromPost]);

  // Handle typing indicator
  useEffect(() => {
    if (commentInput.trim()) {
      setIsTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    } else {
      setIsTyping(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [commentInput]);

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

  const loadMoreComments = () => {
    loadPaginatedComments(currentPage + 1, true);
  };

  const toggleShowAllComments = () => {
    if (!showAllComments) {
      loadPaginatedComments(0, false);
    }
    setShowAllComments(!showAllComments);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    
    if (commentInput.trim() && currentUser) {
      const newComment = {
        userName: currentUser.userName,
        profilePic: currentUser.profilePic,
        comment: commentInput,
        time: new Date().toISOString(),
        replies: [],
        reactions: {}
      };
      
      // Optimistic update
      onAddComment(newComment);
      setCommentInput("");
      setIsTyping(false);
      
      try {
        await api.post(`/posts/add/comment/${postId}`, commentInput, {
          headers: { 'Content-Type': 'text/plain' }
        });
        
        // Fetch updated comments from server
        const postRes = await api.get(`/posts/get/id/${postId}`);
        if (postRes.data && postRes.data.comments) {
          onAddComment(postRes.data.comments, true);
          if (showAllComments) {
            loadPaginatedComments(0, false);
          }
        }
      } catch (err) {
        console.error('Error posting comment:', err);
      }
    }
  };

  // const handleReply = async (parentComment, replyText) => {
  //   if (!replyText.trim() || !currentUser) return;
    
  //   try {
  //     // For now, we'll add replies as regular comments with a parent reference
  //     // This would need backend support for nested comments
  //     const replyComment = {
  //       userName: currentUser.userName,
  //       profilePic: currentUser.profilePic,
  //       comment: replyText,
  //       time: new Date().toISOString(),
  //       parentId: parentComment.id,
  //       isReply: true
  //     };
      
  //     onAddComment(replyComment);
  //     setReplyInput("");
  //     setReplyingTo(null);
      
  //     // Here you would send the reply to the backend
  //     // await api.post(`/posts/add/reply/${postId}/${parentComment.id}`, replyText);
  //   } catch (err) {
  //     console.error('Error posting reply:', err);
  //   }
  // };

  // const handleReaction = async (commentId, reaction) => {
  //   if (!currentUser) return;
    
  //   try {
  //     // Toggle reaction
  //     const currentReactions = commentReactions[commentId] || {};
  //     const userReaction = currentReactions[currentUser.userName];
      
  //     if (userReaction === reaction) {
  //       // Remove reaction
  //       delete currentReactions[currentUser.userName];
  //     } else {
  //       // Add/change reaction
  //       currentReactions[currentUser.userName] = reaction;
  //     }
      
  //     setCommentReactions(prev => ({
  //       ...prev,
  //       [commentId]: currentReactions
  //     }));
      
  //     // Here you would send the reaction to the backend
  //     // await api.post(`/posts/comment/${commentId}/react`, { reaction });
  //   } catch (err) {
  //     console.error('Error adding reaction:', err);
  //   }
  // };

  const handleDeleteComment = async (comment) => {
    if (!currentUser || !comment.id) {
      console.error('Cannot delete comment: missing user or comment ID');
      return;
    }
    
    setDeletingComment(comment.id);
    
    try {
      await deleteComment(comment.id);
      
      const postRes = await api.get(`/posts/get/id/${postId}`);
      if (postRes.data && postRes.data.comments) {
        onAddComment(postRes.data.comments, true);
        if (showAllComments) {
          loadPaginatedComments(0, false);
        }
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    } finally {
      setDeletingComment(null);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getReactionCount = (commentId) => {
    const reactions = commentReactions[commentId] || {};
    const counts = {};
    Object.values(reactions).forEach(reaction => {
      counts[reaction] = (counts[reaction] || 0) + 1;
    });
    return counts;
  };

  const renderComment = (comment, index, isReply = false) => {
    const commentReactions = getReactionCount(comment.id);
    const userReaction = commentReactions[comment.id]?.[currentUser?.userName];
    
    return (
      <div key={comment.id || index} className={`cs2-item ${isReply ? 'cs2-reply' : ''}`}>
        <div className="cs2-avatar-container">
          <a href={`/profile/${comment.userName}`}>
            <img 
              className="cs2-avatar" 
              src={comment.profilePic || "https://randomuser.me/api/portraits/men/32.jpg"} 
              alt={comment.userName} 
            />
          </a>
        </div>
        
        <div className="cs2-content">
          <div className="cs2-item-header">
            <div className="cs2-user-info">
              <a href={`/profile/${comment.userName}`} className="cs2-username">
                {comment.userName}
              </a>
              <span className="cs2-time">{formatTimeAgo(comment.time)}</span>
            </div>
            
            <div className="cs2-actions">
              {/* {currentUser && comment.id && (
                <div className="cs2-reaction-picker">
                  <button
                    className="cs2-reaction-btn"
                    onClick={() => setShowReactionPicker(showReactionPicker === comment.id ? null : comment.id)}
                    title="Add reaction"
                  >
                    😊
                  </button>
                  
                  {showReactionPicker === comment.id && (
                    <div className="cs2-reaction-picker-menu">
                      {reactions.map(reaction => (
                        <button
                          key={reaction}
                          className="cs2-reaction-option"
                          onClick={() => {
                            handleReaction(comment.id, reaction);
                            setShowReactionPicker(null);
                          }}
                        >
                          {reaction}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )} */}
              
              {/* {currentUser && (
                <button
                  className="cs2-reply-btn"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  title="Reply"
                >
                  Reply
                </button>
              )} */}
              
              {currentUser && comment.id && (currentUser.userName === comment.userName || (postAuthor && currentUser.userName === postAuthor.userName)) && (
                <button
                  className="cs2-delete-btn"
                  onClick={() => handleDeleteComment(comment)}
                  disabled={deletingComment === comment.id}
                  title={currentUser.userName === comment.userName ? "Delete your comment" : "Delete comment (as post author)"}
                >
                  {deletingComment === comment.id ? '...' : '🗑️'}
                </button>
              )}
            </div>
          </div>
          
          <p className="cs2-text">{comment.comment}</p>
          
          {/* Comment Reactions */}
          {/* {Object.keys(commentReactions).length > 0 && (
            <div className="cs2-reactions">
              {Object.entries(commentReactions).map(([reaction, count]) => (
                <button
                  key={reaction}
                  className={`cs2-reaction ${userReaction === reaction ? 'cs2-active' : ''}`}
                  onClick={() => handleReaction(comment.id, reaction)}
                >
                  <span className="cs2-reaction-emoji">{reaction}</span>
                  <span className="cs2-reaction-count">{count}</span>
                </button>
              ))}
            </div>
          )} */}
          
          {/* Reply Input */}
          {/* {replyingTo === comment.id && (
            <div className="cs2-reply-input">
              <input
                ref={replyInputRef}
                type="text"
                placeholder={`Reply to ${comment.userName}...`}
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleReply(comment, replyInput);
                  } else if (e.key === 'Escape') {
                    setReplyingTo(null);
                    setReplyInput("");
                  }
                }}
                className="cs2-reply-input-field"
                autoFocus
              />
              <div className="cs2-reply-actions">
                <button
                  className="cs2-reply-send-btn"
                  onClick={() => handleReply(comment, replyInput)}
                  disabled={!replyInput.trim()}
                >
                  Send
                </button>
                <button
                  className="cs2-reply-cancel-btn"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyInput("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )} */}
        </div>
      </div>
    );
  };

  return (
    <div className={`cs2-section-container cs2-section-${theme}`}>
      <div className="cs2-section-header">
        <div className="cs2-header-left">
          <h3 className="cs2-section-title">
            <span className="cs2-icon">💬</span>
            Comments
          </h3>
          <span className="cs2-count">{totalComments || comments?.length || 0}</span>
        </div>
        
        <div className="cs2-header-controls">
          {totalComments > (comments?.length || 0) && (
            <button 
              className="cs2-view-all-btn"
              onClick={toggleShowAllComments}
            >
              {showAllComments ? 'Show Recent' : `View All ${totalComments}`}
            </button>
          )}
          
          {isTyping && (
            <div className="cs2-typing-indicator">
              <span className="cs2-typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
              <span className="cs2-typing-text">Someone is typing...</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="cs2-section-body">
        <div className="cs2-comments-list" style={{ maxHeight }}>
          {(showAllComments ? paginatedComments : comments) && (showAllComments ? paginatedComments : comments).length > 0 ? (
            (showAllComments ? paginatedComments : comments).map((comment, index) => 
              comment && comment.userName && comment.comment ? renderComment(comment, index) : null
            )
          ) : (
            <div className="cs2-no-comments">
              <div className="cs2-no-comments-icon">💭</div>
              <h4>No comments yet</h4>
              <p>Be the first to share your thoughts!</p>
            </div>
          )}
          
          {/* Load More Button */}
          {showAllComments && hasMore && !loading && (
            <div className="cs2-load-more">
              <button 
                className="cs2-load-more-btn"
                onClick={loadMoreComments}
              >
                Load More Comments
              </button>
            </div>
          )}
          
          {loading && (
            <div className="cs2-loading">
              <div className="cs2-loading-spinner"></div>
              <span>Loading comments...</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="cs2-section-footer">
        <form className="cs2-add-comment-form" onSubmit={handleComment}>
          <div className="cs2-input-container">
            <div className="cs2-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="cs2-input"
                maxLength={500}
              />
              <div className="cs2-input-footer">
                <span className="cs2-character-count">
                  {commentInput.length}/500
                </span>
                <div className="cs2-input-actions">
                  {/* <button 
                    type="button"
                    className="cs2-emoji-picker-btn"
                    title="Add emoji"
                  >
                    😊
                  </button> */}
                </div>
              </div>
            </div>
            
            <button 
              type="submit"
              className="cs2-send-btn" 
              disabled={!commentInput.trim()}
            >
              <span className="cs2-send-icon">➤</span>
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CommentSection2;
