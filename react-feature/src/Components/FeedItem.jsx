import React, { useState } from "react";
import AudioPlayer from "./AudioPlayer";
import CommentSection from "./CommentSection";
import LikesSection from "./LikesSection";

function FeedItemModal({ open, onClose, id, author, description, time, title, features, genre, music, comments, likes, onAddComment }) {
  const { userName, profilePic, banner } = author ?? {};
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localLikes, setLocalLikes] = useState(likes || []);

  if (!open) return null;

  const handleLikeUpdate = (updatedLikes) => {
    setLocalLikes(updatedLikes);
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
              <span className="feed-card-author"><a href={`/profile/${userName}`}>{userName}</a></span>
            </div>
            <span className="feed-card-time">{new Date(time).toLocaleDateString()}</span>
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
          
          {showAudioPlayer && (
            <div onClick={e => e.stopPropagation()}>
              <AudioPlayer src={music} onClose={() => setShowAudioPlayer(false)} title={title} />
            </div>
          )}
          
          <div className="feed-card-stats-row" style={{ justifyContent: 'flex-end', gap: '1.2rem' }}>
            <span
              className={`feed-card-likes${!showComments ? ' active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setShowComments(false)}
            >❤️ {localLikes.length}</span>
            <span
              className={`feed-card-comments${showComments ? ' active' : ''}`}
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
              postAuthor={author}
            />
          )}
          <div className="feed-card-actions-row">
            <a href={`/post/${id}`}><button className="feed-card-action-btn">Go To Post</button></a>
            <a href={`/profile/${userName}`}><button className="feed-card-action-btn">View Profile</button></a>
          </div>
          
        </div>
      </div>
    </div>
  );
}

function FeedItem({ id, author, description, time, title, features, genre, music, comments = [], likes = [] }) {
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
  
  const handleModalAddComment = (newComment, isServerRefresh = false) => {
    if (isServerRefresh && Array.isArray(newComment)) {
      // Server refresh - replace all comments with server data
      setAllComments(newComment);
    } else if (typeof newComment === 'object' && newComment.comment) {
      // Single comment object - add to existing comments
      setAllComments(prev => [...(prev || []), newComment]);
    }
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
          {showAudioPlayer && (
            <div onClick={e => e.stopPropagation()}>
              <AudioPlayer src={music} onClose={() => setShowAudioPlayer(false)} title={title} />
            </div>
          )}
          <div className="feed-card-stats-row" style={{ justifyContent: 'flex-end', gap: '1.2rem' }}>
            <span className="feed-card-likes">❤️ {likes.length}</span>
            <span className="feed-card-comments" onClick={e => { e.stopPropagation(); setModalOpen(true); }} style={{ cursor: "pointer" }}>💬 {allComments == null ? 0 : allComments.length}</span>
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
      />
    </>
  );
}

export default FeedItem;
