import { useEffect, useState } from "react";
import api from "../services/AuthService";
import Dialog from "./ui/Dialog";
import Icon from "./ui/Icon";
import Pagination from "./ui/Pagination";
import "./ViewsAnalytics.css";

const PAGE_SIZE = 10;
const DEFAULT_AVATAR = "/dpp.jpg";

// One list per tab: where to fetch it and how to describe each row
const TABS = [
  { key: "views", label: "Listeners", url: (id) => `/posts/views/${id}/paginated`, empty: "Nobody has played this yet." },
  { key: "likes", label: "Likes", url: (id) => `/posts/likes/${id}/paginated`, empty: "No likes yet." },
  { key: "downloads", label: "Downloads", url: (id) => `/posts/downloads/${id}/paginated`, empty: "No downloads yet." },
  { key: "comments", label: "Comments", url: (id) => `/posts/comments/${id}/paginated`, empty: "No comments yet." },
];

function compact(n) {
  const value = Number(n) || 0;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e4) return `${Math.round(value / 1e3)}K`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value);
}

function when(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: sameYear ? undefined : "numeric" });
}

const isGuest = (name) => !name || name === "unknown";

// Per-post analytics for the post's author (a Plus feature): totals plus who
// listened, liked, downloaded and commented. Used inline by the home
// dashboard's analytics dialog and wrapped in a dialog by ViewsAnalytics.
export function PostAnalytics({ postId, currentUser, postAuthor, totalDownloads = 0, totalViews = 0, totalComments = 0 }) {
  const isOpen = Boolean(postId);
  const [summary, setSummary] = useState({ plays: totalViews, listeners: 0, likes: 0, downloads: totalDownloads, comments: totalComments });
  const [tab, setTab] = useState("views");
  const [page, setPage] = useState(0);
  const [list, setList] = useState({ items: [], totalPages: 0, totalElements: 0, status: "loading" });
  const [likers, setLikers] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);

  // Totals for the stat tiles
  useEffect(() => {
    if (!isOpen || !postId) return undefined;
    let cancelled = false;
    setTab("views");
    setPage(0);
    setSummary({ plays: totalViews, listeners: 0, likes: 0, downloads: totalDownloads, comments: totalComments });
    const total = (res) => res.value?.data?.page?.totalElements;
    Promise.allSettled([
      api.get(`/posts/views/${postId}/summary`),
      api.get(`/posts/likes/${postId}/summary`),
      api.get(`/posts/downloads/${postId}/paginated`, { params: { page: 0, size: 1 } }),
      api.get(`/posts/comments/${postId}/paginated`, { params: { page: 0, size: 1 } }),
      api.get(`/posts/likes/${postId}/paginated`, { params: { page: 0, size: 1000 } }),
    ]).then(([views, likes, downloads, comments, allLikes]) => {
      if (cancelled) return;
      setSummary((prev) => ({
        plays: views.value?.data?.totalViews ?? prev.plays,
        listeners: views.value?.data?.uniqueViewers ?? prev.listeners,
        likes: likes.value?.data?.totalLikes ?? prev.likes,
        downloads: total(downloads) ?? prev.downloads,
        comments: total(comments) ?? prev.comments,
      }));
      const likeList = allLikes.value?.data?.content || [];
      setLikers(new Set(likeList.map((l) => l.userName).filter(Boolean)));
    });
    return () => { cancelled = true; };
    // Reload when the dialog opens for a post; the totals props are only a starting point
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, postId]);

  // The open tab's page of people
  useEffect(() => {
    if (!isOpen || !postId) return undefined;
    let cancelled = false;
    const current = TABS.find((t) => t.key === tab);
    setList((prev) => ({ ...prev, status: "loading" }));
    api.get(current.url(postId), { params: { page, size: PAGE_SIZE } })
      .then(({ data }) => {
        if (cancelled) return;
        setList({
          items: data?.content || [],
          totalPages: data?.page?.totalPages || 0,
          totalElements: data?.page?.totalElements || 0,
          status: "ready",
        });
      })
      .catch((err) => {
        console.error(`Error loading ${tab}:`, err);
        if (!cancelled) setList({ items: [], totalPages: 0, totalElements: 0, status: "error" });
      });
    return () => { cancelled = true; };
  }, [isOpen, postId, tab, page]);

  const switchTab = (key) => {
    setTab(key);
    setPage(0);
  };

  const deleteComment = async (commentId) => {
    setDeletingId(commentId);
    try {
      await api.delete(`/posts/delete/comment/${commentId}`);
      setList((prev) => ({ ...prev, items: prev.items.filter((c) => c.id !== commentId), totalElements: Math.max(0, prev.totalElements - 1) }));
      setSummary((prev) => ({ ...prev, comments: Math.max(0, prev.comments - 1) }));
    } catch (err) {
      console.error("Error deleting comment:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const perListener = summary.listeners > 0 ? (summary.plays / summary.listeners).toFixed(1) : "0";
  const downloadRate = summary.plays > 0 ? `${((summary.downloads / summary.plays) * 100).toFixed(1)}%` : "0%";
  const canModerate = currentUser && postAuthor && currentUser.userName === postAuthor.userName;

  const tiles = [
    { icon: "play", label: "Plays", value: compact(summary.plays) },
    { icon: "user", label: "Listeners", value: compact(summary.listeners), hint: `${perListener} plays each` },
    { icon: "heart", label: "Likes", value: compact(summary.likes) },
    { icon: "message", label: "Comments", value: compact(summary.comments) },
    { icon: "download", label: "Downloads", value: compact(summary.downloads), hint: `${downloadRate} of plays` },
  ];
  const counts = { views: summary.listeners, likes: summary.likes, downloads: summary.downloads, comments: summary.comments };

  return (
      <div className="fm-stats">
        <ul className="fm-stats__tiles" aria-label="Totals">
          {tiles.map((tile) => (
            <li key={tile.label} className="fm-stats__tile">
              <span className="fm-stats__tile-head"><Icon name={tile.icon} size={16} />{tile.label}</span>
              <strong>{tile.value}</strong>
              {tile.hint && <span className="fm-stats__hint">{tile.hint}</span>}
            </li>
          ))}
        </ul>

        <div className="fm-segmented fm-stats__tabs" role="tablist" aria-label="People">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`fm-segment${tab === t.key ? " is-active" : ""}`}
              onClick={() => switchTab(t.key)}
            >
              {t.label} <span className="fm-stats__count">{compact(counts[t.key])}</span>
            </button>
          ))}
        </div>

        <div className="fm-stats__panel" role="tabpanel" aria-busy={list.status === "loading"}>
          {list.status === "loading" && list.items.length === 0 && (
            <div className="fm-state" role="status"><div className="fm-spinner" /></div>
          )}
          {list.status === "error" && <p className="fm-stats__empty">Couldn&apos;t load this list. Try again in a moment.</p>}
          {list.status === "ready" && list.items.length === 0 && (
            <p className="fm-stats__empty">{TABS.find((t) => t.key === tab).empty}</p>
          )}

          {list.items.length > 0 && (
            <ul className="fm-stats__people">
              {list.items.map((item, index) => {
                const guest = isGuest(item.userName);
                const name = guest ? "Logged-out listener" : item.userName;
                let meta = null;
                if (tab === "views") meta = <>{item.viewCount || 1} {item.viewCount === 1 ? "play" : "plays"} · last {when(item.lastView)}</>;
                if (tab === "likes") meta = when(item.time);
                if (tab === "downloads") meta = when(item.downloadTime);
                if (tab === "comments") meta = when(item.time);
                return (
                  <li key={item.id || `${item.userName}-${index}`} className="fm-stats__person">
                    <img src={item.profilePic || DEFAULT_AVATAR} alt="" onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }} />
                    <div className="fm-stats__person-body">
                      <div className="fm-stats__person-top">
                        {guest ? <span className="fm-stats__name is-guest">{name}</span> : <a href={`/profile/${item.userName}`} className="fm-stats__name">{name}</a>}
                        {tab === "views" && !guest && likers.has(item.userName) && (
                          <span className="fm-stats__liked" title="Also liked this"><Icon name="heart" size={12} />Liked</span>
                        )}
                        <span className="fm-stats__meta">{meta}</span>
                      </div>
                      {tab === "comments" && <p className="fm-stats__comment">{item.comment}</p>}
                    </div>
                    {tab === "comments" && canModerate && item.id && (
                      <button
                        type="button"
                        className="fm-icon-btn"
                        onClick={() => deleteComment(item.id)}
                        disabled={deletingId === item.id}
                        aria-label={`Delete ${item.userName}'s comment`}
                        title="Delete comment"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <Pagination page={page} totalPages={list.totalPages} onChange={setPage} label={`${TABS.find((t) => t.key === tab).label} pages`} />
        </div>
      </div>
  );
}

// Same props as before, so the feed modal and post page keep working
function ViewsAnalytics({ postId, postTitle, isOpen, onClose, ...rest }) {
  return (
    <Dialog open={isOpen} onClose={onClose} title={postTitle ? `Analytics · ${postTitle}` : "Analytics"} size="lg">
      {isOpen && <PostAnalytics postId={postId} {...rest} />}
    </Dialog>
  );
}

export default ViewsAnalytics;
