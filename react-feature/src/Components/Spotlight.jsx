import "./Spotlight.css";
import { useState, useEffect } from "react";
import SpotlightItem from "./SpotlightItem";
import api from "../services/AuthService";

// Enhanced genre to icon mapping with premium styling
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
  "R&B": "🎵",
  Alternative: "🌙",
  Folk: "🌿",
  Reggae: "🌴",
  Default: "🎵"
};

function Spotlight() {
  const [spotlightPosts, setSpotlightPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState(6);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  useEffect(() => {
    fetchPosts();
  }, [size, page]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Fetch posts filtered by USERPLUS role for spotlight
      const response = await api.get(`/posts/get/likesdesc/role/USERPLUS?page=${page}&size=${size}`);
      const posts = response.data.content || [];
      setSpotlightPosts(posts);
      setTotalPages(response.data.page.totalPages - 1);
    } catch (error) {
      console.error('Error fetching spotlight posts:', error);
      // Fallback to regular posts if role filtering fails
      try {
        const fallbackResponse = await api.get(`/posts/get/likesdesc?page=${page}&size=${size}`);
        const fallbackPosts = fallbackResponse.data.content || [];
        setSpotlightPosts(fallbackPosts);
        setTotalPages(fallbackResponse.data.page.totalPages - 1);
      } catch (fallbackError) {
        console.error('Error fetching fallback posts:', fallbackError);
      }
    }
    setLoading(false);
  };

  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const getTopPostsOverall = (count = 8) => {
    return spotlightPosts
      .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
      .slice(0, count);
  };

  if (loading) {
    return (
      <div className="spotlight-container">
        <div className="spotlight-hero">
          <div className="spotlight-loading">
            <div className="spotlight-loading-spinner"></div>
            <p>Loading Premium Content...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="spotlight-container">
      {/* Hero Section */}
      <div className="spotlight-hero">
        <div className="spotlight-hero-content">
          <div className="spotlight-hero-text">
            <h1 className="spotlight-hero-title">
              <span className="spotlight-hero-icon">✨</span>
              Premium Spotlight
            </h1>
            <p className="spotlight-hero-subtitle">
              Discover the most exceptional content from our Plus creators
            </p>
          </div>
          <div className="spotlight-hero-stats">
            <div className="spotlight-stat">
              <span className="spotlight-stat-number">{spotlightPosts.length}</span>
              <span className="spotlight-stat-label">Premium Posts</span>
            </div>
            <div className="spotlight-stat">
              <span className="spotlight-stat-number">{totalPages + 1}</span>
              <span className="spotlight-stat-label">Pages</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="spotlight-controls">
        <div className="spotlight-controls-center">
          {/* View Mode Toggle */}
          <div className="spotlight-view-toggle">
            <button 
              className={`spotlight-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <span>⊞</span>
            </button>
            <button 
              className={`spotlight-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <span>☰</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="spotlight-content">
        <div className="spotlight-section">
          <div className="spotlight-section-header">
            <h2 className="spotlight-section-title">
              <span className="spotlight-section-icon">⭐</span>
              Premium Creator Spotlight
            </h2>
            <p className="spotlight-section-subtitle">
              The finest content from our Plus subscribers
            </p>
          </div>
          <div className={`spotlight-cards-${viewMode}`}>
            {getTopPostsOverall().map((item) => (
              <SpotlightItem 
                key={item.id + '-' + item.title} 
                {...item} 
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="spotlight-pagination">
        <button 
          className="spotlight-page-btn"
          onClick={prevPage} 
          disabled={page === 0}
        >
          <span>←</span>
          Previous
        </button>
        
        <div className="spotlight-page-info">
          <span>Page {page + 1} of {totalPages + 1}</span>
        </div>
        
        <button 
          className="spotlight-page-btn"
          onClick={nextPage} 
          disabled={page === totalPages}
        >
          Next
          <span>→</span>
        </button>
      </div>
    </div>
  );
}

export default Spotlight;
