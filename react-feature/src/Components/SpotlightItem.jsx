import React, { useState } from "react";
import AudioPlayer from "./AudioPlayer";

function SpotlightItemModal({ open, onClose, author, description, time, title, features, genre, music, comments, likes, onAddComment }) {
  const { userName, profilePic, banner } = author ?? {};
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [showComments, setShowComments] = useState(false);
  const safeComments = Array.isArray(comments) ? comments : [];
  const safeLikes = Array.isArray(likes) ? likes : [];

  if (!open) return null;
  
  const handleAddComment = () => {
    if (commentInput.trim()) {
      onAddComment(commentInput.trim());
      setCommentInput("");
    }
  };

  return (
    <div className={`spotlight-modal-overlay${open ? '' : ' modal-closed'}`} onClick={onClose}>
      <div className={`spotlight-modal${open ? '' : ' modal-closed'}`} onClick={e => e.stopPropagation()}>
        <button className="spotlight-modal-close" onClick={onClose}>&times;</button>
        <div className="spotlight-modal-banner" style={{ backgroundImage: `url('${banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80"}')` }} />
        <div className="spotlight-modal-content">
          <div className="spotlight-modal-header-row">
            <div className="spotlight-modal-profile">
              <img className="spotlight-modal-profile-pic" src={profilePic || "https://randomuser.me/api/portraits/men/32.jpg"} alt="profile" />
              <span className="spotlight-modal-author"><a href={`/profile/${userName}`}>{userName}</a></span>
            </div>
            <span className="spotlight-modal-time">{new Date(time).toLocaleDateString()}</span>
          </div>
          
          {/* Features */}
          {features && Array.isArray(features) && features.length > 1 && (
                <div className="feed-card-features">
                  <span className="feed-card-feat-label">Feat:</span>
                  <span className="feed-card-feat-list">
                {features.map((feature, index) => (
                  <span key={index}>
                    <a href={`/profile/${feature}`}>{feature}</a>
                    {index < features.length - 1 && ", "}
                  </span>
                ))}
              </span>
            </div>
          )}
          
          <div className="spotlight-modal-title-row">
            <h2 className="spotlight-modal-title">{title}</h2>
            <button className="spotlight-modal-play-btn" onClick={e => { e.stopPropagation(); setShowAudioPlayer(true); }} title="Play">
              <span>&#9654;</span>
            </button>
          </div>
          
          <div className="spotlight-modal-desc">{description}</div>
          
          {/* Genre Tags */}
          {genre && Array.isArray(genre) && genre.length > 0 && (
            <div className="spotlight-modal-genres">
              {genre.map((genreItem, index) => (
                <span key={index} className="spotlight-modal-genre-tag">{genreItem}</span>
              ))}
            </div>
          )}
          
          <div className="spotlight-modal-stats-row" style={{ justifyContent: 'flex-end', gap: '1.2rem' }}>
            <span
              className={`spotlight-modal-likes${!showComments ? ' active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setShowComments(false)}
            >❤️ {safeLikes.length}</span>
            <span
              className={`spotlight-modal-comments${showComments ? ' active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setShowComments(true)}
            >💬 {safeComments.length}</span>
          </div>
          
          {!showComments ? (
            <div className="spotlight-modal-likes-section">
              <div className="spotlight-modal-comments-title">Likes</div>
              <ul className="spotlight-modal-likes-list">
                {safeLikes.length === 0 ? (
                  <li style={{ color: '#aaa' }}>No likes yet.</li>
                ) : (
                  safeLikes.map((like, idx) => (
                    <li key={idx} className="spotlight-modal-like-user">
                      <img
                        src={like.profilePic || "https://randomuser.me/api/portraits/men/32.jpg"}
                        alt="profile"
                        className="spotlight-modal-like-profile-pic"
                      />
                      <span className="spotlight-modal-like-username">{like.userName || 'User'}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : (
            <div className="spotlight-modal-comments-section">
              <div className="spotlight-modal-comments-title">Comments</div>
              <ul className="spotlight-modal-comments-list">
                {safeComments.length === 0 ? (
                  <li style={{ color: '#aaa' }}>No comments yet.</li>
                ) : (
                  safeComments.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))
                )}
              </ul>
              <div className="spotlight-modal-add-comment-row">
                <input
                  className="spotlight-modal-add-comment-input"
                  type="text"
                  placeholder="Add a comment..."
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddComment(); }}
                />
                <button className="spotlight-modal-add-comment-btn" onClick={handleAddComment}>Post</button>
              </div>
            </div>
          )}
          
          <div className="spotlight-modal-actions-row">
            <button className="spotlight-modal-action-btn">Contact Creator</button>
            <a href={`/profile/${userName}`}><button className="feed-card-action-btn">View Profile</button></a>
          </div>
          
          {showAudioPlayer && (
            <div onClick={e => e.stopPropagation()}>
              <AudioPlayer src={music} onClose={() => setShowAudioPlayer(false)} title={title} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SpotlightItem({ author, description, time, title, features, genre, music, comments = [], likes = [] }) {
  const { userName, profilePic, banner } = author ?? {};
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [allComments, setAllComments] = useState(comments);

  const openAudioPlayer = (e) => {
    e.stopPropagation();
    setShowAudioPlayer(true);
  };

  const handleAddComment = () => {
    if (commentInput.trim()) {
      setAllComments([...allComments, commentInput.trim()]);
      setCommentInput("");
    }
  };

  const handleModalAddComment = (comment) => {
    setAllComments([...allComments, comment]);
  };

  return (
    <>
      <div
        className="spotlight-card-glass"
        onClick={() => setModalOpen(true)}
        style={{ cursor: "pointer" }}
      >
        <div className="spotlight-card-banner" style={{ backgroundImage: `url('${banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80"}')` }} />
        <div className="spotlight-card-content">
          <div className="spotlight-card-header-row">
            <div className="spotlight-card-profile">
              <img className="spotlight-card-profile-pic" src={profilePic || "https://randomuser.me/api/portraits/men/32.jpg"} alt="profile" />
              <span className="spotlight-card-author">{userName}</span>
            </div>
            <span className="spotlight-card-time">{new Date(time).toLocaleDateString()}</span>
          </div>
          
          {features && features.length > 1 && (
            <div className="spotlight-card-features">
              <span className="spotlight-card-feat-label">Feat:</span>
              <span className="spotlight-card-feat-list">{features.join(", ")}</span>
            </div>
          )}
          
          <div className="spotlight-card-title-row">
            <h2 className="spotlight-card-title">{title}</h2>
            <button className="spotlight-card-play-btn" onClick={e => { e.stopPropagation(); openAudioPlayer(e); }} title="Play">
              <span>&#9654;</span>
            </button>
          </div>
          
          <div className="spotlight-card-desc">{description}</div>
          
          {/* Genre Tags */}
          {genre && Array.isArray(genre) && genre.length > 0 && (
            <div className="spotlight-card-genres">
              {genre.map((genreItem, index) => (
                <span key={index} className="spotlight-card-genre-tag">{genreItem}</span>
              ))}
            </div>
          )}
          
          <div className="spotlight-card-stats-row">
            <span className="spotlight-card-likes">❤️ {likes.length}</span>
            <span className="spotlight-card-comments" onClick={e => { e.stopPropagation(); setModalOpen(true); }} style={{ cursor: "pointer" }}>💬 {allComments == null ? 0 : allComments.length}</span>
          </div>
          
          {showAudioPlayer && (
            <div onClick={e => e.stopPropagation()}>
              <AudioPlayer src={music} onClose={() => setShowAudioPlayer(false)} title={title} />
            </div>
          )}
        </div>
      </div>
      
      <SpotlightItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
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
      />
    </>
  );
}

export default SpotlightItem;
