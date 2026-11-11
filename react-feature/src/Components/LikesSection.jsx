import { useState, useEffect } from "react";
import api, { getCurrentUser } from "../services/AuthService";
import Icon from "./ui/Icon";
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

  const shownLikes = (showAllLikes ? paginatedLikes : localLikes) || [];
  const likeCount = totalLikes || localLikes.length;

  return (
    <div className="fm-likes">
      <div className="fm-likes__head">
        <button
          type="button"
          className={`fm-btn ${isUserLiked ? "fm-btn--primary" : "fm-btn--secondary"} fm-likes__like`}
          onClick={handleLike}
          disabled={isLiking || !currentUser}
          aria-pressed={isUserLiked}
        >
          <Icon name="heart" size={18} fill={isUserLiked ? "currentColor" : "none"} />
          {isLiking ? "Saving..." : isUserLiked ? "Liked" : "Like"}
        </button>
        <span className="fm-likes__count">
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </span>
        {totalLikes > (localLikes?.length || 0) && (
          <button type="button" className="fm-likes__toggle" onClick={toggleShowAllLikes}>
            {showAllLikes ? "Show recent" : "View all"}
          </button>
        )}
      </div>

      {shownLikes.length > 0 ? (
        <ul className="fm-likes__list">
          {shownLikes.map((like, index) => (
            like && like.userName ? (
              <li key={`${like.userName}-${index}`}>
                <a href={`/profile/${like.userName}`} className="fm-likes__person">
                  <img src={like.profilePic || "/dpp.jpg"} alt="" loading="lazy" />
                  <span>{like.userName}</span>
                </a>
              </li>
            ) : null
          ))}
        </ul>
      ) : (
        !loading && <p className="fm-likes__empty">No likes yet. Be the first to show some love.</p>
      )}

      {showAllLikes && hasMore && !loading && (
        <button type="button" className="fm-btn fm-btn--secondary fm-likes__more" onClick={loadMoreLikes}>
          Load more
        </button>
      )}

      {loading && (
        <div className="fm-likes__loading" role="status">
          <span className="fm-spinner" aria-hidden="true" />
          Loading likes...
        </div>
      )}
    </div>
  );
}

export default LikesSection;
