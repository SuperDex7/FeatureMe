import { useState, useEffect, useRef, useCallback } from "react";
import AudioPlayer2 from "./AudioPlayer2";
import CommentSection2 from "./CommentSection2";
import LikesSection2 from "./LikesSection";
import ViewsAnalytics from "./ViewsAnalytics";
import Icon from "./ui/Icon";
import PlusBadge from "./ui/PlusBadge";
import { deletePost } from "../services/PostsService";
import { recordView } from "../utils/views";
import { getCurrentUser } from "../services/AuthService";
import { bannerStyle } from "../utils/banner";
import "../Styling/FeedItem.css";

const DEFAULT_AVATAR = "/dpp.jpg";
function formatRelativeTime(timestamp) {
  const date = new Date(timestamp);
  const diffInHours = Math.floor((Date.now() - date) / (1000 * 60 * 60));
  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
  return date.toLocaleDateString();
}

async function confirmAndDelete(postId) {
  if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
    return false;
  }
  try {
    await deletePost(postId);
    window.location.reload();
    return true;
  } catch (err) {
    console.error("Error deleting post:", err);
    alert("Failed to delete post. Please try again.");
    return false;
  }
}

function FeaturedArtists({ features, limit }) {
  if (!Array.isArray(features) || features.length === 0) return null;
  const shown = limit ? features.slice(0, limit) : features;
  const hidden = features.length - shown.length;
  return (
    <p className="fm-post__features">
      feat.{" "}
      {shown.map((feature, index) => (
        <span key={feature}>
          {index > 0 && ", "}
          <a href={`/profile/${feature}`} onClick={(e) => e.stopPropagation()}>{feature}</a>
        </span>
      ))}
      {hidden > 0 && <span className="fm-post__more"> +{hidden} more</span>}
    </p>
  );
}

function FeedItemModal({ open, onClose, id, author, description, time, title, features, genre, music, comments, likes, onAddComment, currentUser, totalViews = 0, totalComments = 0, totalDownloads = 0, totalLikes, freeDownload = false }) {
  const { userName, profilePic, role } = author ?? {};
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localLikes, setLocalLikes] = useState(likes || []);
  // likes is only the 10 most recent: start from the real total and add what changed here
  const likeTotal = Math.max(0, (totalLikes ?? (likes || []).length) + localLikes.length - (likes || []).length);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showViewsAnalytics, setShowViewsAnalytics] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape" && !showViewsAnalytics) onClose();
    };
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, showViewsAnalytics]);

  if (!open) return null;

  const isOwner = currentUser && currentUser.userName === userName;

  const handlePlayClick = async (e) => {
    e.stopPropagation();
    await recordView(id, currentUser);
    setShowAudioPlayer(true);
  };

  const handleDeletePost = async () => {
    if (!currentUser) return;
    setIsDeleting(true);
    const deleted = await confirmAndDelete(id);
    if (deleted) onClose();
    setIsDeleting(false);
  };

  const handleAnalytics = () => {
    if (currentUser?.role === "USERPLUS") setShowViewsAnalytics(true);
    else window.location.href = "/subscription";
  };

  return (
    <div className="fm-modal-overlay" onClick={onClose}>
      <div
        className="fm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`fm-post-modal-title-${id}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fm-modal__hero" style={bannerStyle(author)}>
          <button ref={closeRef} type="button" className="fm-modal__close" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
          <div className="fm-modal__hero-text">
            <h2 id={`fm-post-modal-title-${id}`} className="fm-modal__title">{title}</h2>
            <p className="fm-modal__by">by {userName}</p>
          </div>
        </div>

        <div className="fm-modal__head">
          <img className="fm-post__avatar" src={profilePic || DEFAULT_AVATAR} alt="" />
          <div className="fm-post__byline">
            <a href={`/profile/${userName}`} className="fm-post__author">{userName}</a>
            <span className="fm-post__time">{new Date(time).toLocaleDateString()}</span>
            {role === "USERPLUS" && <PlusBadge size={18} />}
            {freeDownload && <span className="fm-pill fm-pill--accent">Free download</span>}
          </div>
        </div>

        <div className="fm-modal__body">
          <FeaturedArtists features={features} />
          {description && description.trim() && <p className="fm-post__description">{description}</p>}

          {Array.isArray(genre) && genre.length > 0 && (
            <div className="fm-post__tags">
              {genre.map((genreItem) => <span key={genreItem} className="fm-tag">{genreItem}</span>)}
            </div>
          )}

          {showAudioPlayer ? (
            <AudioPlayer2
              src={music}
              onClose={() => setShowAudioPlayer(false)}
              title={title}
              postId={id}
              freeDownload={freeDownload}
            />
          ) : (
            <button type="button" className="fm-post__play-row" onClick={handlePlayClick}>
              <span className="fm-post__play-btn" aria-hidden="true"><Icon name="play" size={18} /></span>
              <span>Play track</span>
            </button>
          )}

          <div className="fm-modal__tabs" role="tablist" aria-label="Post activity">
            <button
              type="button"
              role="tab"
              aria-selected={!showComments}
              className={`fm-segment${!showComments ? " is-active" : ""}`}
              onClick={() => setShowComments(false)}
            >
              <Icon name="heart" size={16} />
              {likeTotal} {likeTotal === 1 ? "like" : "likes"}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={showComments}
              className={`fm-segment${showComments ? " is-active" : ""}`}
              onClick={() => setShowComments(true)}
            >
              <Icon name="message" size={16} />
              {totalComments || 0} {totalComments === 1 ? "comment" : "comments"}
            </button>
            <span className="fm-post__stat">
              <Icon name="eye" size={16} />
              {totalViews || 0} {totalViews === 1 ? "view" : "views"}
            </span>
            {isOwner && (
              <button type="button" className="fm-segment" onClick={handleAnalytics}>
                <Icon name="chart" size={16} />
                Analytics
              </button>
            )}
          </div>

          <div className="fm-modal__activity">
            {!showComments ? (
              <LikesSection2
                postId={id}
                likes={localLikes}
                onLikeUpdate={setLocalLikes}
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

        <div className="fm-modal__actions">
          <a href={`/post/${id}`} className="fm-btn fm-btn--primary">View full post</a>
          <a href={`/profile/${userName}`} className="fm-btn fm-btn--secondary">View profile</a>
          {isOwner && (
            <button type="button" className="fm-btn fm-btn--danger" onClick={handleDeletePost} disabled={isDeleting}>
              <Icon name="trash" size={16} />
              {isDeleting ? "Deleting..." : "Delete"}
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
  );
}

function FeedItem({ id, author, description, time, title, features, genre, music, comments = [], likes = [], totalViews = 0, totalComments = 0, totalDownloads = 0, totalLikes, freeDownload = false, currentUser: currentUserProp }) {
  const { userName, profilePic, role } = author ?? {};
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [allComments, setAllComments] = useState(comments);
  const [fetchedUser, setFetchedUser] = useState(null);

  // Lists pass the logged-in user in; only fetch it when used on its own.
  const currentUser = currentUserProp !== undefined ? currentUserProp : fetchedUser;
  useEffect(() => {
    if (currentUserProp !== undefined) return;
    getCurrentUser().then(setFetchedUser);
  }, [currentUserProp]);

  const openAudioPlayer = async (e) => {
    e.stopPropagation();
    await recordView(id, currentUser);
    setShowAudioPlayer(true);
  };

  const handleModalAddComment = (newComment, isServerRefresh = false) => {
    if (isServerRefresh && Array.isArray(newComment)) {
      setAllComments(newComment);
    } else if (typeof newComment === "object" && newComment.comment) {
      setAllComments((prev) => [...(prev || []), newComment]);
    }
  };

  const openModal = () => setModalOpen(true);
  // Stable so the modal's focus/keyboard effect doesn't re-run on every card re-render
  const closeModal = useCallback(() => setModalOpen(false), []);
  const genres = Array.isArray(genre) ? genre : [];

  return (
    <>
      <article className="fm-post-card" onClick={openModal}>
        <div className="fm-post-card__banner" style={bannerStyle(author)}>
          <div className="fm-post-card__badges">
            {role === "USERPLUS" && <PlusBadge size={24} className="fm-plus-badge--on-media" />}
            {freeDownload && <span className="fm-pill fm-pill--accent fm-pill--on-media">Free download</span>}
          </div>
          <span className="fm-post-card__time">{formatRelativeTime(time)}</span>
          {!showAudioPlayer && (
            <button type="button" className="fm-post-card__play" onClick={openAudioPlayer} aria-label={`Play ${title}`}>
              <Icon name="play" size={22} />
            </button>
          )}
        </div>

        <div className="fm-post-card__body">
          <div className="fm-post-card__author">
            <img className="fm-post-card__avatar" src={profilePic || DEFAULT_AVATAR} alt="" />
            <a href={`/profile/${userName}`} className="fm-post__author" onClick={(e) => e.stopPropagation()}>{userName}</a>
          </div>

          <div>
            <h3 className="fm-post__title fm-post-card__title">
              <button type="button" className="fm-post__title-btn" onClick={(e) => { e.stopPropagation(); openModal(); }}>
                {title}
              </button>
            </h3>
            <FeaturedArtists features={features} limit={2} />
            {description && description.trim() && <p className="fm-post__description fm-post-card__description">{description}</p>}
          </div>

          {showAudioPlayer && (
            <AudioPlayer2
              src={music}
              onClose={() => setShowAudioPlayer(false)}
              title={title}
              postId={id}
              freeDownload={freeDownload}
            />
          )}

          <div className="fm-post-card__foot">
            <div className="fm-post-card__tags">
              {genres.slice(0, 2).map((genreItem) => <span key={genreItem} className="fm-tag">{genreItem}</span>)}
              {genres.length > 2 && <span className="fm-tag">+{genres.length - 2}</span>}
            </div>
            <div className="fm-post-card__stats">
              <span className="fm-post__stat" aria-label={`${totalLikes ?? likes.length} likes`}>
                <Icon name="heart" size={16} />
                {totalLikes ?? likes.length}
              </span>
              <button
                type="button"
                className="fm-post__stat fm-post__stat--btn"
                onClick={(e) => { e.stopPropagation(); openModal(); }}
                aria-label={`${totalComments || 0} comments, open post`}
              >
                <Icon name="message" size={16} />
                {totalComments || 0}
              </button>
              <span className="fm-post__stat" aria-label={`${totalViews || 0} views`}>
                <Icon name="eye" size={16} />
                {totalViews || 0}
              </span>
            </div>
          </div>
        </div>
      </article>

      <FeedItemModal
        open={modalOpen}
        onClose={closeModal}
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
        totalDownloads={totalDownloads}
        totalLikes={totalLikes}
        freeDownload={freeDownload}
      />
    </>
  );
}

export default FeedItem;
