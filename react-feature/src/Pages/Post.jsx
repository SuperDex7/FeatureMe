import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import AudioPlayer2 from "../Components/AudioPlayer2";
import LikesSection from "../Components/LikesSection";
import CommentSection2 from "../Components/CommentSection2";
import ViewsAnalytics from "../Components/ViewsAnalytics";
import Dialog from "../Components/ui/Dialog";
import Icon from "../Components/ui/Icon";
import PlusBadge from "../Components/ui/PlusBadge";
import api, { getCurrentUserSafe } from "../services/AuthService";
import { deletePost } from "../services/PostsService";
import { bannerStyle } from "../utils/banner";
import { recordView } from "../utils/views";
import "../Styling/PostPage.css";

const DEFAULT_AVATAR = "/dpp.jpg";

const STATUS_LABELS = {
  DRAFT: "Draft",
  PARTIALLY_APPROVED: "Waiting on features",
};

function releasedAgo(timestamp) {
  const days = Math.floor((Date.now() - new Date(timestamp)) / 864e5);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} ${days < 14 ? "week" : "weeks"} ago`;
  if (days < 365) return `${Math.floor(days / 30)} ${days < 60 ? "month" : "months"} ago`;
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

const plural = (n, word) => `${n} ${n === 1 ? word : `${word}s`}`;

function PeopleLinks({ names }) {
  return names.map((name, index) => (
    <span key={name}>
      {index > 0 && ", "}
      <a href={`/profile/${name}`}>{name}</a>
    </span>
  ));
}

// The full page for one track. It's public, so it also works as a share link
// for people who aren't logged in.
function Post() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | notfound | error
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState([]);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [shareLabel, setShareLabel] = useState("Share");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setPlayerOpen(false);
    Promise.allSettled([api.get(`/posts/get/id/${id}`), getCurrentUserSafe()]).then(([postResult, userResult]) => {
      if (cancelled) return;
      if (userResult.status === "fulfilled") setCurrentUser(userResult.value || null);
      if (postResult.status === "fulfilled" && postResult.value.data?.id) {
        const data = postResult.value.data;
        setPost(data);
        setComments(Array.isArray(data.comments) ? data.comments : []);
        setLikes(Array.isArray(data.likes) ? data.likes : []);
        setStatus("ready");
      } else {
        const code = postResult.status === "rejected" ? postResult.reason?.response?.status : 404;
        setStatus(code === 404 || code === 400 ? "notfound" : "error");
      }
    });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!post?.title) return undefined;
    const previous = document.title;
    document.title = `${post.title} by ${post.author?.userName} · FeatureMe`;
    return () => { document.title = previous; };
  }, [post]);

  if (status !== "ready") {
    return (
      <div className="fm-page">
        <Header />
        <main className="fm-page__main">
          {status === "loading" && (
            <div className="fm-state" role="status">
              <div className="fm-spinner" />
              <p>Loading track…</p>
            </div>
          )}
          {status === "notfound" && (
            <div className="fm-state">
              <h3>Track not found</h3>
              <p>It may have been deleted, or the link is wrong.</p>
              <a href="/feed" className="fm-btn fm-btn--primary">Browse the feed</a>
            </div>
          )}
          {status === "error" && (
            <div className="fm-state" role="alert">
              <h3>Couldn&apos;t load this track</h3>
              <p>Check your connection and try again.</p>
              <button type="button" className="fm-btn fm-btn--secondary" onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  const author = post.author || {};
  const genres = Array.isArray(post.genre) ? post.genre : [];
  const features = Array.isArray(post.features) ? post.features : [];
  const pending = Array.isArray(post.pendingFeatures) ? post.pendingFeatures : [];
  const isOwner = currentUser?.userName === author.userName;
  const isPlus = currentUser?.role === "USERPLUS";
  // post.likes is only the 10 most recent; adjust the real total by what changed on this page
  const initialLikes = Array.isArray(post.likes) ? post.likes.length : 0;
  const likeTotal = Math.max(0, (post.totalLikes ?? initialLikes) + likes.length - initialLikes);
  const statusLabel = STATUS_LABELS[post.status];
  const totalComments = post.totalComments ?? comments.length;

  const play = () => {
    setPlayerOpen(true);
    recordView(post.id, currentUser);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: `${post.title} by ${author.userName} on FeatureMe`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareLabel("Link copied");
    } catch (err) {
      if (err?.name === "AbortError") return; // closed the share sheet
      setShareLabel("Couldn't copy");
    }
    setTimeout(() => setShareLabel("Share"), 2000);
  };

  const handleAddComment = (comment, isServerRefresh = false) => {
    if (isServerRefresh && Array.isArray(comment)) setComments(comment);
    else if (comment?.comment) setComments((prev) => [...prev, comment]);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deletePost(post.id);
      window.location.href = `/profile/${author.userName}`;
    } catch (err) {
      console.error("Error deleting post:", err);
      setDeleteError("Couldn't delete the post. Try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="fm-page">
      <Header />

      <main className="fm-page__main">
        <div className="fm-track">
          {/* Hero */}
          <section className="fm-track__hero" style={bannerStyle(author)} aria-labelledby="fm-track-title">
            <div className="fm-track__shade">
              <div className="fm-track__labels">
                {statusLabel && <span className="fm-pill fm-pill--accent">{statusLabel}</span>}
                {post.freeDownload && <span className="fm-track__label">Free download</span>}
                {genres.map((genre) => (
                  <a key={genre} href={`/feed?genre=${encodeURIComponent(genre)}`} className="fm-track__label">{genre}</a>
                ))}
              </div>

              <h1 id="fm-track-title" className="fm-track__title">{post.title}</h1>

              <div className="fm-track__byline">
                <a href={`/profile/${author.userName}`} className="fm-track__artist">
                  <img src={author.profilePic || DEFAULT_AVATAR} alt="" />
                  {author.userName}
                </a>
                {author.role === "USERPLUS" && <PlusBadge size={20} className="fm-plus-badge--on-media" />}
                {features.length > 0 && (
                  <span className="fm-track__feat">feat. <PeopleLinks names={features} /></span>
                )}
              </div>

              <div className="fm-track__actions">
                <button type="button" className="fm-btn fm-btn--primary fm-track__play" onClick={play} disabled={playerOpen}>
                  <Icon name={playerOpen ? "volume" : "play"} size={18} />
                  {playerOpen ? "Playing" : "Play"}
                </button>
                <button type="button" className="fm-btn fm-btn--secondary fm-track__on-media" onClick={share}>
                  <Icon name="link" size={18} />
                  <span aria-live="polite">{shareLabel}</span>
                </button>
                {isOwner && (
                  isPlus ? (
                    <button type="button" className="fm-btn fm-btn--secondary fm-track__on-media" onClick={() => setAnalyticsOpen(true)}>
                      <Icon name="chart" size={18} />
                      Analytics
                    </button>
                  ) : (
                    <a href="/subscription" className="fm-btn fm-btn--secondary fm-track__on-media">
                      <Icon name="chart" size={18} />
                      Analytics
                      <PlusBadge size={16} />
                    </a>
                  )
                )}
                {isOwner && (
                  <button type="button" className="fm-btn fm-btn--secondary fm-track__on-media fm-track__delete" onClick={() => setDeleteOpen(true)}>
                    <Icon name="trash" size={18} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Stats */}
          <ul className="fm-track__stats" aria-label="Track stats">
            <li><Icon name="heart" size={18} /><strong>{likeTotal}</strong> {likeTotal === 1 ? "like" : "likes"}</li>
            <li><Icon name="message" size={18} /><strong>{totalComments}</strong> {totalComments === 1 ? "comment" : "comments"}</li>
            <li><Icon name="eye" size={18} /><strong>{post.totalViews || 0}</strong> {post.totalViews === 1 ? "view" : "views"}</li>
            {post.time && (
              <li>
                <Icon name="music" size={18} />
                Released{" "}
                <time dateTime={post.time} title={new Date(post.time).toLocaleDateString()}>{releasedAgo(post.time)}</time>
              </li>
            )}
          </ul>

          <div className="fm-track__layout">
            <div className="fm-track__main">
              {playerOpen && (
                <section className="fm-card fm-track__player" aria-label="Player">
                  <AudioPlayer2
                    src={post.music}
                    title={post.title}
                    postId={post.id}
                    freeDownload={post.freeDownload}
                    onClose={() => setPlayerOpen(false)}
                  />
                </section>
              )}

              <section className="fm-card" aria-labelledby="fm-track-about">
                <h2 id="fm-track-about" className="fm-track__card-title">About this track</h2>
                {post.description?.trim() ? (
                  <p className="fm-track__description">{post.description}</p>
                ) : (
                  <p className="fm-track__muted">{author.userName} hasn&apos;t added a description.</p>
                )}
              </section>

              <section className="fm-card fm-track__comments" aria-label="Comments">
                <CommentSection2
                  postId={post.id}
                  comments={comments}
                  onAddComment={handleAddComment}
                  postAuthor={author}
                  totalCommentsFromPost={totalComments}
                  maxHeight="560px"
                  placeholder="Share your thoughts on this track..."
                />
              </section>
            </div>

            <aside className="fm-track__rail" aria-label="About the artist and track">
              {!currentUser && (
                <section className="fm-card fm-track__join">
                  <h2 className="fm-track__card-title">Make music with {author.userName}</h2>
                  <p className="fm-track__muted">Join FeatureMe to like, comment and ask to feature on tracks like this one.</p>
                  <div className="fm-track__join-actions">
                    <a href="/signup" className="fm-btn fm-btn--primary">Sign up</a>
                    <a href="/login" className="fm-btn fm-btn--secondary">Log in</a>
                  </div>
                </section>
              )}

              <section className="fm-card fm-track__artist-card" aria-label="Artist">
                <a href={`/profile/${author.userName}`} className="fm-track__artist-link">
                  <span className="fm-track__ring"><img src={author.profilePic || DEFAULT_AVATAR} alt="" /></span>
                  <span className="fm-track__artist-text">
                    <span className="fm-track__artist-name">
                      {author.userName}
                      {author.role === "USERPLUS" && <PlusBadge size={18} />}
                    </span>
                    {author.location && <span className="fm-track__muted">{author.location}</span>}
                  </span>
                </a>
                {author.bio && <p className="fm-track__bio">{author.bio}</p>}
                <div className="fm-track__artist-actions">
                  <a href={`/profile/${author.userName}`} className="fm-btn fm-btn--secondary">View profile</a>
                  {currentUser && !isOwner && (
                    <a href={`/messages?createChat=true&user=${encodeURIComponent(author.userName)}`} className="fm-btn fm-btn--secondary">
                      <Icon name="message" size={18} />
                      Message
                    </a>
                  )}
                </div>
              </section>

              <section className="fm-card fm-track__likes" aria-label="Likes">
                <LikesSection postId={post.id} likes={likes} onLikeUpdate={setLikes} />
              </section>

              <section className="fm-card" aria-labelledby="fm-track-details">
                <h2 id="fm-track-details" className="fm-track__card-title">Details</h2>
                <dl className="fm-track__details">
                  {post.time && (
                    <div>
                      <dt>Released</dt>
                      <dd>{new Date(post.time).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Genre</dt>
                    <dd>{genres.length ? genres.join(", ") : "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Featuring</dt>
                    <dd>{features.length ? <PeopleLinks names={features} /> : "No one yet"}</dd>
                  </div>
                  {isOwner && pending.length > 0 && (
                    <div>
                      <dt>Waiting on</dt>
                      <dd><PeopleLinks names={pending} /></dd>
                    </div>
                  )}
                  <div>
                    <dt>Download</dt>
                    <dd>{post.freeDownload ? "Free, from the player" : "Not available"}</dd>
                  </div>
                  {isOwner && (
                    <div>
                      <dt>Downloads</dt>
                      <dd>{plural(post.totalDownloads || 0, "download")}</dd>
                    </div>
                  )}
                </dl>
              </section>
            </aside>
          </div>
        </div>
      </main>

      <Footer />

      {isOwner && isPlus && (
        <ViewsAnalytics
          postId={post.id}
          postTitle={post.title}
          isOpen={analyticsOpen}
          onClose={() => setAnalyticsOpen(false)}
          currentUser={currentUser}
          postAuthor={author}
          totalDownloads={post.totalDownloads || 0}
          totalViews={post.totalViews || 0}
          totalComments={totalComments}
        />
      )}

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        closeDisabled={deleting}
        title="Delete this track?"
        size="sm"
        footer={(
          <>
            <button type="button" className="fm-btn fm-btn--secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</button>
            <button type="button" className="fm-btn fm-btn--danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete track"}
            </button>
          </>
        )}
      >
        <p className="fm-track__dialog-text">
          <strong>{post.title}</strong> and its likes and comments will be removed for good. This can&apos;t be undone.
        </p>
        {deleteError && <p className="fm-field__error" role="alert">{deleteError}</p>}
      </Dialog>
    </div>
  );
}

export default Post;
