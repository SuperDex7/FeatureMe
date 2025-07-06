import React, { useState } from "react";
import AudioPlayer from "./AudioPlayer";

function FeedItemModal({ open, onClose, author, description, time, title, features, genre, music, comments, likes, onAddComment }) {
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
    <div className={`feed-card-modal-overlay${open ? '' : ' modal-closed'}`} onClick={onClose}>
      <div className={`feed-card-modal${open ? '' : ' modal-closed'}`} onClick={e => e.stopPropagation()}>
        <button className="feed-card-modal-close" onClick={onClose}>&times;</button>
        <div className="feed-card-banner" style={{ backgroundImage: `url('${banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80"}')` }} />
        <div className="feed-card-content">
          <div className="feed-card-header-row">
            <div className="feed-card-profile">
              <img className="feed-card-profile-pic" src={profilePic || "https://randomuser.me/api/portraits/men/32.jpg"} alt="profile" />
              <span className="feed-card-author">{userName}</span>
            </div>
            <span className="feed-card-time">{new Date(time).toLocaleDateString()}</span>
          </div>
          {features && features.length > 1 && (
            <div className="feed-card-features">
              <span className="feed-card-feat-label">Feat:</span>
              <span className="feed-card-feat-list">{features.join(", ")}</span>
            </div>
          )}
          <div className="feed-card-title-row">
            <h2 className="feed-card-title">{title}</h2>
            <button className="feed-card-play-btn" onClick={e => { e.stopPropagation(); setShowAudioPlayer(true); }} title="Play">
              <span>&#9654;</span>
            </button>
          </div>
          <div className="feed-card-desc">{description}</div>
          
          {/* Genre Tags */}
          {genre && Array.isArray(genre) && genre.length > 0 && (
            <div className="feed-card-genres">
              {genre.map((genreItem, index) => (
                <span key={index} className="feed-card-genre-tag">{genreItem}</span>
              ))}
            </div>
          )}
          
          <div className="feed-card-stats-row" style={{ justifyContent: 'flex-end', gap: '1.2rem' }}>
            <span
              className={`feed-card-likes${!showComments ? ' active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setShowComments(false)}
            >❤️ {safeLikes.length}</span>
            <span
              className={`feed-card-comments${showComments ? ' active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setShowComments(true)}
            >💬 {safeComments.length}</span>
          </div>
          {!showComments ? (
            <div className="feed-card-likes-section">
              <div className="feed-card-comments-title">Likes</div>
              <ul className="feed-card-likes-list">
                {safeLikes.length === 0 ? (
                  <li style={{ color: '#aaa' }}>No likes yet.</li>
                ) : (
                  safeLikes.map((like, idx) => (
                    <li key={idx} className="feed-card-like-user">
                      <img
                        src={like.profilePic || "https://randomuser.me/api/portraits/men/32.jpg"}
                        alt="profile"
                        className="feed-card-like-profile-pic"
                      />
                      <span className="feed-card-like-username">{like.userName || 'User'}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : (
            <div className="feed-card-comments-section">
              <div className="feed-card-comments-title">Comments</div>
              <ul className="feed-card-comments-list">
                {safeComments.length === 0 ? (
                  <li style={{ color: '#aaa' }}>No comments yet.</li>
                ) : (
                  safeComments.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))
                )}
              </ul>
              <div className="feed-card-add-comment-row">
                <input
                  className="feed-card-add-comment-input"
                  type="text"
                  placeholder="Add a comment..."
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddComment(); }}
                />
                <button className="feed-card-add-comment-btn" onClick={handleAddComment}>Post</button>
              </div>
            </div>
          )}
          <div className="feed-card-actions-row">
            <button className="feed-card-action-btn">Contact Creator</button>
            <button className="feed-card-action-btn">View Profile</button>
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

function FeedItem({ author, description, time, title, features, genre, music, comments = [], likes = [] }) {
  const { userName, profilePic, banner } = author ?? {};
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [allComments, setAllComments] = useState(comments);
  const [showAddComment, setShowAddComment] = useState(false);

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
        className="feed-card-glass"
        onClick={() => setModalOpen(true)}
        style={{ cursor: "pointer" }}
      >
        <div className="feed-card-banner" style={{ backgroundImage: `url('${banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80"}')` }} />
        <div className="feed-card-content">
          <div className="feed-card-header-row">
            <div className="feed-card-profile">
              <img className="feed-card-profile-pic" src={profilePic || "https://randomuser.me/api/portraits/men/32.jpg"} alt="profile" />
              <span className="feed-card-author">{userName}</span>
            </div>
            <span className="feed-card-time">{new Date(time).toLocaleDateString()}</span>
          </div>
          {features && features.length > 1 && (
            <div className="feed-card-features">
              <span className="feed-card-feat-label">Feat:</span>
              <span className="feed-card-feat-list">{features.join(", ")}</span>
            </div>
          )}
          <div className="feed-card-title-row">
            <h2 className="feed-card-title">{title}</h2>
            <button className="feed-card-play-btn" onClick={e => { e.stopPropagation(); openAudioPlayer(e); }} title="Play">
              <span>&#9654;</span>
            </button>
          </div>
          <div className="feed-card-desc">{description}</div>
          
          {/* Genre Tags */}
          {genre && Array.isArray(genre) && genre.length > 0 && (
            <div className="feed-card-genres">
              {genre.map((genreItem, index) => (
                <span key={index} className="feed-card-genre-tag">{genreItem}</span>
              ))}
            </div>
          )}
          
          <div className="feed-card-stats-row" style={{ justifyContent: 'flex-end', gap: '1.2rem' }}>
            <span className="feed-card-likes">❤️ {likes.length}</span>
            <span className="feed-card-comments" onClick={e => { e.stopPropagation(); setModalOpen(true); }} style={{ cursor: "pointer" }}>💬 {allComments == null ? 0 : allComments.length}</span>
          </div>
          {showAudioPlayer && (
            <div onClick={e => e.stopPropagation()}>
              <AudioPlayer src={music} onClose={() => setShowAudioPlayer(false)} title={title} />
            </div>
          )}
        </div>
      </div>
      <FeedItemModal
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

export default FeedItem;
