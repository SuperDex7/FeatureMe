import { useEffect, useState } from "react";
import FeedItem from "./FeedItem";
import Pagination from "./ui/Pagination";
import { getCurrentUser } from "../services/AuthService";
import { getMyLikedPosts, getPostsByUser } from "../services/PostsService";
import { cached, peek } from "../utils/requestCache";
import "../Styling/Feed2.css";

const PAGE_SIZE = 12;

const COPY = {
  liked: {
    ids: (user) => user.likedPosts,
    emptyTitle: "No liked posts yet",
    emptyText: "Tap the heart on a track you like and it'll be saved here.",
    emptyAction: { href: "/trending", label: "Find something to like" },
  },
  mine: {
    ids: (user) => user.posts,
    emptyTitle: "You haven't posted yet",
    emptyText: "Share a track, beat or loop and invite other artists to feature on it.",
    emptyAction: { href: "/create-post", label: "Upload a track" },
  },
};

// The Feed page's "Liked" and "My posts" tabs: your posts or the ones you've
// liked, newest first, as the same cards the feed uses.
function UserPostList({ kind }) {
  const copy = COPY[kind];
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    getCurrentUser().then((me) => {
      if (me) setUser(me);
      else setStatus("error");
    });
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const ids = copy.ids(user) || [];
    if (ids.length === 0) {
      setPosts([]);
      setStatus("ready");
      return undefined;
    }
    let cancelled = false;
    // Cached, so switching Feed / Liked / My posts tabs back and forth is instant
    const key = `userposts:${kind}:${ids.length}:${page}`;
    const hit = peek(key);
    if (hit) {
      setPosts(hit.content || []);
      setTotalPages(hit.page?.totalPages || 0);
      setStatus("ready");
      return undefined;
    }
    setStatus("loading");
    const request = kind === "liked" ? getMyLikedPosts(page, PAGE_SIZE) : getPostsByUser(user.userName, page, PAGE_SIZE);
    cached(key, () => request.then((r) => r.data))
      .then((data) => {
        if (cancelled) return;
        setPosts(data.content || []);
        setTotalPages(data.page?.totalPages || 0);
        setStatus("ready");
      })
      .catch((err) => {
        console.error(`Error loading ${kind} posts:`, err);
        if (!cancelled) setStatus("error");
      });
    return () => { cancelled = true; };
  }, [user, page, kind, copy]);

  const changePage = (next) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (status === "loading" && posts.length === 0) {
    return <div className="fm-state" role="status"><div className="fm-spinner" /><p>Loading posts…</p></div>;
  }
  if (status === "error") {
    return (
      <div className="fm-state" role="alert">
        <h3>Couldn&apos;t load these posts</h3>
        <p>Check your connection and try again.</p>
        <button type="button" className="fm-btn fm-btn--secondary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }
  if (posts.length === 0) {
    return (
      <div className="fm-state">
        <h3>{copy.emptyTitle}</h3>
        <p>{copy.emptyText}</p>
        <a href={copy.emptyAction.href} className="fm-btn fm-btn--primary">{copy.emptyAction.label}</a>
      </div>
    );
  }

  return (
    <section className="fm-user-posts" aria-busy={status === "loading"}>
      <div className="fm-feed__list">
        {posts.map((post) => <FeedItem key={post.id} {...post} currentUser={user} />)}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={changePage} label="Post pages" />
    </section>
  );
}

export default UserPostList;
