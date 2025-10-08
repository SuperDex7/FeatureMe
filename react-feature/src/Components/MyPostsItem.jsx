import React, { useState, useEffect } from "react";
import AudioPlayer2 from "./AudioPlayer2";
import { deletePost } from "../services/PostsService";
import { getCurrentUser } from "../services/AuthService";
import "./MyPostsItem.css";

function MyPosts2Item({ 
  id, 
  title, 
  description, 
  author, 
  time, 
  features, 
  genre, 
  music, 
  likes = [], 
  totalViews = 0, 
  totalComments = 0, 
  totalDownloads = 0,
  freeDownload = false,
  viewMode = 'grid',
  currentUser 
}) {
  const { userName, profilePic, banner } = author ?? {};
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [currentUserState, setCurrentUserState] = useState(currentUser);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!currentUserState) {
      const fetchUser = async () => {
        try {
          const user = await getCurrentUser();
          setCurrentUserState(user);
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      };
      fetchUser();
    }
  }, [currentUserState]);

  const handlePlayClick = (e) => {
    e.stopPropagation();
    setShowAudioPlayer(true);
  };

  const handleDeletePost = async () => {
    if (!currentUserState || !window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      await deletePost(id);
      // Reload page to update the posts list
      window.location.reload();
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCardClick = () => {
    window.location.href = `/post/${id}`;
  };

  const isOwnPost = currentUserState && currentUserState.userName === userName;

  if (viewMode === 'list') {
    return (
      <div className="myposts-item-list" onClick={handleCardClick}>
        <div className="myposts-item-list-content">
          {/* Left side - Banner/Thumbnail */}
          <div className="myposts-item-list-media">
            <div 
              className="myposts-item-list-banner"
              style={{ 
                backgroundImage: `url('${banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80"}')` 
              }}
            />
            <button 
              className="myposts-item-list-play-btn"
              onClick={handlePlayClick}
              title="Play"
            >
              <span>▶</span>
            </button>
          </div>

          {/* Middle - Content */}
          <div className="myposts-item-list-info">
            <div className="myposts-item-list-header">
              <h3 className="myposts-item-list-title">{title}</h3>
              <span className="myposts-item-list-date">{new Date(time).toLocaleDateString()}</span>
            </div>
            
            {description && (
              <p className="myposts-item-list-description">
                {description.length > 120 ? `${description.substring(0, 120)}...` : description}
              </p>
            )}

            {genre && genre.length > 0 && (
              <div className="myposts-item-list-genres">
                {genre.slice(0, 3).map((genreItem, index) => (
                  <span key={index} className="myposts-item-list-genre-tag">
                    {genreItem}
                  </span>
                ))}
                {genre.length > 3 && <span className="myposts-item-list-genre-more">+{genre.length - 3}</span>}
              </div>
            )}

            {features && features.length > 0 && (
              <div className="myposts-item-list-features">
                <span className="myposts-item-list-feat-label">Feat:</span>
                <span className="myposts-item-list-feat-list">
                  {features.slice(0, 2).join(", ")}
                  {features.length > 2 && ` +${features.length - 2} more`}
                </span>
              </div>
            )}
          </div>

          {/* Right side - Stats and Actions */}
          <div className="myposts-item-list-actions">
            <div className="myposts-item-list-stats">
              <div className="myposts-item-list-stat">
                <span className="myposts-item-list-stat-icon">❤️</span>
                <span className="myposts-item-list-stat-count">{likes.length}</span>
              </div>
              <div className="myposts-item-list-stat">
                <span className="myposts-item-list-stat-icon">💬</span>
                <span className="myposts-item-list-stat-count">{totalComments}</span>
              </div>
              <div className="myposts-item-list-stat">
                <span className="myposts-item-list-stat-icon">👁️</span>
                <span className="myposts-item-list-stat-count">{totalViews}</span>
              </div>
            </div>

            <div className="myposts-item-list-buttons">
              <button 
                className="myposts-item-list-btn primary"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/post/${id}`;
                }}
              >
                View
              </button>
              {isOwnPost && (
                <button 
                  className="myposts-item-list-btn danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePost();
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? '...' : '🗑️'}
                </button>
              )}
            </div>
          </div>
        </div>

        {showAudioPlayer && (
          <div onClick={(e) => e.stopPropagation()}>
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
    );
  }

  // Grid view (default)
  return (
    <div className="myposts-item-grid" onClick={handleCardClick}>
      <div className="myposts-item-grid-content">
        {/* Banner */}
        <div 
          className="myposts-item-grid-banner"
          style={{ 
            backgroundImage: `url('${banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80"}')` 
          }}
        >
          <button 
            className="myposts-item-grid-play-btn"
            onClick={handlePlayClick}
            title="Play"
          >
            <span>▶</span>
          </button>
          
          {/* Overlay gradient */}
          <div className="myposts-item-grid-overlay"></div>
        </div>

        {/* Content */}
        <div className="myposts-item-grid-info">
          <div className="myposts-item-grid-header">
            <h3 className="myposts-item-grid-title">{title}</h3>
            <span className="myposts-item-grid-date">{new Date(time).toLocaleDateString()}</span>
          </div>

          {description && (
            <p className="myposts-item-grid-description">
              {description.length > 100 ? `${description.substring(0, 100)}...` : description}
            </p>
          )}

          {genre && genre.length > 0 && (
            <div className="myposts-item-grid-genres">
              {genre.slice(0, 2).map((genreItem, index) => (
                <span key={index} className="myposts-item-grid-genre-tag">
                  {genreItem}
                </span>
              ))}
              {genre.length > 2 && <span className="myposts-item-grid-genre-more">+{genre.length - 2}</span>}
            </div>
          )}

          <div className="myposts-item-grid-stats">
            <div className="myposts-item-grid-stat">
              <span className="myposts-item-grid-stat-icon">❤️</span>
              <span className="myposts-item-grid-stat-count">{likes.length}</span>
            </div>
            <div className="myposts-item-grid-stat">
              <span className="myposts-item-grid-stat-icon">💬</span>
              <span className="myposts-item-grid-stat-count">{totalComments}</span>
            </div>
            <div className="myposts-item-grid-stat">
              <span className="myposts-item-grid-stat-icon">👁️</span>
              <span className="myposts-item-grid-stat-count">{totalViews}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="myposts-item-grid-actions">
          <button 
            className="myposts-item-grid-btn primary"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/post/${id}`;
            }}
          >
            View Post
          </button>
          {isOwnPost && (
            <button 
              className="myposts-item-grid-btn danger"
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePost();
              }}
              disabled={isDeleting}
              title="Delete post"
            >
              {isDeleting ? 'Deleting...' : '🗑️'}
            </button>
          )}
        </div>
      </div>

      {showAudioPlayer && (
        <div onClick={(e) => e.stopPropagation()}>
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
  );
}

export default MyPosts2Item;
