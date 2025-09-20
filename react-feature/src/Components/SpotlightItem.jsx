import React, { useState, useEffect } from "react";
import AudioPlayer from "./AudioPlayer";
import CommentSection from "./CommentSection";
import LikesSection from "./LikesSection";
import ViewsAnalytics from "./ViewsAnalytics";
import { deletePost, addView } from "../services/PostsService";
import { getCurrentUser } from "../services/AuthService";

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
        console.log(`View cooldown active. ${Math.ceil((oneMinute - timeSinceLastView) / 1000)}s remaining`);
      }
    }
    
    if (shouldAddView && currentUser) {
      try {
        await addView(id);
        localStorage.setItem(cooldownKey, now.toString());
        console.log("View added for post:", id);
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
      console.log('Post deleted successfully');
      // Close modal and reload page
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
          {features && Array.isArray(features) && features.length > 0 && (
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
            {!showAudioPlayer && (
              <button className="spotlight-modal-play-btn" onClick={handlePlayClick} title="Play">
                <span>&#9654;</span>
              </button>
            )}
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
              <AudioPlayer 
                src={music} 
                onClose={() => setShowAudioPlayer(false)} 
                title={title} 
                postId={id}
                freeDownload={freeDownload}
              />
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
            >💬 {totalComments || 0}</span>
            <span className="spotlight-modal-views-count">👁️ {totalViews || 0}</span>
            {currentUser && currentUser.userName === userName && (
              currentUser.role === 'USERPLUS' && (
              <span
                className="spotlight-modal-views"
                style={{ cursor: 'pointer' }}
                onClick={() => setShowViewsAnalytics(true)}
                title="View Analytics (Premium Feature)"
              >📊 Analytics</span>
              )|| <span
                className="spotlight-modal-views"
                style={{ cursor: 'pointer' }}
                onClick={() => alert('Get a Plus Membership to view analytics')}
                title="View Analytics (Premium Feature)"
              >📊 Analytics</span>
            )}
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
          
          <div className="spotlight-modal-actions-row">
          <a href={`/post/${id}`}><button className="spotlight-modal-action-btn">Go To Post</button></a>
            <a href={`/profile/${userName}`}><button className="feed-card-action-btn">View Profile</button></a>
            {currentUser && currentUser.userName === userName && (
              <button 
                className="spotlight-modal-action-btn delete-btn" 
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

function SpotlightItem({ id, author, description, time, title, features, genre, music, comments = [], likes = [], totalViews = 0, totalComments = 0, freeDownload = false }) {
  const { userName, profilePic, banner } = author ?? {};
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [allComments, setAllComments] = useState(comments);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        console.log(`View cooldown active. ${Math.ceil((oneMinute - timeSinceLastView) / 1000)}s remaining`);
      }
    }
    
    if (shouldAddView && currentUser) {
      try {
        await addView(id);
        localStorage.setItem(cooldownKey, now.toString());
        console.log("View added for post:", id);
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

  const handleModalAddComment = (comment, isServerRefresh = false) => {
    if (isServerRefresh && Array.isArray(comment)) {
      // Server refresh - replace all comments with server data
      setAllComments(comment);
    } else if (typeof comment === 'object' && comment.comment) {
      // Single comment object - add to existing comments
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
      console.log('Post deleted successfully');
      // You might want to call a callback to remove this post from the parent component's list
      // For now, we'll just reload the page
      window.location.reload();
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
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
          
          {features && features.length > 0 && (
            <div className="spotlight-card-features">
              <span className="spotlight-card-feat-label">Feat:</span>
              <span className="spotlight-card-feat-list">{features.join(", ")}</span>
            </div>
          )}
          
          <div className="spotlight-card-title-row">
            <h2 className="spotlight-card-title">{title}</h2>
            {!showAudioPlayer && (
              <button className="spotlight-card-play-btn" onClick={e => { e.stopPropagation(); openAudioPlayer(e); }} title="Play">
                <span>&#9654;</span>
              </button>
            )}
          </div>
          
          {description && description.trim() && (
            <div className="spotlight-card-desc">{description}</div>
          )}
          
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
            <span className="spotlight-card-comments" onClick={e => { e.stopPropagation(); setModalOpen(true); }} style={{ cursor: "pointer" }}>💬 {totalComments || 0}</span>
            <span className="spotlight-card-views-count">👁️ {totalViews || 0}</span>
          </div>
          
          {showAudioPlayer && (
            <div onClick={e => e.stopPropagation()}>
              <AudioPlayer 
                src={music} 
                onClose={() => setShowAudioPlayer(false)} 
                title={title} 
                postId={id}
                freeDownload={freeDownload}
              />
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
        currentUser={currentUser}
        totalViews={totalViews}
        totalComments={totalComments}
        freeDownload={freeDownload}
      />
    </>
  );
}

export default SpotlightItem;
