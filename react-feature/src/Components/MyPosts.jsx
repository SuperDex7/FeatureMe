import React, { useState, useEffect } from "react";
import api, { getCurrentUser } from "../services/AuthService";
import MyPosts2Item from "./MyPostsItem";
import "./MyPosts.css";

function MyPosts() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState(8);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [sortBy, setSortBy] = useState('date'); // date, likes, views
  const [filterBy, setFilterBy] = useState('all'); // all
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalViews: 0,
    totalComments: 0
  });

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
    if (user && user.posts) {
      fetchPosts();
    } else if (user && !user.posts) {
      setLoading(false);
      setPosts([]);
    }
  }, [user, page, size, sortBy]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let endpoint = `/posts/get/all/id/${user.posts}/sorted?page=${page}&size=${size}`;
      
      // TODO: Add sorting parameter functionality
      // switch(sortBy) {
      //   case 'likes':
      //     endpoint += '&sort=likes&order=desc';
      //     break;
      //   case 'views':
      //     endpoint += '&sort=views&order=desc';
      //     break;
      //   default:
      //     endpoint += '&sort=date&order=desc';
      // }
      
      const response = await api.get(endpoint);
      const postsData = response.data.content || [];
  
      let filteredPosts = postsData;
      
      setPosts(filteredPosts);
      setTotalPages(response.data.page?.totalPages || 0);
      
      // Calculate stats
      calculateStats(filteredPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (postsData) => {
    const totalLikes = postsData.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
    const totalViews = postsData.reduce((sum, post) => sum + (post.totalViews || 0), 0);
    const totalComments = postsData.reduce((sum, post) => sum + (post.totalComments || 0), 0);
    
    setStats({
      totalPosts: postsData.length,
      totalLikes,
      totalViews,
      totalComments
    });
  };

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

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setPage(0);
  };


  if (loading) {
    return (
      <div className="myposts-container">
        <div className="myposts-hero">
          <div className="myposts-loading">
            <div className="myposts-loading-spinner"></div>
            <p>Loading your posts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="myposts-container">
        <div className="myposts-hero">
          <div className="myposts-error">
            <div className="myposts-error-icon">⚠️</div>
            <h2>Authentication Required</h2>
            <p>Please log in to view your posts</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="myposts-container">
      {/* Hero Section */}
      <div className="myposts-hero">
        <div className="myposts-hero-content">
          <div className="myposts-hero-text">
            <h1 className="myposts-hero-title">
              <span className="myposts-hero-icon">🎵</span>
              My Content
            </h1>
            <p className="myposts-hero-subtitle">
              Manage and showcase your creative works
            </p>
          </div>
          <div className="myposts-hero-stats">
            <div className="myposts-stat">
              <span className="myposts-stat-number">{stats.totalPosts}</span>
              <span className="myposts-stat-label">Posts</span>
            </div>
            <div className="myposts-stat">
              <span className="myposts-stat-number">{stats.totalLikes}</span>
              <span className="myposts-stat-label">Likes</span>
            </div>
            <div className="myposts-stat">
              <span className="myposts-stat-number">{stats.totalViews}</span>
              <span className="myposts-stat-label">Views</span>
            </div>
            <div className="myposts-stat">
              <span className="myposts-stat-number">{stats.totalComments}</span>
              <span className="myposts-stat-label">Comments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="myposts-controls">
        <div className="myposts-controls-left">
          {/* No filter tabs needed since all posts are music posts */}
        </div>

        <div className="myposts-controls-right">
          {/* TODO: Sort Options - Add functionality later */}
          {/* <div className="myposts-sort">
            <label className="myposts-sort-label">Sort by:</label>
            <select 
              className="myposts-sort-select"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="date">Newest First</option>
              <option value="likes">Most Liked</option>
              <option value="views">Most Viewed</option>
            </select>
          </div> */}

          {/* View Mode Toggle */}
          <div className="myposts-view-toggle">
            <button 
              className={`myposts-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <span>⊞</span>
            </button>
            <button 
              className={`myposts-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <span>☰</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="myposts-content">
        {posts.length > 0 ? (
          <div className="myposts-section">
            <div className="myposts-section-header">
              <h2 className="myposts-section-title">
                <span className="myposts-section-icon">📚</span>
                Your Content Library
              </h2>
              <p className="myposts-section-subtitle">
                {posts.length} posts found
              </p>
            </div>
            <div className={`myposts-cards-${viewMode}`}>
              {posts.map((item) => (
                <MyPosts2Item 
                  key={item.id + '-' + item.title} 
                  {...item} 
                  viewMode={viewMode}
                  currentUser={user}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="myposts-empty">
            <div className="myposts-empty-icon">📝</div>
            <h2>No Posts Yet</h2>
            <p>
              You haven't created any posts yet. Start sharing your music!
            </p>
            <div className="myposts-empty-actions">
              <a href="/create-post" className="myposts-create-btn">
                <span className="myposts-create-icon">➕</span>
                <span>Create Your First Post</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {posts.length > 0 && totalPages > 1 && (
        <div className="myposts-pagination">
          <button 
            className="myposts-page-btn"
            onClick={prevPage} 
            disabled={page === 0}
          >
            <span>←</span>
            Previous
          </button>
          
          <div className="myposts-page-info">
            <span>Page {page + 1} of {totalPages}</span>
          </div>
          
          <button 
            className="myposts-page-btn"
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

export default MyPosts;
