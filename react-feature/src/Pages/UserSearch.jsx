import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import AudioPlayer2 from "../Components/AudioPlayer2";
import Icon from "../Components/ui/Icon";
import Pagination from "../Components/ui/Pagination";
import PlusBadge from "../Components/ui/PlusBadge";
import api, { getCurrentUser } from "../services/AuthService";
import { UserRelationsService } from "../services/UserService";
import DemoService from "../services/DemoService";
import { bannerStyle } from "../utils/banner";
import "../Styling/SearchPage.css";

const DEFAULT_AVATAR = "/dpp.jpg";
const PAGE_SIZE = 12;

const countLabel = (n, word) => `${n ?? 0} ${n === 1 ? word : `${word}s`}`;

// Find artists by username. The header's search box links here with ?q=term.
function UserSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const urlTerm = new URLSearchParams(location.search).get("q") || "";

  const [term, setTerm] = useState(urlTerm);
  const [query, setQuery] = useState(urlTerm.trim()); // what the results are for
  const [page, setPage] = useState(0);
  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [status, setStatus] = useState(urlTerm.trim() ? "loading" : "idle"); // idle | loading | ready | error
  const [suggestions, setSuggestions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [following, setFollowing] = useState({});
  const [pendingFollow, setPendingFollow] = useState(null);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [loadingDemo, setLoadingDemo] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const requestRef = useRef(0);

  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
    UserRelationsService.getFriendSuggestions(8)
      .then((res) => setSuggestions(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSuggestions([]));
  }, []);

  // Searching again from the header while already on this page
  useEffect(() => {
    // Keep what's typed (e.g. a trailing space mid-word) if it already matches
    setTerm((prev) => (prev.trim() === urlTerm.trim() ? prev : urlTerm));
    setQuery(urlTerm.trim());
    setPage(0);
  }, [urlTerm]);

  // Wait for a pause in typing, then search and keep the URL in sync
  useEffect(() => {
    const next = term.trim();
    if (next === query) return undefined;
    const timer = setTimeout(() => {
      setQuery(next);
      setPage(0);
      navigate(next ? `/user-search?q=${encodeURIComponent(next)}` : "/user-search", { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [term, query, navigate]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setStatus("idle");
      return;
    }
    const requestId = ++requestRef.current;
    setStatus("loading");
    api.get(`/user/get/search/${encodeURIComponent(query)}?page=${page}&size=${PAGE_SIZE}`)
      .then(({ data }) => {
        // Ignore answers to searches the user has already typed past
        if (requestId !== requestRef.current) return;
        setResults(data.content || []);
        setTotalPages(data.page?.totalPages || 0);
        setTotalResults(data.page?.totalElements ?? (data.content || []).length);
        setStatus("ready");
      })
      .catch((err) => {
        if (requestId !== requestRef.current) return;
        console.error("Error searching users:", err);
        setStatus("error");
      });
  }, [query, page, retryKey]);

  // Who on screen you already follow
  useEffect(() => {
    if (!currentUser) return;
    const people = [...results, ...suggestions].filter((u) => u.userName !== currentUser.userName && following[u.userName] === undefined);
    if (people.length === 0) return;
    Promise.all(people.map((u) => UserRelationsService.isFollowing(u.userName)
      .then((res) => [u.userName, res.data === true])
      .catch(() => [u.userName, false])))
      .then((pairs) => setFollowing((prev) => ({ ...prev, ...Object.fromEntries(pairs) })));
    // following is read only to skip names already checked
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, results, suggestions]);

  const toggleFollow = async (userName) => {
    if (!currentUser || pendingFollow) return;
    const was = Boolean(following[userName]);
    const bump = (list) => list.map((u) => (u.userName === userName
      ? { ...u, followersCount: Math.max(0, (u.followersCount || 0) + (was ? -1 : 1)) }
      : u));
    setPendingFollow(userName);
    setFollowing((prev) => ({ ...prev, [userName]: !was }));
    setResults(bump);
    setSuggestions(bump);
    try {
      const { data } = await UserRelationsService.toggleFollow(userName);
      const now = String(data) === "Followed";
      if (now === was) {
        // The server disagreed; show what it says
        setFollowing((prev) => ({ ...prev, [userName]: now }));
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
      setFollowing((prev) => ({ ...prev, [userName]: was }));
      setResults((list) => list.map((u) => (u.userName === userName
        ? { ...u, followersCount: Math.max(0, (u.followersCount || 0) + (was ? 1 : -1)) }
        : u)));
    } finally {
      setPendingFollow(null);
    }
  };

  const playDemo = async (user) => {
    const demoId = user.demo?.[0];
    if (!demoId) return;
    setLoadingDemo(user.userName);
    try {
      const demo = await DemoService.getDemoById(demoId);
      if (demo?.songUrl) setNowPlaying({ key: `${user.userName}-${demoId}`, user, url: demo.songUrl, title: demo.title || `${user.userName}'s demo` });
    } catch (err) {
      console.error("Error loading demo:", err);
    } finally {
      setLoadingDemo(null);
    }
  };

  const changePage = (next) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cardProps = { currentUser, following, pendingFollow, onFollow: toggleFollow, onPlay: playDemo, loadingDemo, nowPlaying };

  return (
    <div className="fm-page">
      <Header />

      <main className={`fm-page__main${nowPlaying ? " fm-search--playing" : ""}`}>
        <div className="fm-search">
          <div className="fm-search__intro">
            <h1 className="fm-search__title">Find artists</h1>
            <p className="fm-search__subtitle">Search by username to find people to follow, message and feature with.</p>
          </div>

          <form className="fm-search__form" role="search" onSubmit={(e) => { e.preventDefault(); setQuery(term.trim()); setPage(0); }}>
            <Icon name="search" size={22} />
            <label className="fm-visually-hidden" htmlFor="fm-search-input">Search artists</label>
            <input
              id="fm-search-input"
              type="search"
              className="fm-search__input"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by username"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
            />
            {status === "loading" && <span className="fm-mini-spinner" aria-label="Searching" />}
          </form>

          {status === "idle" && (
            suggestions.length > 0 ? (
              <section className="fm-search__section" aria-labelledby="fm-search-suggested">
                <h2 id="fm-search-suggested" className="fm-search__section-title">Artists you might like</h2>
                <ul className="fm-search__grid">
                  {suggestions.map((user) => <ArtistCard key={user.userName} user={user} {...cardProps} />)}
                </ul>
              </section>
            ) : (
              <div className="fm-state">
                <span className="fm-search__state-icon"><Icon name="search" size={26} /></span>
                <h3>Search for artists</h3>
                <p>Type a username above to get started.</p>
              </div>
            )
          )}

          {status === "loading" && results.length === 0 && (
            <div className="fm-state" role="status">
              <div className="fm-spinner" />
              <p>Searching…</p>
            </div>
          )}

          {status === "error" && (
            <div className="fm-state" role="alert">
              <h3>Search didn&apos;t work</h3>
              <p>Check your connection and try again.</p>
              <button type="button" className="fm-btn fm-btn--secondary" onClick={() => setRetryKey((k) => k + 1)}>Retry</button>
            </div>
          )}

          {(status === "ready" || (status === "loading" && results.length > 0)) && (
            results.length > 0 ? (
              <section className="fm-search__section" aria-labelledby="fm-search-results" aria-busy={status === "loading"}>
                <h2 id="fm-search-results" className="fm-search__section-title" aria-live="polite">
                  {countLabel(totalResults, "artist")} matching &ldquo;{query}&rdquo;
                </h2>
                <ul className="fm-search__grid">
                  {results.map((user) => <ArtistCard key={user.userName} user={user} {...cardProps} />)}
                </ul>
                <Pagination page={page} totalPages={totalPages} onChange={changePage} label="Search result pages" />
              </section>
            ) : (
              <div className="fm-state">
                <h3>No artists match &ldquo;{query}&rdquo;</h3>
                <p>Check the spelling, or try part of the name.</p>
              </div>
            )
          )}
        </div>
      </main>

      {nowPlaying && (
        <div className="fm-search__player" role="region" aria-label="Now playing">
          <div className="fm-search__player-inner">
            <a href={`/profile/${nowPlaying.user.userName}`} className="fm-search__player-artist">
              <img src={nowPlaying.user.profilePic || DEFAULT_AVATAR} alt="" />
              <span>
                <span className="fm-search__player-label">Demo by</span>
                <span className="fm-search__player-name">{nowPlaying.user.userName}</span>
              </span>
            </a>
            <div className="fm-search__player-controls">
              <AudioPlayer2 key={nowPlaying.key} src={nowPlaying.url} title={nowPlaying.title} onClose={() => setNowPlaying(null)} />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function ArtistCard({ user, currentUser, following, pendingFollow, onFollow, onPlay, loadingDemo, nowPlaying }) {
  const isMe = currentUser?.userName === user.userName;
  const isFollowing = Boolean(following[user.userName]);
  const hasDemo = Array.isArray(user.demo) && user.demo.length > 0;
  const isPlaying = nowPlaying?.user.userName === user.userName;

  return (
    <li className="fm-artist-card">
      <a href={`/profile/${user.userName}`} className="fm-artist-card__link">
        <span className="fm-artist-card__banner" style={bannerStyle(user)} aria-hidden="true" />
        <span className="fm-artist-card__head">
          <img className="fm-artist-card__avatar" src={user.profilePic || DEFAULT_AVATAR} alt="" />
          <span className="fm-artist-card__name">
            {user.userName}
            {user.role === "USERPLUS" && <PlusBadge size={16} />}
          </span>
          {user.location && (
            <span className="fm-artist-card__location"><Icon name="pin" size={14} />{user.location}</span>
          )}
        </span>
        {user.bio && <span className="fm-artist-card__bio">{user.bio}</span>}
        <span className="fm-artist-card__stats">
          <span><strong>{user.followersCount || 0}</strong> {user.followersCount === 1 ? "follower" : "followers"}</span>
          <span><strong>{user.postsCount || 0}</strong> {user.postsCount === 1 ? "post" : "posts"}</span>
        </span>
      </a>
      <div className="fm-artist-card__actions">
        {currentUser && !isMe && (
          <button
            type="button"
            className={`fm-btn ${isFollowing ? "fm-btn--secondary" : "fm-btn--primary"}`}
            onClick={() => onFollow(user.userName)}
            disabled={pendingFollow === user.userName}
            aria-pressed={isFollowing}
          >
            {isFollowing ? <><Icon name="check" size={16} strokeWidth={2.4} />Following</> : "Follow"}
          </button>
        )}
        {isMe && <a href={`/profile/${user.userName}`} className="fm-btn fm-btn--secondary">Your profile</a>}
        {hasDemo && (
          <button
            type="button"
            className="fm-btn fm-btn--secondary"
            onClick={() => onPlay(user)}
            disabled={loadingDemo === user.userName || isPlaying}
            aria-label={`Play ${user.userName}'s demo`}
          >
            <Icon name={isPlaying ? "volume" : "play"} size={16} />
            {loadingDemo === user.userName ? "Loading…" : isPlaying ? "Playing" : "Demo"}
          </button>
        )}
      </div>
    </li>
  );
}

export default UserSearch;
