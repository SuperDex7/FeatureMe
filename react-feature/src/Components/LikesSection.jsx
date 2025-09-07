import React, { useState, useEffect } from "react";
import api, { getCurrentUser } from "../services/AuthService";
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
  const [currentUser, setCurrentUser] = useState(null);
  const [paginatedLikes, setPaginatedLikes] = useState([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showAllLikes, setShowAllLikes] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    fetchUser();
    
    // Get total likes count
    fetchLikesSummary();
  }, [postId]);

  // Fetch likes summary to get total count
  const fetchLikesSummary = async () => {
    try {
      const response = await api.get(`/posts/likes/${postId}/summary`);
      setTotalLikes(response.data.totalLikes || 0);
    } catch (error) {
      console.error('Error fetching likes summary:', error);
      setTotalLikes(localLikes?.length || 0);
    }
  };

  // Load paginated likes
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

  // Load more likes
  const loadMoreLikes = () => {
    loadPaginatedLikes(currentPage + 1, true);
  };

  // Toggle between showing recent likes and all likes
  const toggleShowAllLikes = () => {
    if (!showAllLikes) {
      loadPaginatedLikes(0, false);
    }
    setShowAllLikes(!showAllLikes);
  };

  const handleLike = (e) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    // Optimistically update UI
    const isLiked = localLikes.some(like => like.userName === currentUser.userName);
    let updatedLikes;
    
    if (isLiked) {
      // Unlike - remove user from likes
      updatedLikes = localLikes.filter(like => like.userName !== currentUser.userName);
    } else {
      // Like - add user to likes
      const newLike = {
        userName: currentUser.userName,
        profilePic: currentUser.profilePic
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
    api.post(`/posts/add/like/${postId}`)
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
        
        // Refresh pagination data
        fetchLikesSummary();
        if (showAllLikes) {
          loadPaginatedLikes(0, false);
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

  const isUserLiked = currentUser ? localLikes.some(like => like.userName === currentUser.userName) : false;

  return (
    <div className="likes-section-container">
      <div className="likes-section-header">
        <h3 className="likes-section-title">Likes</h3>
        <div className="likes-header-controls">
          <span className="likes-count">{totalLikes || localLikes.length}</span>
          {totalLikes > (localLikes?.length || 0) && (
            <button 
              className="view-all-likes-btn"
              onClick={toggleShowAllLikes}
            >
              {showAllLikes ? 'Show Recent' : `View All ${totalLikes}`}
            </button>
          )}
        </div>
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
          {(showAllLikes ? paginatedLikes : localLikes) && (showAllLikes ? paginatedLikes : localLikes).length > 0 ? (
            (showAllLikes ? paginatedLikes : localLikes).map((like, index) => (
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
          
          {/* Load More Button for Pagination */}
          {showAllLikes && hasMore && !loading && (
            <div className="load-more-likes">
              <button 
                className="load-more-btn"
                onClick={loadMoreLikes}
              >
                Load More Likes
              </button>
            </div>
          )}
          
          {loading && (
            <div className="likes-loading">
              <span>Loading likes...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LikesSection;
