import React, { useState } from "react";
import api from "../services/AuthService";
import "./LikesSection.css";

function LikesSection({ 
  postId, 
  likes = [], 
  onLikeUpdate,
  showLikes, 
  setShowLikes
  // Removed maxHeight prop to use CSS-controlled height
}) {
  const [localLikes, setLocalLikes] = useState(likes || []);
  const userString = localStorage.getItem('user');
  const userrr = JSON.parse(userString);

  const handleLike = (e) => {
    e.preventDefault();
    
    // Optimistically update UI
    const isLiked = localLikes.some(like => like.userName === userrr.username);
    let updatedLikes;
    
    if (isLiked) {
      // Unlike - remove user from likes
      updatedLikes = localLikes.filter(like => like.userName !== userrr.username);
    } else {
      // Like - add user to likes
      const newLike = {
        userName: userrr.username,
        profilePic: userrr.profilePic
      };
      updatedLikes = [...localLikes, newLike];
    }
    
    // Update local state immediately
    setLocalLikes(updatedLikes);
    
    // Call parent callback to update the feed item
    if (onLikeUpdate) {
      onLikeUpdate(updatedLikes);
    }
    
    // Send to backend
    api.post(`/posts/add/like/${postId}/${userrr.username}`)
    .then(res => {
      // Fetch updated post from server to get accurate data
      return api.get(`/posts/get/id/${postId}`);
    })
    .then(postRes => {
      if (postRes.data && postRes.data.likes) {
        // Update with server data
        setLocalLikes(postRes.data.likes);
        if (onLikeUpdate) {
          onLikeUpdate(postRes.data.likes);
        }
      }
    })
    .catch(err => {
      console.error('Error updating like:', err);
      // Revert on error
      setLocalLikes(likes || []);
      if (onLikeUpdate) {
        onLikeUpdate(likes || []);
      }
    });
  };

  const isUserLiked = localLikes.some(like => like.userName === userrr.username);

  return (
    <div className="likes-section-container">
      <div className="likes-section-header">
        <h3 className="likes-section-title">Likes</h3>
        <span className="likes-count">{localLikes.length}</span>
      </div>
      
      <div className="likes-section-body">
        <div className="like-button-container">
          <button 
            className={`like-btn ${isUserLiked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            <span className="like-icon">❤️</span>
            <span className="like-text">
              {isUserLiked ? 'Unlike' : 'Like'}
            </span>
          </button>
        </div>
        
        <div className="likes-list">
          {localLikes && localLikes.length > 0 ? (
            localLikes.map((like, index) => (
              // Only render like if it has required fields
              like && like.userName ? (
                <div key={index} className="like-item">
                  <div className="like-avatar-container">
                    <a href={`/profile/${like.userName}`}>
                      <img 
                        className="like-avatar" 
                        src={like.profilePic} 
                        alt={like.userName} 
                      />
                    </a>
                  </div>
                  <div className="like-content">
                    <a href={`/profile/${like.userName}`} className="like-username">
                      {like.userName}
                    </a>
                  </div>
                </div>
              ) : null
            ))
          ) : (
            <div className="no-likes">
              <div className="no-likes-icon">💔</div>
              <p>No likes yet. Be the first to like this post!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LikesSection;
