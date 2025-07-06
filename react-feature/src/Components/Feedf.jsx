import React, { useEffect, useState, useRef } from "react";
import FeedItem from "./FeedItem";
import { listPosts } from "../services/PostsService";

// Dummy images
const DUMMY_BANNER = "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80";
const DUMMY_PROFILE = "https://randomuser.me/api/portraits/men/32.jpg";

// Genre to icon mapping (add more as needed)
const GENRE_ICONS = {
  Rock: "🎸",
  Pop: "🎤",
  Jazz: "🎷",
  HipHop: "🎧",
  Electronic: "🎹",
  Indie: "🌈",
  Classical: "🎻",
  Country: "🤠",
  Blues: "🎺",
  Default: "🎵"
};

function GenreBubbleScroll({ genreData, onSelect, dropdownOpen }) {
  return (
    <div className={`genre-bubble-dropdown-panel${dropdownOpen ? ' open' : ''}`}>
      <div className="genre-bubble-row">
        {genreData.map(({ genre, banner, profilePic }) => (
          <div className="genre-bubble-outer" key={genre}>
            <div className="genre-bubble-name">{genre}</div>
            <button
              className="genre-bubble"
              onClick={() => onSelect(genre)}
              title={genre}
              style={{ backgroundImage: `url('${banner || DUMMY_BANNER}')` }}
            >
              <span className="genre-bubble-profile">
                <img src={profilePic || DUMMY_PROFILE} alt="profile" />
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function GenreOverlay({ genre, posts, onClose }) {
  return (
    <div className="genre-overlay">
      <button className="genre-overlay-close" onClick={onClose}>&times;</button>
      <h2 className="genre-overlay-title">
        {GENRE_ICONS[genre] || GENRE_ICONS.Default} {genre}
      </h2>
      <div className="genre-overlay-grid">
        {posts.map((item) => (
          <FeedItem key={item.id} {...item} />
        ))}
      </div>
    </div>
  );
}

function Feedf() {
  const [posts, setPosts] = useState([]);
  const [genreOverlay, setGenreOverlay] = useState(null); // genre string or null
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const dropdownRef = useRef();

  useEffect(() => {
    listPosts().then((response) => {
      setPosts(response.data);
    }).catch(error => {
      console.error(error);
    })
  }, [])

  // Handle search function - can be connected to Spring Boot backend
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // TODO: Connect to Spring Boot backend
      // Example: searchPosts(searchQuery.trim()).then(response => setPosts(response.data))
      console.log('Searching for:', searchQuery.trim());
    }
  };

  // Handle search on Enter key press
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Extract unique genres and their first post's banner/profilePic
  const genreData = Array.from(
    new Map(
      posts
        .flatMap((p) => (Array.isArray(p.genre) ? p.genre : [p.genre]).filter(Boolean).map((g) => [g, p]))
    ).entries()
  ).map(([genre, post]) => ({
    genre,
    banner: post.author?.banner || DUMMY_BANNER,
    profilePic: post.author?.profilePic || DUMMY_PROFILE
  }));

  // Filter posts for selected genre
  const genrePosts = genreOverlay
    ? posts.filter((p) =>
        Array.isArray(p.genre)
          ? p.genre.includes(genreOverlay)
          : p.genre === genreOverlay
      )
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  return (
    <main className="feed-content">
      {/* Browse by Genre Section */}
      <section className="feed-section">
        <div className="genre-dropdown-container" ref={dropdownRef}>
          <button className={`genre-dropdown-toggle${dropdownOpen ? ' open' : ''}`} onClick={() => setDropdownOpen((v) => !v)}>
            <span role="img" aria-label="genre">🎼</span> Browse by Genre
            <span className="genre-dropdown-arrow">{dropdownOpen ? '▲' : '▼'}</span>
          </button>
          <GenreBubbleScroll genreData={genreData} onSelect={setGenreOverlay} dropdownOpen={dropdownOpen} />
        </div>
      </section>

      {/* Genre Overlay */}
      {genreOverlay && (
        <GenreOverlay genre={genreOverlay} posts={genrePosts} onClose={() => setGenreOverlay(null)} />
      )}

      {/* New Releases Section */}
      <section className="feed-section">
        <div className="section-header">
          <h2 className="section-title">New Releases</h2>
          <button className="section-more-btn">Show More</button>
        </div>
        <div className="feed-cards-grid">
          {posts.slice(0, 6).map((item) => (
            <FeedItem key={item.id} {...item} />
          ))}
        </div>
      </section>

      {/* All Posts Section with Search and Filter */}
      <section className="feed-section">
        <div className="section-header">
          <h2 className="section-title">All Posts</h2>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="feed-search-filter-bar">
          {/* Search Bar */}
          <div className="feed-search-container">
            <div className="feed-search-input-wrapper">
              <span className="feed-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search posts, artists, or songs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                className="feed-search-input"
              />
              {searchQuery && (
                <button 
                  className="feed-search-clear"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  ×
                </button>
              )}
              <button 
                className="feed-search-btn"
                onClick={handleSearch}
                title="Search"
                disabled={!searchQuery.trim()}
              >
                Search
              </button>
            </div>
          </div>

          {/* Genre Filter */}
          <div className="feed-genre-filter">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="feed-genre-select"
            >
              <option value="all">All Genres</option>
              {genreData.map(({ genre }) => (
                <option key={genre} value={genre}>
                  {GENRE_ICONS[genre] || GENRE_ICONS.Default} {genre}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="feed-sort-options">
            <select className="feed-sort-select">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Popular</option>
              <option value="trending">Trending</option>
            </select>
          </div>
        </div>

        <div className="feed-cards-grid">
          {posts.map((item) => (
            <FeedItem key={item.id} {...item} />
          ))}
        </div>
      </section>
    </main>
  );
}

export default Feedf;
