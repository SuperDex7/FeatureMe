import React, { useState, useEffect } from "react";
import api, { getCurrentUser } from "../services/AuthService";
import "../Styling/LikesSection.css";

function LikesSection({ 
  postId, 
  likes = [], 
  onLikeUpdate,
  showLikes, 
  setShowLikes
}) {
  const [localLikes, setLocalLikes] = useState(likes || []);
  const [currentUser, setCurrentUser] = useState(null);
  const [paginatedLikes, setPaginatedLikes] = useState([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showAllLikes, setShowAllLikes] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const pageSize = 24;

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    fetchUser();
    
    fetchLikesSummary();
  }, [postId]);

  const fetchLikesSummary = async () => {
    try {
      const response = await api.get(`/posts/likes/${postId}/summary`);
      setTotalLikes(response.data.totalLikes || 0);
    } catch (error) {
      console.error('Error fetching likes summary:', error);
      setTotalLikes(localLikes?.length || 0);
    }
  };

  const loadPaginatedLikes = async (page = 0, append = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/posts/likes/${postId}/paginated?page=${page}&size=${pageSize}`);
      const newLikes = response.data.content || [];
      
      if (append) {
        setPaginatedLikes(prev => [...prev, ...newLikes]);
      } else {
        setPaginatedLikes(newLikes);
      }
      
      setCurrentPage(page);
      setHasMore(newLikes.length === pageSize && (page + 1) * pageSize < totalLikes);
    } catch (error) {
      console.error('Error loading paginated likes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreLikes = () => {
    loadPaginatedLikes(currentPage + 1, true);
  };

  const toggleShowAllLikes = () => {
    if (!showAllLikes) {
      loadPaginatedLikes(0, false);
    }
    setShowAllLikes(!showAllLikes);
  };

  const handleLike = async (e) => {
    e.preventDefault();
    
    if (!currentUser || isLiking) return;
    
    setIsLiking(true);
    
    // Optimistically update UI
    const isLiked = localLikes.some(like => like.userName === currentUser.userName);
    let updatedLikes;
    
    if (isLiked) {
      updatedLikes = localLikes.filter(like => like.userName !== currentUser.userName);
    } else {
      const newLike = {
        userName: currentUser.userName,
        profilePic: currentUser.profilePic
      };
      updatedLikes = [...localLikes, newLike];
    }
    
    setLocalLikes(updatedLikes);
    
    if (onLikeUpdate) {
      onLikeUpdate(updatedLikes);
    }
    
    try {
      await api.post(`/posts/add/like/${postId}`);
      const postRes = await api.get(`/posts/get/id/${postId}`);
      
      if (postRes.data && postRes.data.likes) {
        setLocalLikes(postRes.data.likes);
        if (onLikeUpdate) {
          onLikeUpdate(postRes.data.likes);
        }
        
        fetchLikesSummary();
        if (showAllLikes) {
          loadPaginatedLikes(0, false);
        }
      }
    } catch (err) {
      console.error('Error updating like:', err);
      setLocalLikes(likes || []);
      if (onLikeUpdate) {
        onLikeUpdate(likes || []);
      }
    } finally {
      setIsLiking(false);
    }
  };

  const isUserLiked = currentUser ? localLikes.some(like => like.userName === currentUser.userName) : false;

  return (
    <div className="posts-likes-container">
      {/* Header */}
      <div className="posts-likes-header">
        <div className="posts-likes-title-section">
          <div className="posts-likes-icon">❤️</div>
          <h3 className="posts-likes-title">Likes</h3>
          <div className="posts-likes-count">{totalLikes || localLikes.length}</div>
        </div>
        
        {totalLikes > (localLikes?.length || 0) && (
          <button 
            className="posts-view-all-btn"
            onClick={toggleShowAllLikes}
          >
            {showAllLikes ? 'Recent' : `View All`}
          </button>
        )}
      </div>

      {/* Like Button */}
      <div className="posts-like-button-section">
        <button 
          className={`posts-like-btn ${isUserLiked ? 'posts-liked' : ''} ${isLiking ? 'posts-liking' : ''}`}
          onClick={handleLike}
          disabled={isLiking}
        >
          <div className="posts-like-btn-content">
            <span className="posts-like-icon">
              {isLiking ? '⏳' : isUserLiked ? '❤️' : '🤍'}
            </span>
            <span className="posts-like-text">
              {isLiking ? 'Processing...' : isUserLiked ? 'Liked' : 'Like'}
            </span>
          </div>
          {isUserLiked && <div className="posts-like-particles"></div>}
        </button>
      </div>

      {/* Likes Grid */}
      <div className="posts-likes-content">
        {(showAllLikes ? paginatedLikes : localLikes) && (showAllLikes ? paginatedLikes : localLikes).length > 0 ? (
          <div className="posts-likes-grid">
            {(showAllLikes ? paginatedLikes : localLikes).map((like, index) => (
              like && like.userName ? (
                <div key={index} className="posts-like-item">
                  <a href={`/profile/${like.userName}`} className="posts-like-link">
                    <div className="posts-like-avatar-container">
                      <img 
                        className="posts-like-avatar" 
                        src={like.profilePic || "https://randomuser.me/api/portraits/men/32.jpg"} 
                        alt={like.userName}
                        loading="lazy"
                      />
                      <div className="posts-like-avatar-border"></div>
                    </div>
                    <div className="posts-like-info">
                      <span className="posts-like-username">{like.userName}</span>
                    </div>
                  </a>
                </div>
              ) : null
            ))}
          </div>
        ) : (
          <div className="posts-no-likes">
            <div className="posts-no-likes-icon">💔</div>
            <h4 className="posts-no-likes-title">No likes yet</h4>
            <p className="posts-no-likes-text">Be the first to show some love!</p>
          </div>
        )}

        {/* Load More */}
        {showAllLikes && hasMore && !loading && (
          <div className="posts-load-more-section">
            <button 
              className="posts-load-more-btn"
              onClick={loadMoreLikes}
            >
              <span className="posts-load-more-icon">➕</span>
              <span className="posts-load-more-text">Load More</span>
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="posts-likes-loading">
            <div className="posts-loading-spinner"></div>
            <span className="posts-loading-text">Loading likes...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default LikesSection;
