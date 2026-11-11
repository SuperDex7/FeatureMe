import { useEffect, useState, useRef, useCallback } from "react";
import FeedItem from "./FeedItem";
import Icon from "./ui/Icon";
import api, { getCurrentUser } from "../services/AuthService";
import { POST_TYPES, MUSIC_GENRES } from "../constants/genres";
import "../Styling/Feed2.css";

const PAGE_SIZE = 6;

const SORTS = [
  { id: "time", label: "Newest" },
  { id: "likes", label: "Most liked" },
];

function GenreFilterDialog({ isOpen, onClose, selectedGenres, onGenreToggle, onClear }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    closeRef.current?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderGroup = (label, items) => (
    <fieldset className="fm-filter-dialog__group">
      <legend>{label}</legend>
      <div className="fm-filter-dialog__chips">
        {items.map((genre) => (
          <button
            key={genre}
            type="button"
            className="fm-chip"
            aria-pressed={selectedGenres.includes(genre)}
            onClick={() => onGenreToggle(genre)}
          >
            {genre}
          </button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="fm-modal-overlay" onClick={onClose}>
      <div
        className="fm-filter-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fm-filter-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fm-filter-dialog__head">
          <h2 id="fm-filter-dialog-title">Filter posts</h2>
          <button ref={closeRef} type="button" className="fm-icon-btn" onClick={onClose} aria-label="Close filters">
            <Icon name="close" />
          </button>
        </div>
        <div className="fm-filter-dialog__body">
          {renderGroup("Type", POST_TYPES)}
          {renderGroup("Genre", MUSIC_GENRES)}
        </div>
        <div className="fm-filter-dialog__actions">
          <button type="button" className="fm-btn fm-btn--secondary" onClick={onClear} disabled={selectedGenres.length === 0}>
            Clear all
          </button>
          <button type="button" className="fm-btn fm-btn--primary" onClick={onClose}>
            {selectedGenres.length > 0 ? `Show results (${selectedGenres.length} selected)` : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onChange, label }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="fm-feed__pagination" aria-label={label}>
      <button type="button" className="fm-btn fm-btn--secondary" onClick={() => onChange(page - 1)} disabled={page === 0}>
        <Icon name="chevronLeft" size={18} />
        Previous
      </button>
      <span className="fm-feed__page-info">Page {page + 1} of {totalPages}</span>
      <button type="button" className="fm-btn fm-btn--secondary" onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1}>
        Next
        <Icon name="chevronRight" size={18} />
      </button>
    </nav>
  );
}

function Feed2() {
  // null until loaded (also when logged out); cards use this instead of each fetching it
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sort, setSort] = useState("time");

  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchPosts, setSearchPosts] = useState([]);
  const [searchPage, setSearchPage] = useState(0);
  const [totalSearchPages, setTotalSearchPages] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isSearching = activeQuery.trim() !== "" || selectedGenres.length > 0;

  // Logged-in user, loaded once for every card on the page
  useEffect(() => {
    getCurrentUser().then((user) => setCurrentUser(user || null));
  }, []);

  // Default feed: newest (/posts/get) or most liked (/posts/get/likesdesc)
  useEffect(() => {
    if (isSearching) return;
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const endpoint = sort === "likes" ? "/posts/get/likesdesc" : "/posts/get";
        const response = await api.get(`${endpoint}?page=${page}&size=${PAGE_SIZE}`);
        if (cancelled) return;
        setPosts(response.data.content || []);
        setTotalPages(response.data.page?.totalPages || 0);
      } catch (err) {
        if (!cancelled) setError("Couldn't load posts. Please try again.");
        console.error("Error fetching posts:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page, sort, isSearching]);

  // Search / filter results
  useEffect(() => {
    if (!isSearching) return;
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(searchPage),
          size: String(PAGE_SIZE),
          search: activeQuery.trim(),
          genres: selectedGenres.join(","),
          sortBy: sort,
        });
        const response = await api.get(`/posts/get/advanced-search?${params}`);
        if (cancelled) return;
        setSearchPosts(response.data.content || []);
        setTotalSearchPages(response.data.page?.totalPages || 0);
      } catch (err) {
        if (!cancelled) setError("Search failed. Please try again.");
        console.error("Error searching posts:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isSearching, activeQuery, selectedGenres, searchPage, sort]);

  const submitSearch = (event) => {
    event.preventDefault();
    setSearchPage(0);
    setActiveQuery(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setActiveQuery("");
    setSelectedGenres([]);
    setSearchPage(0);
  };

  const toggleGenre = (genre) => {
    setSearchPage(0);
    setSelectedGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]));
  };

  const changeSort = (nextSort) => {
    setSort(nextSort);
    setPage(0);
    setSearchPage(0);
  };

  const closeFilters = useCallback(() => setIsFilterOpen(false), []);

  const list = isSearching ? searchPosts : posts;

  return (
    <section className="fm-feed" aria-label="Posts">
      <div className="fm-feed__toolbar">
        <form className="fm-feed__search" role="search" onSubmit={submitSearch}>
          <Icon name="search" size={18} />
          <label className="fm-visually-hidden" htmlFor="fm-feed-search">Search posts</label>
          <input
            id="fm-feed-search"
            type="search"
            placeholder="Search tracks, artists or genres"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="fm-btn fm-btn--secondary fm-feed__search-submit">Search</button>
        </form>

        <button
          type="button"
          className={`fm-chip${selectedGenres.length > 0 ? " is-active" : ""}`}
          onClick={() => setIsFilterOpen(true)}
          aria-haspopup="dialog"
        >
          <Icon name="filter" size={16} />
          {selectedGenres.length > 0 ? `Filters (${selectedGenres.length})` : "Filters"}
        </button>

        <div className="fm-segmented" role="group" aria-label="Sort posts">
          {SORTS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`fm-segment${sort === option.id ? " is-active" : ""}`}
              aria-pressed={sort === option.id}
              onClick={() => changeSort(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isSearching && (
        <div className="fm-feed__active-filters">
          <span className="fm-feed__results-label">
            {activeQuery.trim() ? <>Results for &ldquo;{activeQuery.trim()}&rdquo;</> : "Filtered posts"}
          </span>
          {selectedGenres.map((genre) => (
            <button key={genre} type="button" className="fm-chip is-active" onClick={() => toggleGenre(genre)} aria-label={`Remove ${genre} filter`}>
              {genre}
              <Icon name="close" size={14} />
            </button>
          ))}
          <button type="button" className="fm-feed__clear" onClick={clearSearch}>Clear search</button>
        </div>
      )}

      {isLoading ? (
        <div className="fm-state" role="status">
          <div className="fm-spinner" aria-hidden="true" />
          <p>{isSearching ? "Searching..." : "Loading posts..."}</p>
        </div>
      ) : error ? (
        <div className="fm-state" role="alert">
          <h3>Something went wrong</h3>
          <p>{error}</p>
        </div>
      ) : list.length === 0 ? (
        <div className="fm-state">
          <h3>{isSearching ? "No posts match" : "No posts yet"}</h3>
          <p>{isSearching ? "Try different words or remove some filters." : "New tracks will show up here."}</p>
          {isSearching && (
            <button type="button" className="fm-btn fm-btn--secondary" onClick={clearSearch}>Clear search</button>
          )}
        </div>
      ) : (
        <div className="fm-feed__list">
          {list.map((item) => (
            <FeedItem key={item.id} {...item} currentUser={currentUser} />
          ))}
        </div>
      )}

      {!isLoading && !error && (
        isSearching ? (
          <Pagination page={searchPage} totalPages={totalSearchPages} onChange={setSearchPage} label="Search results pages" />
        ) : (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} label="Feed pages" />
        )
      )}

      <GenreFilterDialog
        isOpen={isFilterOpen}
        onClose={closeFilters}
        selectedGenres={selectedGenres}
        onGenreToggle={toggleGenre}
        onClear={() => { setSelectedGenres([]); setSearchPage(0); }}
      />
    </section>
  );
}

export default Feed2;
