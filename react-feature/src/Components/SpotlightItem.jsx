import React, { useState } from "react";
import AudioPlayer from "./AudioPlayer";
import CommentSection from "./CommentSection";
import LikesSection from "./LikesSection";

function SpotlightItemModal({ open, onClose, id, author, description, time, title, features, genre, music, comments, likes, onAddComment }) {
  const { userName, profilePic, banner } = author ?? {};
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localLikes, setLocalLikes] = useState(likes || []);

  if (!open) return null;
  const handleLikeUpdate = (updatedLikes) => {
    setLocalLikes(updatedLikes);
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
          {showAudioPlayer && (
            <div onClick={e => e.stopPropagation()}>
              <AudioPlayer src={music} onClose={() => setShowAudioPlayer(false)} title={title} />
            </div>
          )}
          <div className="spotlight-modal-stats-row" style={{ justifyContent: 'flex-end', gap: '1.2rem' }}>
            <span
              className={`spotlight-modal-likes${!showComments ? ' active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setShowComments(false)}
            >❤️ {localLikes.length}</span>
            <span
              className={`spotlight-modal-comments${showComments ? ' active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setShowComments(true)}
            >💬 {comments?.length || 0}</span>
          </div>
          
          {!showComments ? (
            <LikesSection
              postId={id}
              likes={localLikes}
              onLikeUpdate={handleLikeUpdate}
              showLikes={!showComments}
              setShowLikes={setShowComments}
            />
          ) : (
            <CommentSection
              postId={id}
              comments={comments}
              onAddComment={onAddComment}
              showComments={showComments}
              setShowComments={setShowComments}
            />
          )}
          
          <div className="spotlight-modal-actions-row">
          <a href={`/post/${id}`}><button className="spotlight-modal-action-btn">Go To Post</button></a>
            <a href={`/profile/${userName}`}><button className="feed-card-action-btn">View Profile</button></a>
          </div>
          
          
        </div>
      </div>
    </div>
  );
}

function SpotlightItem({ id, author, description, time, title, features, genre, music, comments = [], likes = [] }) {
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

  const handleModalAddComment = (comment, isServerRefresh = false) => {
    if (isServerRefresh && Array.isArray(comment)) {
      // Server refresh - replace all comments with server data
      setAllComments(comment);
    } else if (typeof comment === 'object' && comment.comment) {
      // Single comment object - add to existing comments
      setAllComments(prev => [...(prev || []), comment]);
    }
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
      />
    </>
  );
}

export default SpotlightItem;
