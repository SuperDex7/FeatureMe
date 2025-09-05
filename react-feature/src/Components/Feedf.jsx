import React, { useEffect, useState, useRef, use } from "react";
import FeedItem from "./FeedItem";
import { listPosts } from "../services/PostsService";
import api from "../services/AuthService";


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

function GenrePopup({ genreData, selectedGenres, onGenreToggle, onClose, isOpen }) {
  if (!isOpen) return null;

  // Define required genres
  const requiredGenres = ['Song', 'Beat', 'Loop', 'Instrument','Free', 'Paid', 'Open'];
  
  // Separate required and regular genres
  const requiredGenreData = requiredGenres.map(reqGenre => 
    genreData.find(({ genre }) => genre.toLowerCase() === reqGenre.toLowerCase())
  ).filter(Boolean); // Remove any undefined entries if genre not found
  
  const regularGenreData = genreData.filter(({ genre }) => 
    !requiredGenres.some(req => req.toLowerCase() === genre.toLowerCase())
  );

  const renderGenreItem = ({ genre, banner, profilePic }) => (
    <div 
      key={genre}
      className={`feed-genre-popup-item ${selectedGenres.includes(genre) ? 'selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onGenreToggle(genre);
      }}
    >
      <div 
        className="feed-genre-popup-banner"
        style={{ backgroundImage: `url('${banner || DUMMY_BANNER}')` }}
      >
        <div className="feed-genre-popup-overlay-bg"></div>
        <div className="feed-genre-popup-icon">
          {GENRE_ICONS[genre] || GENRE_ICONS.Default}
        </div>
        <div className="feed-genre-popup-name">{genre}</div>
      </div>
    </div>
  );

  return (
    <div className="feed-genre-popup-overlay" onClick={onClose}>
      <div className="feed-genre-popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="feed-genre-popup-header">
          <h3 className="feed-genre-popup-title">Select Genres</h3>
          <button className="feed-genre-popup-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="feed-genre-popup-body">
          {/* Required Genres Section */}
          {requiredGenreData.length > 0 && (
            <div className="feed-genre-popup-section">
              <h4 className="feed-genre-popup-section-title">Type</h4>
              <div className="feed-genre-popup-grid">
                {requiredGenreData.map(renderGenreItem)}
              </div>
            </div>
          )}
          
          {/* Regular Genres Section */}
          {regularGenreData.length > 0 && (
            <div className="feed-genre-popup-section">
              <h4 className="feed-genre-popup-section-title">Genres</h4>
              <div className="feed-genre-popup-grid">
                {regularGenreData.map(renderGenreItem)}
              </div>
            </div>
          )}
          
          <div className="feed-genre-popup-actions">
            <button 
              className="feed-genre-popup-clear-btn"
              onClick={(e) => {
                e.stopPropagation();
                selectedGenres.forEach(genre => onGenreToggle(genre));
              }}
            >
              Clear All
            </button>
            <button 
              className="feed-genre-popup-apply-btn"
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

function Feedf() {
  const [posts, setPosts] = useState([]);
  const [genreOverlay, setGenreOverlay] = useState(null); // genre string or null
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [size, setSize] = useState(6)
  const [page, setPage] = useState(0)
  const [searchSize, setSearchSize] = useState(6)
  const [searchPage, setSearchPage] = useState(0)
  const [searchPosts, setSearchPosts]= useState(null)
  const [sort, setSort] = useState('likes')
  const [totalPages, setTotalPages] = useState(0)
  const [totalSearchPages, setTotalSearchPages] = useState(0)

  const dropdownRef = useRef();
  const genreDropdownRef = useRef();



  useEffect(() => {
    api.get(`/posts/get?page=${page}&size=${size}`).then((response) => {
      setPosts(response.data.content);
      setTotalPages(response.data.page.totalPages -1)
      console.log(response.data)
    }).catch(error => {
      console.error(error);
    })
  }, [page, size])

  const nextPage = () =>{
    setPage(page+1)
  }
  const prevPage = () =>{
    setPage(page-1)
  }
  useEffect(()=>{
    handleSearch()
  }, [searchPage, sort])
  // Handle search function - can be connected to Spring Boot backend
  const handleSearch = () => {
    if (searchQuery.trim() || selectedGenres.length > 0) {
      const genreParam = selectedGenres.length > 0 ? selectedGenres.join(',') : "";
      const searchParam = searchQuery.trim() || "";
      console.log(searchPage)
      console.log(`/posts/get/advanced-search?page=${searchPage}&size=${searchSize}&search=${searchParam}&genres=${genreParam}&sortBy=${sort}`)
      api.get(`/posts/get/advanced-search?page=${searchPage}&size=${searchSize}&search=${searchParam}&genres=${genreParam}&sortBy=${sort}`).then((response) => {
        setSearchPosts(response.data.content);
        setTotalSearchPages(response.data.page.totalPages -1)
        console.log(response.data)
      }).catch(error => {
        console.error(error);
      })
      // TODO: Connect to Spring Boot backend
      // Example: searchPosts(searchQuery.trim()).then(response => setPosts(response.data))
      console.log('Searching for:', searchParam || 'genres only');
    }
  };

  // Handle search on Enter key press
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle genre selection/deselection
  const handleGenreToggle = (genre) => {
    setSelectedGenres(prev => {
      if (prev.includes(genre)) {
        // Remove genre if already selected
        return prev.filter(g => g !== genre);
      } else {
        // Add genre if not selected
        return [...prev, genre];
      }
    });
  };

  // Clear all selected genres
  const clearAllGenres = () => {
    setSelectedGenres([]);
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

  // Close genre dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      // Only close if popup is open and click is outside both the button and the popup
      if (isGenreDropdownOpen && 
          genreDropdownRef.current && 
          !genreDropdownRef.current.contains(e.target) &&
          !e.target.closest('.feed-genre-popup-overlay')) {
        setIsGenreDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isGenreDropdownOpen]);

  return (
    <main className="feed-content">
      {/* Browse by Genre Section 
      <section className="feed-section">
        <div className="genre-dropdown-container" ref={dropdownRef}>
          <button className={`genre-dropdown-toggle${dropdownOpen ? ' open' : ''}`} onClick={() => setDropdownOpen((v) => !v)}>
            <span role="img" aria-label="genre">🎼</span> Browse by Genre
            <span className="genre-dropdown-arrow">{dropdownOpen ? '▲' : '▼'}</span>
          </button>
          <GenreBubbleScroll genreData={genreData} onSelect={setGenreOverlay} dropdownOpen={dropdownOpen} />
        </div>
      </section>
*/}
      {/* Genre Overlay 
      {genreOverlay && (
        <GenreOverlay genre={genreOverlay} posts={genrePosts} onClose={() => setGenreOverlay(null)} />
      )}
*/}
      {/* Genre Popup */}
      <GenrePopup 
        genreData={genreData}
        selectedGenres={selectedGenres}
        onGenreToggle={handleGenreToggle}
        onClose={() => setIsGenreDropdownOpen(false)}
        isOpen={isGenreDropdownOpen}
      />

      {/* New Releases Section */}
      <section className="feed-section">
        <div className="section-header">
          <h2 className="section-title">New Releases</h2>
          
        </div>
        <div className="feed-cards-grid">
          {posts.slice(0, 6).map((item) => (
            <FeedItem key={item.id} {...item} />
          ))}
        </div>
        <div id="pageButtons">
        <button className="section-more-btn" onClick={prevPage} disabled={page == 0 }>Previous Page</button>
        <button className="section-more-btn" onClick={nextPage} disabled={page == totalPages}>Next Page</button>
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
                placeholder="Search posts"
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
                disabled={!searchQuery.trim() && selectedGenres.length === 0}
              >
                Search
              </button>
            </div>
          </div>

          {/* Multi-Select Genre Filter */}
          <div className="feed-genre-filter" ref={genreDropdownRef}>
            <div 
              className="feed-genre-select custom-genre-select"
              onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
              title={selectedGenres.length > 0 ? `Selected: ${selectedGenres.join(', ')}` : 'Click to select genres'}
            >
              <span className="genre-display">
                {selectedGenres.length === 0 ? (
                  "All Genres"
                ) : selectedGenres.length === 1 ? (
                  `${GENRE_ICONS[selectedGenres[0]] || GENRE_ICONS.Default} ${selectedGenres[0]}`
                ) : selectedGenres.length <= 3 ? (
                  selectedGenres.map(genre => `${GENRE_ICONS[genre] || GENRE_ICONS.Default} ${genre}`).join(', ')
                ) : (
                  `${selectedGenres.slice(0, 2).map(genre => `${GENRE_ICONS[genre] || GENRE_ICONS.Default} ${genre}`).join(', ')} +${selectedGenres.length - 2} more`
                )}
              </span>
              <span className="dropdown-arrow">▼</span>
            </div>
          </div>

          {/* Sort Options */}
          <div className="feed-sort-options">
            <select 
              className="feed-sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="likes">Most Popular</option>
              <option value="time">Newest First</option>
              
            </select>
          </div>
        </div>

        <div className="feed-cards-grid">
          {searchPosts?.map((item) => (
            <FeedItem key={item.id} {...item} />
          ))|| "Search For Something"}
        </div>
                 <div id="pageButtons">
         <button className="section-more-btn" onClick={() => setSearchPage(searchPage - 1)} hidden={totalSearchPages < 2 ? true:false}  disabled={searchPage == 0 || searchPage == null}>Previous Page</button>
         <button className="section-more-btn" onClick={() => setSearchPage(searchPage + 1)} hidden={totalSearchPages < 2 ? true:false}  disabled={searchPage == totalSearchPages || searchPage == null}>Next Page</button>
         </div>
      </section>
    </main>
  );
}

export default Feedf;
