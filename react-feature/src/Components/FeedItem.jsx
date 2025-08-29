import React, { useState } from "react";
import AudioPlayer from "./AudioPlayer";
import api from "../services/AuthService"

function FeedItemModal({ open, onClose, id, author, description, time, title, features, genre, music, comments, likes, onAddComment }) {
  const { userName, profilePic, banner } = author ?? {};
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [localLikes, setLocalLikes] = useState(likes || []);
  
  const userString = localStorage.getItem('user');
  const userrr = JSON.parse(userString);

  if (!open) return null;

  const handleComment = (e) => {
    e.preventDefault();
    
    if (commentInput.trim()) {
        const newComment = {
            userName: userrr.username,
            profilePic: userrr.profilePic,
            comment: commentInput,
            time: new Date().toISOString()
        };
        
        // Call parent callback to update the feed item immediately
        onAddComment(newComment);
        
        // Clear input
        setCommentInput("");
        
        // Send to backend and then refresh comments from server
        api.post(`/posts/add/comment/${id}/${userrr.username}`, commentInput, {
            headers: {
                'Content-Type': 'text/plain'
            }
        })
        .then(res => {
            // Fetch updated comments from server to get proper profile pics
            return api.get(`/posts/get/id/${id}`);
        })
        .then(postRes => {
            if (postRes.data && postRes.data.comments) {
                // Update parent with server data (has proper profile pics)
                onAddComment(postRes.data.comments);
            }
        })
        .catch(err => {
            console.error('Error posting comment:', err);
            // Could add error handling here if needed
        });
    }
  };

  const handleLike = (e) => {
    api.post(`/posts/add/like/${id}/${userrr.username}`)
    .then(res => {
      console.log(res);
      // After successful like, fetch updated post
      return api.get(`/posts/get/id/${id}`);
    })
    .then(postRes => {
      console.log(postRes.data.likes);
      setLocalLikes(postRes.data.likes);
    })
    .catch(err => {
      console.error(err);
    });
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
            <div className="feed-card-likes-section">
              <div className="feed-card-comments-title">Likes</div>
              <button onClick={handleLike}>Like</button>
              <ul className="feed-card-likes-list">
                {localLikes.length === 0 ? (
                  <li style={{ color: '#aaa' }}>No likes yet.</li>
                ) : (
                  localLikes.map((like, idx) => (
                    <li key={idx} className="feed-card-like-user">
                      <img
                        src={like.profilePic || "https://randomuser.me/api/portraits/men/32.jpg"}
                        alt="profile"
                        className="feed-card-like-profile-pic"
                      />
                      <a href={`/profile/${like.userName}`}><span className="feed-card-like-username">{like.userName|| 'User'}</span></a>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : (
            <div className="feed-card-comments-section">
              <div className="feed-card-comments-title">Comments</div>
              <div className="comments-list">
                                            {comments?.map((comment, index) => (
                                                <div key={index} className="comment-item">
                                                    <div ><a href={`/profile/${comment.userName}`}><img className="comment-avatar" src={comment.profilePic} alt="" /></a></div>
                                                    <div className="comment-content">
                                                        <span className="comment-username">{comment.userName}</span>
                                                        <p className="comment-text">{comment.comment}</p>
                                                        <p className="comment-feed-time">{new Date(comment.time).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            )) || "You will see comments here"}
                                        </div>
              <div className="feed-card-add-comment-row">
                <input
                  className="feed-card-add-comment-input"
                  type="text"
                  placeholder="Add a comment..."
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleComment(); }}
                />
                <button className="feed-card-add-comment-btn" onClick={handleComment}>Post</button>
              </div>
            </div>
          )}
          <div className="feed-card-actions-row">
            <a href={`/post/${id}`}><button className="feed-card-action-btn">Go To Post</button></a>
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
  
  const handleModalAddComment = (newComment) => {
    // If it's a single comment object, add it to the array
    if (typeof newComment === 'object' && newComment.comment) {
      setAllComments(prev => [...(prev || []), newComment]);
    } 
    // If it's an array of comments (from server refresh), replace the entire array
    else if (Array.isArray(newComment)) {
      setAllComments(newComment);
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
