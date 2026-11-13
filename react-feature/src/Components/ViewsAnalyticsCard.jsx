import { useEffect, useState } from "react";
import { PostAnalytics } from "./ViewsAnalytics";
import Icon from "./ui/Icon";
import Pagination from "./ui/Pagination";
import { getCurrentUser } from "../services/AuthService";
import { getPostsByUser } from "../services/PostsService";
import { bannerStyle } from "../utils/banner";
import "./ViewsAnalyticsCard.css";

const PER_PAGE = 6;

function compact(n) {
  const value = Number(n) || 0;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value);
}

// Pick one of your posts, then see its analytics in place.
// Shown inside the home dashboard's Analytics dialog.
function ViewsAnalyticsCard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) setCurrentUser(user);
      else setStatus("error");
    });
  }, []);

  // One page of your posts at a time, newest first
  useEffect(() => {
    if (!currentUser) return undefined;
    const ids = currentUser.posts || [];
    if (ids.length === 0) {
      setStatus("ready");
      return undefined;
    }
    let cancelled = false;
    setStatus((prev) => (prev === "ready" ? "paging" : "loading"));
    getPostsByUser(currentUser.userName, page, PER_PAGE)
      .then(({ data }) => {
        if (cancelled) return;
        setPosts(data.content || []);
        setTotalPages(data.page?.totalPages || 0);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Error fetching your posts:", err);
        if (!cancelled) setStatus("error");
      });
    return () => { cancelled = true; };
  }, [currentUser, page]);

  if (selected) {
    return (
      <div className="fm-stats-picker">
        <div className="fm-stats-picker__back">
          <button type="button" className="fm-btn fm-btn--secondary" onClick={() => setSelected(null)}>
            <Icon name="chevronLeft" size={18} />
            All posts
          </button>
          <span className="fm-stats-picker__current">{selected.title}</span>
        </div>
        <PostAnalytics
          postId={selected.id}
          currentUser={currentUser}
          postAuthor={selected.author}
          totalDownloads={selected.totalDownloads || 0}
          totalViews={selected.totalViews || 0}
          totalComments={selected.totalComments || 0}
        />
      </div>
    );
  }

  if (status === "loading") {
    return <div className="fm-state" role="status"><div className="fm-spinner" /><p>Loading your posts…</p></div>;
  }
  if (status === "error") {
    return <p className="fm-stats-picker__empty">Couldn&apos;t load your posts. Close this and try again.</p>;
  }
  if (posts.length === 0) {
    return (
      <div className="fm-state">
        <h3>No posts yet</h3>
        <p>Once you post a track, its plays, likes and downloads show up here.</p>
        <a href="/create-post" className="fm-btn fm-btn--primary">Upload a track</a>
      </div>
    );
  }

  return (
    <div className="fm-stats-picker" aria-busy={status === "paging"}>
      <p className="fm-stats-picker__intro">Pick a post to see who&apos;s listening, liking and downloading.</p>
      <ul className="fm-stats-picker__grid">
        {posts.map((post) => (
          <li key={post.id}>
            <button type="button" className="fm-stats-picker__post" onClick={() => setSelected(post)}>
              <span className="fm-stats-picker__cover" style={bannerStyle(post.author)} aria-hidden="true" />
              <span className="fm-stats-picker__title">{post.title}</span>
              <span className="fm-stats-picker__nums">
                <span><Icon name="play" size={12} />{compact(post.totalViews)}</span>
                <span><Icon name="heart" size={12} />{compact(post.likes?.length)}</span>
                <span><Icon name="message" size={12} />{compact(post.totalComments)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} label="Your posts" />
    </div>
  );
}

export default ViewsAnalyticsCard;
