import React, { useState, useEffect } from "react";
import api, { getCurrentUser } from "../services/AuthService";
import LikedPosts2Item from "./LikedPostsItem";
import "./LikedPosts.css";

function LikedPosts() {
  const [user, setUser] = useState(null);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState(8);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLikedPosts, setTotalLikedPosts] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  // Removed stats - no longer needed for liked posts

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user && user.likedPosts) {
      fetchLikedPosts();
    } else if (user && !user.likedPosts) {
      setLoading(false);
      setLikedPosts([]);
    }
  }, [user, page, size]);

  const fetchLikedPosts = async () => {
    setLoading(true);
    try {
      const endpoint = `/posts/get/all/id/${user.likedPosts}?page=${page}&size=${size}`;
      const response = await api.get(endpoint);
      const postsData = response.data.content || [];
      
      setLikedPosts(postsData);
      setTotalPages(response.data.page?.totalPages || 0);
      setTotalLikedPosts(response.data.page?.totalElements || 0);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
      setLikedPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Removed calculateStats function - no longer needed

  const nextPage = () => {
    if (page < totalPages - 1) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  if (loading) {
    return (
      <div className="likedposts-container">
        <div className="likedposts-hero">
          <div className="likedposts-loading">
            <div className="likedposts-loading-spinner"></div>
            <p>Loading your liked posts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="likedposts-container">
        <div className="likedposts-hero">
          <div className="likedposts-error">
            <div className="likedposts-error-icon">⚠️</div>
            <h2>Authentication Required</h2>
            <p>Please log in to view your liked posts</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="likedposts-container">
      {/* Hero Section */}
      <div className="likedposts-hero">
        <div className="likedposts-hero-content">
          <div className="likedposts-hero-text">
            <h1 className="likedposts-hero-title">
              <span className="likedposts-hero-icon">❤️</span>
              Liked Posts
            </h1>
            <p className="likedposts-hero-subtitle">
              Discover and rediscover the music you've loved
            </p>
          </div>
          <div className="likedposts-hero-actions">
            <div className="likedposts-quick-actions">
              <a href="/feed" className="likedposts-action-btn">
                <span className="likedposts-action-icon">🔍</span>
                <span className="likedposts-action-text">Explore Music</span>
              </a>
              <a href="/create-post" className="likedposts-action-btn">
                <span className="likedposts-action-icon">➕</span>
                <span className="likedposts-action-text">Create Post</span>
              </a>
              <a href="/profile" className="likedposts-action-btn">
                <span className="likedposts-action-icon">👤</span>
                <span className="likedposts-action-text">My Profile</span>
              </a>
              <a href="/subscription" className="likedposts-action-btn">
                <span className="likedposts-action-icon">⭐</span>
                <span className="likedposts-action-text">Go Plus</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="likedposts-controls">
        <div className="likedposts-controls-left">
          {/* No filter tabs needed for liked posts */}
        </div>

        <div className="likedposts-controls-right">
          {/* TODO: Sort Options - Add functionality later */}
          {/* <div className="likedposts-sort">
            <label className="likedposts-sort-label">Sort by:</label>
            <select 
              className="likedposts-sort-select"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="date">Newest First</option>
              <option value="likes">Most Liked</option>
              <option value="views">Most Viewed</option>
            </select>
          </div> */}

          {/* View Mode Toggle */}
          <div className="likedposts-view-toggle">
            <button 
              className={`likedposts-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <span>⊞</span>
            </button>
            <button 
              className={`likedposts-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <span>☰</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="likedposts-content">
        {likedPosts.length > 0 ? (
          <div className="likedposts-section">
            <div className="likedposts-section-header">
              <h2 className="likedposts-section-title">
                <span className="likedposts-section-icon">🎵</span>
                Your Liked Music
              </h2>
              <p className="likedposts-section-subtitle">
                {totalLikedPosts} liked posts
              </p>
            </div>
            <div className={`likedposts-cards-${viewMode}`}>
              {likedPosts.map((item) => (
                <LikedPosts2Item 
                  key={item.id + '-' + item.title} 
                  {...item} 
                  viewMode={viewMode}
                  currentUser={user}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="likedposts-empty">
            <div className="likedposts-empty-icon">❤️</div>
            <h2>No Liked Posts Yet</h2>
            <p>
              You haven't liked any posts yet. Start exploring and like the music you enjoy!
            </p>
            <div className="likedposts-empty-actions">
              <a href="/feed" className="likedposts-explore-btn">
                <span className="likedposts-explore-icon">🔍</span>
                <span>Explore Music</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {likedPosts.length > 0 && totalPages > 1 && (
        <div className="likedposts-pagination">
          <button 
            className="likedposts-page-btn"
            onClick={prevPage} 
            disabled={page === 0}
          >
            <span>←</span>
            Previous
          </button>
          
          <div className="likedposts-page-info">
            <span>Page {page + 1} of {totalPages}</span>
          </div>
          
          <button 
            className="likedposts-page-btn"
            onClick={nextPage} 
            disabled={page === totalPages - 1}
          >
            Next
            <span>→</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default LikedPosts;
