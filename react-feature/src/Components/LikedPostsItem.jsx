import React, { useState, useEffect } from "react";
import AudioPlayer2 from "./AudioPlayer2";
import { getCurrentUser } from "../services/AuthService";
import "./LikedPostsItem.css";

function LikedPostsItem({ 
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

  const handleCardClick = () => {
    window.location.href = `/post/${id}`;
  };

  if (viewMode === 'list') {
    return (
      <div className="likedposts-item-list" onClick={handleCardClick}>
        <div className="likedposts-item-list-content">
          {/* Left side - Banner/Thumbnail */}
          <div className="likedposts-item-list-media">
            <div 
              className="likedposts-item-list-banner"
              style={{ 
                backgroundImage: `url('${banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80"}')` 
              }}
            />
            <button 
              className="likedposts-item-list-play-btn"
              onClick={handlePlayClick}
              title="Play"
            >
              <span>▶</span>
            </button>
          </div>

          {/* Middle - Content */}
          <div className="likedposts-item-list-info">
            <div className="likedposts-item-list-header">
              <h3 className="likedposts-item-list-title">{title}</h3>
              <span className="likedposts-item-list-date">{new Date(time).toLocaleDateString()}</span>
            </div>
            
            <div className="likedposts-item-list-author">
              <span className="likedposts-item-list-author-label">by</span>
              <span className="likedposts-item-list-author-name">{userName}</span>
            </div>

            {description && (
              <p className="likedposts-item-list-description">
                {description.length > 120 ? `${description.substring(0, 120)}...` : description}
              </p>
            )}

            {genre && genre.length > 0 && (
              <div className="likedposts-item-list-genres">
                {genre.slice(0, 3).map((genreItem, index) => (
                  <span key={index} className="likedposts-item-list-genre-tag">
                    {genreItem}
                  </span>
                ))}
                {genre.length > 3 && <span className="likedposts-item-list-genre-more">+{genre.length - 3}</span>}
              </div>
            )}

            {features && features.length > 0 && (
              <div className="likedposts-item-list-features">
                <span className="likedposts-item-list-feat-label">Feat:</span>
                <span className="likedposts-item-list-feat-list">
                  {features.slice(0, 2).join(", ")}
                  {features.length > 2 && ` +${features.length - 2} more`}
                </span>
              </div>
            )}
          </div>

          {/* Right side - Stats and Actions */}
          <div className="likedposts-item-list-actions">
            <div className="likedposts-item-list-stats">
              <div className="likedposts-item-list-stat">
                <span className="likedposts-item-list-stat-icon">❤️</span>
                <span className="likedposts-item-list-stat-count">{likes.length}</span>
              </div>
              <div className="likedposts-item-list-stat">
                <span className="likedposts-item-list-stat-icon">💬</span>
                <span className="likedposts-item-list-stat-count">{totalComments}</span>
              </div>
              <div className="likedposts-item-list-stat">
                <span className="likedposts-item-list-stat-icon">👁️</span>
                <span className="likedposts-item-list-stat-count">{totalViews}</span>
              </div>
            </div>

            <div className="likedposts-item-list-buttons">
              <button 
                className="likedposts-item-list-btn primary"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/post/${id}`;
                }}
              >
                View Post
              </button>
              <button 
                className="likedposts-item-list-btn secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/profile/${userName}`;
                }}
              >
                View Profile
              </button>
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
    <div className="likedposts-item-grid" onClick={handleCardClick}>
      <div className="likedposts-item-grid-content">
        {/* Banner */}
        <div 
          className="likedposts-item-grid-banner"
          style={{ 
            backgroundImage: `url('${banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80"}')` 
          }}
        >
          <button 
            className="likedposts-item-grid-play-btn"
            onClick={handlePlayClick}
            title="Play"
          >
            <span>▶</span>
          </button>
          
          {/* Overlay gradient */}
          <div className="likedposts-item-grid-overlay"></div>

          {/* Liked indicator */}
          <div className="likedposts-item-grid-liked-badge">
            <span className="likedposts-liked-icon">❤️</span>
          </div>
        </div>

        {/* Content */}
        <div className="likedposts-item-grid-info">
          <div className="likedposts-item-grid-header">
            <h3 className="likedposts-item-grid-title">{title}</h3>
            <span className="likedposts-item-grid-date">{new Date(time).toLocaleDateString()}</span>
          </div>

          <div className="likedposts-item-grid-author">
            <span className="likedposts-item-grid-author-label">by</span>
            <span className="likedposts-item-grid-author-name">{userName}</span>
          </div>

          {description && (
            <p className="likedposts-item-grid-description">
              {description.length > 100 ? `${description.substring(0, 100)}...` : description}
            </p>
          )}

          {genre && genre.length > 0 && (
            <div className="likedposts-item-grid-genres">
              {genre.slice(0, 2).map((genreItem, index) => (
                <span key={index} className="likedposts-item-grid-genre-tag">
                  {genreItem}
                </span>
              ))}
              {genre.length > 2 && <span className="likedposts-item-grid-genre-more">+{genre.length - 2}</span>}
            </div>
          )}

          <div className="likedposts-item-grid-stats">
            <div className="likedposts-item-grid-stat">
              <span className="likedposts-item-grid-stat-icon">❤️</span>
              <span className="likedposts-item-grid-stat-count">{likes.length}</span>
            </div>
            <div className="likedposts-item-grid-stat">
              <span className="likedposts-item-grid-stat-icon">💬</span>
              <span className="likedposts-item-grid-stat-count">{totalComments}</span>
            </div>
            <div className="likedposts-item-grid-stat">
              <span className="likedposts-item-grid-stat-icon">👁️</span>
              <span className="likedposts-item-grid-stat-count">{totalViews}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="likedposts-item-grid-actions">
          <button 
            className="likedposts-item-grid-btn primary"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/post/${id}`;
            }}
          >
            View Post
          </button>
          <button 
            className="likedposts-item-grid-btn secondary"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/profile/${userName}`;
            }}
          >
            View Profile
          </button>
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

export default LikedPostsItem;
