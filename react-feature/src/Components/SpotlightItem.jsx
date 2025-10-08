import React, { useState, useEffect } from "react";
import AudioPlayer2 from "./AudioPlayer2";
import CommentSection2 from "./CommentSection2";
import LikesSection2 from "./LikesSection";
import ViewsAnalytics from "./ViewsAnalytics";
import { deletePost, addView } from "../services/PostsService";
import { getCurrentUser } from "../services/AuthService";
import "./Spotlight.css";

function SpotlightItemModal({ open, onClose, id, author, description, time, title, features, genre, music, comments, likes, onAddComment, currentUser, totalViews = 0, totalComments = 0, totalDownloads = 0, freeDownload = false }) {
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
    <div className="spotlight-modal-overlay" onClick={onClose}>
      <div className="spotlight-modal" onClick={e => e.stopPropagation()}>
        <button className="spotlight-modal-close" onClick={onClose}>&times;</button>
        
        {/* Premium Modal Header */}
        <div className="spotlight-modal-header">
          <div className="spotlight-modal-banner" style={{ backgroundImage: `url('${banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80"}')` }} />
          <div className="spotlight-modal-overlay-gradient"></div>
        </div>
        
        <div className="spotlight-modal-content">
          {/* Premium Profile Section */}
          <div className="spotlight-modal-profile-section">
            <div className="spotlight-modal-profile">
              <img className="spotlight-modal-profile-pic" src={profilePic || "https://randomuser.me/api/portraits/men/32.jpg"} alt="profile" />
              <div className="spotlight-modal-profile-info">
                <span className="spotlight-modal-author">
                  <a href={`/profile/${userName}`}>{userName}</a>
                </span>
                <span className="spotlight-modal-time">{new Date(time).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="spotlight-modal-premium-badge">
              <span className="spotlight-premium-icon">⭐</span>
              <span>Plus Creator</span>
            </div>
          </div>
          
          {/* Features */}
          {features && Array.isArray(features) && features.length > 0 && (
            <div className="spotlight-modal-features">
              <span className="spotlight-modal-feat-label">Featuring:</span>
              <div className="spotlight-modal-feat-list">
                {features.map((feature, index) => (
                  <span key={index} className="spotlight-modal-feat-item">
                    <a href={`/profile/${feature}`}>{feature}</a>
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Title and Play Button */}
          <div className="spotlight-modal-title-section">
            <h2 className="spotlight-modal-title">{title}</h2>
            {!showAudioPlayer && (
              <button className="spotlight-modal-play-btn" onClick={handlePlayClick} title="Play">
                <span className="spotlight-play-icon">&#9654;</span>
                <span className="spotlight-play-text">Play</span>
              </button>
            )}
          </div>
          
          {/* Description */}
          <div className="spotlight-modal-description">{description}</div>
          
          {/* Genre Tags */}
          {genre && Array.isArray(genre) && genre.length > 0 && (
            <div className="spotlight-modal-genres">
              {genre.map((genreItem, index) => (
                <span key={index} className="spotlight-modal-genre-tag">{genreItem}</span>
              ))}
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
          
          {/* Stats Section */}
          <div className="spotlight-modal-stats">
            <div className="spotlight-modal-stat-item">
              <span className="spotlight-modal-stat-icon">❤️</span>
              <span className="spotlight-modal-stat-value">{localLikes.length}</span>
              <span className="spotlight-modal-stat-label">Likes</span>
            </div>
            <div className="spotlight-modal-stat-item">
              <span className="spotlight-modal-stat-icon">💬</span>
              <span className="spotlight-modal-stat-value">{totalComments || 0}</span>
              <span className="spotlight-modal-stat-label">Comments</span>
            </div>
            <div className="spotlight-modal-stat-item">
              <span className="spotlight-modal-stat-icon">👁️</span>
              <span className="spotlight-modal-stat-value">{totalViews || 0}</span>
              <span className="spotlight-modal-stat-label">Views</span>
            </div>
            {currentUser && currentUser.userName === userName && (
              <div className="spotlight-modal-stat-item spotlight-analytics-item">
                <span 
                  className="spotlight-modal-stat-icon"
                  onClick={() => setShowViewsAnalytics(true)}
                  style={{ cursor: 'pointer' }}
                  title="View Analytics"
                >
                  📊
                </span>
                <span className="spotlight-modal-stat-label">Analytics</span>
              </div>
            )}
          </div>
          
          {/* Interaction Section */}
          <div className="spotlight-modal-interactions">
            <div className="spotlight-modal-interaction-tabs">
              <button 
                className={`spotlight-modal-tab ${!showComments ? 'active' : ''}`}
                onClick={() => setShowComments(false)}
              >
                <span>❤️</span>
                <span>Likes ({localLikes.length})</span>
              </button>
              <button 
                className={`spotlight-modal-tab ${showComments ? 'active' : ''}`}
                onClick={() => setShowComments(true)}
              >
                <span>💬</span>
                <span>Comments ({totalComments || 0})</span>
              </button>
            </div>
            
            <div className="spotlight-modal-interaction-content">
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
          </div>
          
          {/* Action Buttons */}
          <div className="spotlight-modal-actions">
            <a href={`/post/${id}`} className="spotlight-modal-action-btn spotlight-primary-btn">
              <span>🔗</span>
              <span>Go To Post</span>
            </a>
            <a href={`/profile/${userName}`} className="spotlight-modal-action-btn spotlight-secondary-btn">
              <span>👤</span>
              <span>View Profile</span>
            </a>
            {currentUser && currentUser.userName === userName && (
              <button 
                className="spotlight-modal-action-btn spotlight-danger-btn" 
                onClick={handleDeletePost}
                disabled={isDeleting}
                title="Delete post"
              >
                <span>{isDeleting ? '⏳' : '🗑️'}</span>
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
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

function SpotlightItem({ id, author, description, time, title, features, genre, music, comments = [], likes = [], totalViews = 0, totalComments = 0, freeDownload = false, viewMode = 'grid' }) {
  const { userName, profilePic, banner } = author ?? {};
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [allComments, setAllComments] = useState(comments);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  const openAudioPlayer = async (e) => {
    e.stopPropagation();
    
    const cooldownKey = `view_${id}_${currentUser?.userName}`;
    const lastViewTime = localStorage.getItem(cooldownKey);
    const now = Date.now();
    const oneMinute = 15 * 1000;
    
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

  const handleModalAddComment = (comment, isServerRefresh = false) => {
    if (isServerRefresh && Array.isArray(comment)) {
      setAllComments(comment);
    } else if (typeof comment === 'object' && comment.comment) {
      setAllComments(prev => [...(prev || []), comment]);
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

  if (viewMode === 'list') {
    return (
      <>
        <div className="spotlight-list-item" onClick={() => setModalOpen(true)}>
          <div className="spotlight-list-banner" style={{ backgroundImage: `url('${banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80"}')` }} />
          <div className="spotlight-list-content">
            <div className="spotlight-list-header">
              <div className="spotlight-list-profile">
                <img className="spotlight-list-profile-pic" src={profilePic || "https://randomuser.me/api/portraits/men/32.jpg"} alt="profile" />
                <div className="spotlight-list-profile-info">
                  <span className="spotlight-list-author">{userName}</span>
                  <span className="spotlight-list-time">{new Date(time).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="spotlight-list-premium-badge">
                <span>⭐ Plus</span>
              </div>
            </div>
            
            <div className="spotlight-list-main">
              <div className="spotlight-list-title-section">
                <h3 className="spotlight-list-title">{title}</h3>
                {!showAudioPlayer && (
                  <button className="spotlight-list-play-btn" onClick={e => { e.stopPropagation(); openAudioPlayer(e); }}>
                    <span>▶️</span>
                  </button>
                )}
              </div>
              
              {description && (
                <p className="spotlight-list-description">{description}</p>
              )}
              
              {genre && Array.isArray(genre) && genre.length > 0 && (
                <div className="spotlight-list-genres">
                  {genre.map((genreItem, index) => (
                    <span key={index} className="spotlight-list-genre-tag">{genreItem}</span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="spotlight-list-stats">
              <span className="spotlight-list-stat">❤️ {likes.length}</span>
              <span className="spotlight-list-stat">💬 {totalComments || 0}</span>
              <span className="spotlight-list-stat">👁️ {totalViews || 0}</span>
            </div>
          </div>
          
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
        </div>
        
        <SpotlightItemModal
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

  // Grid view (default)
  return (
    <>
      <div className="spotlight-card" onClick={() => setModalOpen(true)}>
        <div className="spotlight-card-header">
          <div className="spotlight-card-banner" style={{ backgroundImage: `url('${banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80"}')` }} />
          <div className="spotlight-card-overlay"></div>
          <div className="spotlight-card-premium-badge">
            <span className="spotlight-premium-icon">⭐</span>
            <span>Plus</span>
          </div>
          {!showAudioPlayer && (
            <button className="spotlight-card-play-btn" onClick={e => { e.stopPropagation(); openAudioPlayer(e); }}>
              <span className="spotlight-card-play-icon">▶️</span>
            </button>
          )}
        </div>
        
        <div className="spotlight-card-content">
          <div className="spotlight-card-profile">
            <img className="spotlight-card-profile-pic" src={profilePic || "https://randomuser.me/api/portraits/men/32.jpg"} alt="profile" />
            <div className="spotlight-card-profile-info">
              <span className="spotlight-card-author">{userName}</span>
              <span className="spotlight-card-time">{new Date(time).toLocaleDateString()}</span>
            </div>
          </div>
          
          <h3 className="spotlight-card-title">{title}</h3>
          
          {description && (
            <p className="spotlight-card-description">{description}</p>
          )}
          
          {features && features.length > 0 && (
            <div className="spotlight-card-features">
              <span className="spotlight-card-feat-label">Feat:</span>
              <span className="spotlight-card-feat-list">{features.join(", ")}</span>
            </div>
          )}
          
          {genre && Array.isArray(genre) && genre.length > 0 && (
            <div className="spotlight-card-genres">
              {genre.map((genreItem, index) => (
                <span key={index} className="spotlight-card-genre-tag">{genreItem}</span>
              ))}
            </div>
          )}
          
          <div className="spotlight-card-stats">
            <div className="spotlight-card-stat">
              <span className="spotlight-card-stat-icon">❤️</span>
              <span className="spotlight-card-stat-value">{likes.length}</span>
            </div>
            <div className="spotlight-card-stat">
              <span className="spotlight-card-stat-icon">💬</span>
              <span className="spotlight-card-stat-value">{totalComments || 0}</span>
            </div>
            <div className="spotlight-card-stat">
              <span className="spotlight-card-stat-icon">👁️</span>
              <span className="spotlight-card-stat-value">{totalViews || 0}</span>
            </div>
          </div>
        </div>
        
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
      </div>
      
      <SpotlightItemModal
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

export default SpotlightItem;
