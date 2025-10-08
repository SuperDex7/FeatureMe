import React, { useState, useEffect } from "react";
import AudioPlayer2 from "./AudioPlayer2";
import CommentSection2 from "./CommentSection2";
import LikesSection2 from "./LikesSection";
import ViewsAnalytics from "./ViewsAnalytics";
import { deletePost, addView } from "../services/PostsService";
import { getCurrentUser } from "../services/AuthService";

function FeedItemModal({ open, onClose, id, author, description, time, title, features, genre, music, comments, likes, onAddComment, currentUser, totalViews = 0, totalComments = 0, totalDownloads = 0, freeDownload = false }) {
  const { userName, profilePic, banner } = author ?? {};
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localLikes, setLocalLikes] = useState(likes || []);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showViewsAnalytics, setShowViewsAnalytics] = useState(false);

  if (!open) return null;

  const handlePlayClick = async (e) => {
    e.stopPropagation();
    
    // Check cooldown before adding view
    const cooldownKey = `view_${id}_${currentUser?.userName}`;
    const lastViewTime = localStorage.getItem(cooldownKey);
    const now = Date.now();
    const oneMinute = 15 * 1000; // 15 seconds in milliseconds
    
    let shouldAddView = true;
    if (lastViewTime) {
      const timeSinceLastView = now - parseInt(lastViewTime);
      if (timeSinceLastView < oneMinute) {
        shouldAddView = false;
      }
    }
    
    if (shouldAddView && currentUser) {
      try {
        await addView(id);
        localStorage.setItem(cooldownKey, now.toString());
      } catch (error) {
        console.error("Error adding view:", error);
      }
    }
    
    setShowAudioPlayer(true);
  };

  const handleLikeUpdate = (updatedLikes) => {
    setLocalLikes(updatedLikes);
  };

  const handleDeletePost = async () => {
    if (!currentUser || !window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      await deletePost(id);
      onClose();
      window.location.reload();
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`posts-modal-overlay${open ? '' : ' posts-modal-closed'}`} onClick={onClose}>
      <div className={`posts-modal${open ? '' : ' posts-modal-closed'}`} onClick={e => e.stopPropagation()}>
        <button className="posts-modal-close" onClick={onClose}>&times;</button>
        
        <div className="posts-modal-hero">
          <div 
            className="posts-modal-banner" 
            style={{ backgroundImage: `url('${banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80"}')` }} 
          />
          <div className="posts-modal-gradient-overlay"></div>
          <div className="posts-modal-hero-content">
            <h1 className="posts-modal-title">{title}</h1>
            <p className="posts-modal-subtitle">by {userName}</p>
          </div>
        </div>

        <div className="posts-modal-content">
          <div className="posts-modal-header">
            <div className="posts-modal-profile">
              <img 
                className="posts-modal-avatar" 
                src={profilePic || "https://randomuser.me/api/portraits/men/32.jpg"} 
                alt="profile" 
              />
              <div className="posts-modal-profile-info">
                <h3 className="posts-modal-username">
                  <a href={`/profile/${userName}`}>{userName}</a>
                </h3>
                <span className="posts-modal-date">{new Date(time).toLocaleDateString()}</span>
              </div>
            </div>
            
            {!showAudioPlayer && (
              <button className="posts-modal-play-btn" onClick={handlePlayClick} title="Play">
                <span className="posts-play-icon">▶</span>
              </button>
            )}
          </div>

          {description && description.trim() && (
            <div className="posts-modal-description">{description}</div>
          )}

          {/* Features */}
          {features && Array.isArray(features) && features.length > 0 && (
            <div className="posts-modal-features">
              <span className="posts-modal-features-label">Featuring:</span>
              <div className="posts-modal-features-list">
                {features.map((feature, index) => (
                  <a key={index} href={`/profile/${feature}`} className="posts-modal-feature-tag">
                    {feature}
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* Genre Tags */}
          {genre && Array.isArray(genre) && genre.length > 0 && (
            <div className="posts-modal-genres">
              {genre.map((genreItem, index) => (
                <span key={index} className="posts-modal-genre-tag">{genreItem}</span>
              ))}
            </div>
          )}
          
          {showAudioPlayer && (
            <div onClick={e => e.stopPropagation()}>
              <AudioPlayer2 
                src={music} 
                onClose={() => setShowAudioPlayer(false)} 
                title={title} 
                postId={id}
                freeDownload={freeDownload}
              />
            </div>
          )}
          
          <div className="posts-modal-stats">
            <button
              className={`posts-modal-stat-btn ${!showComments ? 'posts-active' : ''}`}
              onClick={() => setShowComments(false)}
            >
              <span className="posts-stat-icon">❤️</span>
              <span className="posts-stat-count">{localLikes.length}</span>
              <span className="posts-stat-label">Likes</span>
            </button>
            
            <button
              className={`posts-modal-stat-btn ${showComments ? 'posts-active' : ''}`}
              onClick={() => setShowComments(true)}
            >
              <span className="posts-stat-icon">💬</span>
              <span className="posts-stat-count">{totalComments || 0}</span>
              <span className="posts-stat-label">Comments</span>
            </button>
            
            <div className="posts-modal-stat-btn">
              <span className="posts-stat-icon">👁️</span>
              <span className="posts-stat-count">{totalViews || 0}</span>
              <span className="posts-stat-label">Views</span>
            </div>

            {currentUser && currentUser.userName === userName && (
              currentUser.role === 'USERPLUS' ? (
                <button
                  className="posts-modal-stat-btn posts-analytics-btn"
                  onClick={() => setShowViewsAnalytics(true)}
                  title="View Analytics (Premium Feature)"
                >
                  <span className="posts-stat-icon">📊</span>
                  <span className="posts-stat-label">Analytics</span>
                </button>
              ) : (
                <button
                  className="posts-modal-stat-btn posts-analytics-btn"
                  onClick={() => alert('Get a Plus Membership to view analytics')}
                  title="View Analytics (Premium Feature)"
                >
                  <span className="posts-stat-icon">📊</span>
                  <span className="posts-stat-label">Analytics</span>
                </button>
              )
            )}
          </div>

          <div className="posts-modal-interactions">
            {!showComments ? (
              <LikesSection2
                postId={id}
                likes={localLikes}
                onLikeUpdate={handleLikeUpdate}
                showLikes={!showComments}
                setShowLikes={setShowComments}
              />
            ) : (
              <CommentSection2
                postId={id}
                comments={comments}
                onAddComment={onAddComment}
                showComments={showComments}
                setShowComments={setShowComments}
                postAuthor={author}
                totalCommentsFromPost={totalComments}
                maxHeight="350px"
                placeholder="Share your thoughts on this track..."
                theme="modern"
              />
            )}
          </div>

          <div className="posts-modal-actions">
            <a href={`/post/${id}`} className="posts-modal-action-btn posts-primary">
              View Full Post
            </a>
            <a href={`/profile/${userName}`} className="posts-modal-action-btn posts-secondary">
              View Profile
            </a>
            {currentUser && currentUser.userName === userName && (
              <button 
                className="posts-modal-action-btn posts-danger" 
                onClick={handleDeletePost}
                disabled={isDeleting}
                title="Delete post"
              >
                {isDeleting ? 'Deleting...' : '🗑️ Delete'}
              </button>
            )}
          </div>
          
          <ViewsAnalytics
            postId={id}
            postTitle={title}
            isOpen={showViewsAnalytics}
            onClose={() => setShowViewsAnalytics(false)}
            currentUser={currentUser}
            postAuthor={author}
            totalDownloads={totalDownloads}
          />
        </div>
      </div>
    </div>
  );
}

function FeedItem({ id, author, description, time, title, features, genre, music, comments = [], likes = [], totalViews = 0, totalComments = 0, freeDownload = false }) {
  const { userName, profilePic, banner, role } = author ?? {};
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [allComments, setAllComments] = useState(comments);
  const [showAddComment, setShowAddComment] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get current user on component mount
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  const openAudioPlayer = async (e) => {
    e.stopPropagation();
    
    // Check cooldown before adding view
    const cooldownKey = `view_${id}_${currentUser?.userName}`;
    const lastViewTime = localStorage.getItem(cooldownKey);
    const now = Date.now();
    const oneMinute = 15 * 1000; // 15 seconds in milliseconds
    
    let shouldAddView = true;
    if (lastViewTime) {
      const timeSinceLastView = now - parseInt(lastViewTime);
      if (timeSinceLastView < oneMinute) {
        shouldAddView = false;
      }
    }
    
    if (shouldAddView && currentUser) {
      try {
        await addView(id);
        localStorage.setItem(cooldownKey, now.toString());
      } catch (error) {
        console.error("Error adding view:", error);
      }
    }
    
    setShowAudioPlayer(true);
  };
  
  const handleAddComment = () => {
    if (commentInput.trim()) {
      setAllComments([...allComments, commentInput.trim()]);
      setCommentInput("");
    }
  };
  
  const handleModalAddComment = (newComment, isServerRefresh = false) => {
    if (isServerRefresh && Array.isArray(newComment)) {
      setAllComments(newComment);
    } else if (typeof newComment === 'object' && newComment.comment) {
      setAllComments(prev => [...(prev || []), newComment]);
    }
  };

  const handleDeletePost = async () => {
    if (!currentUser || !window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      await deletePost(id);
      window.location.reload();
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <div
        className={`posts-card ${role === 'USERPLUS' ? 'posts-premium' : ''} ${isHovered ? 'posts-hovered' : ''}`}
        onClick={() => setModalOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: "pointer" }}
      >
        {/* Card Header with Banner */}
        <div className="posts-card-header">
          <div 
            className="posts-card-banner" 
            style={{ backgroundImage: `url('${banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80"}')` }} 
          />
          <div className="posts-card-overlay"></div>
          
          {/* Play Button Overlay */}
          {!showAudioPlayer && (
            <button 
              className="posts-card-play-overlay" 
              onClick={e => { e.stopPropagation(); openAudioPlayer(e); }} 
              title="Play"
            >
              <span className="posts-card-play-icon">▶</span>
            </button>
          )}

          {/* Premium Badge */}
          {role === 'USERPLUS' && (
            <div className="posts-premium-badge">
              <span className="posts-premium-icon">✨</span>
              <span className="posts-premium-text">Premium</span>
            </div>
          )}

          {/* Time Badge */}
          <div className="posts-time-badge">
            {formatTime(time)}
          </div>
        </div>

        {/* Card Content */}
        <div className="posts-card-content">
          {/* Profile Section */}
          <div className="posts-card-profile">
            <img 
              className="posts-card-avatar" 
              src={profilePic || "https://randomuser.me/api/portraits/men/32.jpg"} 
              alt="profile" 
            />
            <div className="posts-card-profile-info">
              <h3 className="posts-card-username">{userName}</h3>
              <p className="posts-card-time">{formatTime(time)}</p>
            </div>
          </div>

          {/* Title */}
          <h2 className="posts-card-title">{title}</h2>

          {/* Description */}
          {description && description.trim() && (
            <p className="posts-card-description">{description}</p>
          )}

          {/* Features */}
          {features && features.length > 0 && (
            <div className="posts-card-features">
              <span className="posts-features-label">Feat:</span>
              <span className="posts-features-list">
                {features.slice(0, 2).map((feature, index) => (
                  <a key={index} href={`/profile/${feature}`} className="posts-feature-link">
                    {feature}
                  </a>
                ))}
                {features.length > 2 && (
                  <span className="posts-feature-more">+{features.length - 2} more</span>
                )}
              </span>
            </div>
          )}

          {/* Genre Tags */}
          {genre && Array.isArray(genre) && genre.length > 0 && (
            <div className="posts-card-genres">
              {genre.slice(0, 3).map((genreItem, index) => (
                <span key={index} className="posts-genre-tag">{genreItem}</span>
              ))}
              {genre.length > 3 && (
                <span className="posts-genre-more">+{genre.length - 3}</span>
              )}
            </div>
          )}

          {/* Audio Player */}
          {showAudioPlayer && (
            <div onClick={e => e.stopPropagation()}>
              <AudioPlayer2 
                src={music} 
                onClose={() => setShowAudioPlayer(false)} 
                title={title} 
                postId={id}
                freeDownload={freeDownload}
              />
            </div>
          )}

          {/* Stats Row */}
          <div className="posts-card-stats">
            <div className="posts-stat-item">
              <span className="posts-stat-icon">❤️</span>
              <span className="posts-stat-count">{likes.length}</span>
            </div>
            <div 
              className="posts-stat-item posts-clickable"
              onClick={e => { e.stopPropagation(); setModalOpen(true); }}
            >
              <span className="posts-stat-icon">💬</span>
              <span className="posts-stat-count">{totalComments || 0}</span>
            </div>
            <div className="posts-stat-item">
              <span className="posts-stat-icon">👁️</span>
              <span className="posts-stat-count">{totalViews || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <FeedItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        id={id}
        author={author}
        description={description}
        time={time}
        title={title}
        features={features}
        genre={genre}
        music={music}
        comments={allComments}
        likes={likes}
        onAddComment={handleModalAddComment}
        currentUser={currentUser}
        totalViews={totalViews}
        totalComments={totalComments}
        freeDownload={freeDownload}
      />
    </>
  );
}

export default FeedItem;
