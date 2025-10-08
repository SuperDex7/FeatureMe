import React, { useEffect, useState, useRef } from "react";
import FeedItem from "./FeedItem";
import { listPosts } from "../services/PostsService";
import api from "../services/AuthService";
import "../Styling/FeedItem2.css";

// Dummy images
const DUMMY_BANNER = "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80";
const DUMMY_PROFILE = "https://randomuser.me/api/portraits/men/32.jpg";

// Genre to icon mapping
const GENRE_ICONS = {
  Rock: "🎸",
  Punk: "🧷",
  Pop: "🎤",
  Jazz: "🎷",
  "Hip Hop": "🎧",
  Trap: "🔊",
  Drill: "🛠️",
  Electronic: "🎹",
  Afrobeat: "🥁",
  Indie: "🌈",
  Classical: "🎻",
  Country: "🤠",
  Blues: "🎺",
  Underground: "🕳️",
  Sample: "🧰",
  Acapella: "🎙️",
  "R&B": "🎧",
  Default: "🎵"
};

// Normalize genre names and provide a robust icon lookup
function getGenreIcon(genre) {
  if (!genre) return GENRE_ICONS.Default;
  const lower = String(genre).toLowerCase();
  if (lower === 'hiphop' || lower === 'hip-hop') return GENRE_ICONS['Hip Hop'];
  if (lower === 'r&b' || lower === 'rnb') return GENRE_ICONS['R&B'];
  if (lower === 'afrobeats') return GENRE_ICONS['Afrobeat'];
  return GENRE_ICONS[genre] || GENRE_ICONS[genre?.trim()] || GENRE_ICONS.Default;
}

function GenreFilterModal({ isOpen, onClose, genreData, selectedGenres, onGenreToggle }) {
  if (!isOpen) return null;

  const requiredGenres = ['Song', 'Beat', 'Loop', 'Instrument', 'Sample', 'Acapella', 'Free', 'Paid', 'Open'];
  
  const requiredGenreData = requiredGenres.map(reqGenre => 
    genreData.find(({ genre }) => genre.toLowerCase() === reqGenre.toLowerCase())
  ).filter(Boolean);
  
  const regularGenreData = genreData.filter(({ genre }) => 
    !requiredGenres.some(req => req.toLowerCase() === genre.toLowerCase())
  );

  const renderGenreItem = ({ genre, banner, profilePic }) => (
    <div 
      key={genre}
      className={`posts-genre-modal-item ${selectedGenres.includes(genre) ? 'posts-selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onGenreToggle(genre);
      }}
    >
      <div 
        className="posts-genre-modal-banner"
        style={{ backgroundImage: `url('${banner || DUMMY_BANNER}')` }}
      >
        <div className="posts-genre-modal-banner-overlay"></div>
        <div className="posts-genre-modal-icon">{getGenreIcon(genre)}</div>
        <div className="posts-genre-modal-name">{genre}</div>
      </div>
    </div>
  );

  return (
    <div className="posts-genre-modal-overlay" onClick={onClose}>
      <div className="posts-genre-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="posts-genre-modal-header">
          <h3 className="posts-genre-modal-title">Filter by Genre</h3>
          <button className="posts-genre-modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="posts-genre-modal-body">
          {requiredGenreData.length > 0 && (
            <div className="posts-genre-modal-section">
              <h4 className="posts-genre-modal-section-title">Type</h4>
              <div className="posts-genre-modal-grid">
                {requiredGenreData.map(renderGenreItem)}
              </div>
            </div>
          )}
          
          {regularGenreData.length > 0 && (
            <div className="posts-genre-modal-section">
              <h4 className="posts-genre-modal-section-title">Genres</h4>
              <div className="posts-genre-modal-grid">
                {regularGenreData.map(renderGenreItem)}
              </div>
            </div>
          )}
          
          <div className="posts-genre-modal-actions">
            <button 
              className="posts-genre-modal-clear-btn"
              onClick={(e) => {
                e.stopPropagation();
                selectedGenres.forEach(genre => onGenreToggle(genre));
              }}
            >
              Clear All
            </button>
            <button 
              className="posts-genre-modal-apply-btn"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feed2() {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);
  const [size, setSize] = useState(6);
  const [page, setPage] = useState(0);
  const [searchSize, setSearchSize] = useState(6);
  const [searchPage, setSearchPage] = useState(0);
  const [searchPosts, setSearchPosts] = useState(null);
  const [sort, setSort] = useState('likes');
  const [totalPages, setTotalPages] = useState(0);
  const [totalSearchPages, setTotalSearchPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const genreModalRef = useRef();

  useEffect(() => {
    fetchPosts();
  }, [page, size]);

  useEffect(() => {
    if (searchQuery.trim() || selectedGenres.length > 0) {
      handleSearch();
    }
  }, [searchPage, sort]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/posts/get?page=${page}&size=${size}`);
      setPosts(response.data.content);
      setTotalPages(response.data.page.totalPages - 1);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && selectedGenres.length === 0) return;
    
    setIsLoading(true);
    try {
      const genreParam = selectedGenres.length > 0 ? selectedGenres.join(',') : "";
      const searchParam = searchQuery.trim() || "";
      const response = await api.get(
        `/posts/get/advanced-search?page=${searchPage}&size=${searchSize}&search=${searchParam}&genres=${genreParam}&sortBy=${sort}`
      );
      setSearchPosts(response.data.content);
      setTotalSearchPages(response.data.page.totalPages - 1);
    } catch (error) {
      console.error('Error searching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleGenreToggle = (genre) => {
    setSelectedGenres(prev => {
      if (prev.includes(genre)) {
        return prev.filter(g => g !== genre);
      } else {
        return [...prev, genre];
      }
    });
  };

  const clearAllGenres = () => {
    setSelectedGenres([]);
  };

  const nextPage = () => {
    setPage(page + 1);
  };

  const prevPage = () => {
    setPage(page - 1);
  };

  const nextSearchPage = () => {
    setSearchPage(searchPage + 1);
  };

  const prevSearchPage = () => {
    setSearchPage(searchPage - 1);
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

  // Close genre modal on outside click
  useEffect(() => {
    function handleClick(e) {
      if (isGenreModalOpen && 
          genreModalRef.current && 
          !genreModalRef.current.contains(e.target) &&
          !e.target.closest('.posts-genre-modal-overlay')) {
        setIsGenreModalOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isGenreModalOpen]);

  return (
    <main className="posts-main-container">
      <GenreFilterModal
        isOpen={isGenreModalOpen}
        onClose={() => setIsGenreModalOpen(false)}
        genreData={genreData}
        selectedGenres={selectedGenres}
        onGenreToggle={handleGenreToggle}
      />

      {/* Search and Filter Section */}
      <section className="posts-search-section">
        <div className="posts-search-container">
          <div className="posts-search-bar">
            <div className="posts-search-input-group">
              <span className="posts-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search for tracks, artists, or genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                className="posts-search-input"
              />
              {searchQuery && (
                <button 
                  className="posts-search-clear"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  ×
                </button>
              )}
              <button 
                className="posts-search-btn"
                onClick={handleSearch}
                title="Search"
                disabled={!searchQuery.trim() && selectedGenres.length === 0}
              >
                Search
              </button>
            </div>
          </div>

          <div className="posts-filter-group">
            <div className="posts-genre-filter" ref={genreModalRef}>
              <button 
                className="posts-genre-select"
                onClick={() => setIsGenreModalOpen(!isGenreModalOpen)}
                title={selectedGenres.length > 0 ? `Selected: ${selectedGenres.join(', ')}` : 'Click to select genres'}
              >
                <span className="posts-genre-display">
                  {selectedGenres.length === 0 ? (
                    "All Genres"
                  ) : selectedGenres.length === 1 ? (
                    `${getGenreIcon(selectedGenres[0])} ${selectedGenres[0]}`
                  ) : selectedGenres.length <= 3 ? (
                    selectedGenres.map(genre => `${getGenreIcon(genre)} ${genre}`).join(', ')
                  ) : (
                    `${selectedGenres.slice(0, 2).map(genre => `${getGenreIcon(genre)} ${genre}`).join(', ')} +${selectedGenres.length - 2} more`
                  )}
                </span>
                <span className="posts-dropdown-arrow">▼</span>
              </button>
            </div>

            <div className="posts-sort-filter">
              <select 
                className="posts-sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="likes">Most Popular</option>
                <option value="time">Newest First</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results Section - Show first when searching */}
      {(searchQuery.trim() || selectedGenres.length > 0) && (
        <section className="posts-search-results-section">
          <div className="posts-section-header">
            <h2 className="posts-section-title">
              <span className="posts-section-icon">🎵</span>
              Search Results
            </h2>
            <p className="posts-section-description">
              {searchQuery.trim() && `Results for "${searchQuery}"`}
              {selectedGenres.length > 0 && ` • Filtered by: ${selectedGenres.join(', ')}`}
            </p>
          </div>
          
          {isLoading ? (
            <div className="posts-loading">
              <div className="posts-spinner"></div>
              <p>Searching...</p>
            </div>
          ) : (
            <div className="posts-grid">
              {searchPosts?.length > 0 ? (
                searchPosts.map((item) => (
                  <FeedItem key={item.id} {...item} />
                ))
              ) : (
                <div className="posts-no-results">
                  <div className="posts-no-results-icon">🔍</div>
                  <h3>No results found</h3>
                  <p>Try adjusting your search terms or filters</p>
                  <button 
                    className="posts-clear-search-btn"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedGenres([]);
                      setSearchPosts(null);
                    }}
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          )}

          {searchPosts?.length > 0 && totalSearchPages >= 1 && (
            <div className="posts-pagination">
              <button 
                className="posts-pagination-btn posts-prev-btn" 
                onClick={prevSearchPage} 
                disabled={searchPage === 0}
              >
                ← Previous
              </button>
              <span className="posts-pagination-info">
                Page {searchPage + 1} of {totalSearchPages + 1}
              </span>
              <button 
                className="posts-pagination-btn posts-next-btn" 
                onClick={nextSearchPage} 
                disabled={searchPage === totalSearchPages}
              >
                Next →
              </button>
            </div>
          )}
        </section>
      )}

      {/* Featured Section - Show when not searching */}
      {!searchQuery.trim() && selectedGenres.length === 0 && (
        <section className="posts-featured-section">
          <div className="posts-section-header">
            <h2 className="posts-section-title">
              <span className="posts-section-icon">⭐</span>
              Most Recent Tracks
            </h2>
            <p className="posts-section-description">Tracks that just dropped</p>
          </div>
          
          {isLoading ? (
            <div className="posts-loading">
              <div className="posts-spinner"></div>
              <p>Loading featured tracks...</p>
            </div>
          ) : (
            <div className="posts-grid">
              {posts.slice(0, 6).map((item) => (
                <FeedItem key={item.id} {...item} />
              ))}
            </div>
          )}

          <div className="posts-pagination">
            <button 
              className="posts-pagination-btn posts-prev-btn" 
              onClick={prevPage} 
              disabled={page === 0}
            >
              ← Previous
            </button>
            <span className="posts-pagination-info">
              Page {page + 1} of {totalPages + 1}
            </span>
            <button 
              className="posts-pagination-btn posts-next-btn" 
              onClick={nextPage} 
              disabled={page === totalPages}
            >
              Next →
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default Feed2;
