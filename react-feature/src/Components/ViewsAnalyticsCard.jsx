import React, { useState, useEffect } from 'react';
import ViewsAnalytics from './ViewsAnalytics';
import { getCurrentUser } from '../services/AuthService';
import api from '../services/AuthService';
import './ViewsAnalyticsCard.css';

function ViewsAnalyticsCard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showViewsAnalytics, setShowViewsAnalytics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  useEffect(() => {
    const fetchUserAndPosts = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        
        if (user && user.posts && user.posts.length > 0) {
          // Fetch user's posts
          const response = await api.get(`/posts/get/all/id/${user.posts.join(',')}/sorted`);
          setUserPosts(response.data.content || []);
        }
      } catch (error) {
        console.error('Error fetching user posts:', error);
        setUserPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndPosts();
  }, []);

  const handlePostSelect = (post) => {
    setSelectedPost(post);
    setShowViewsAnalytics(true);
  };

  // Pagination logic
  const totalPages = Math.ceil(userPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = userPosts.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const formatViews = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  if (!currentUser) {
    return (
      <div className="analytics-card">
        <div className="analytics-card-header">
          <div className="analytics-card-icon">📊</div>
          <div className="analytics-card-title">
            <h3>View Analytics</h3>
            <p>Premium Feature</p>
          </div>
        </div>
        <div className="analytics-card-content">
          <p className="analytics-login-message">Please log in to view your post analytics</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="analytics-card">
        <div className="analytics-card-header">
          <div className="analytics-card-icon">📊</div>
          <div className="analytics-card-title">
            <h3>View Analytics</h3>
            <p>Premium Feature</p>
          </div>
        </div>
        <div className="analytics-card-content">
          <div className="analytics-loading">Loading your posts...</div>
        </div>
      </div>
    );
  }

  if (userPosts.length === 0) {
    return (
      <div className="analytics-card">
        <div className="analytics-card-header">
          <div className="analytics-card-icon">📊</div>
          <div className="analytics-card-title">
            <h3>View Analytics</h3>
            <p>Premium Feature</p>
          </div>
        </div>
        <div className="analytics-card-content">
          <div className="analytics-empty">
            <p>You haven't posted any tracks yet!</p>
            <p>Create your first post to see analytics here.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="analytics-card">
        <div className="analytics-card-header">
          <div className="analytics-card-icon">📊</div>
          <div className="analytics-card-title">
            <h3>View Analytics</h3>
            <p>Premium Feature - Select a post to view detailed analytics</p>
          </div>
        </div>
        
        <div className="analytics-card-content">
          <div className="analytics-posts-grid">
            {currentPosts.map((post) => (
              <div 
                key={post.id} 
                className="analytics-post-item"
                onClick={() => handlePostSelect(post)}
              >
                <div className="analytics-post-banner" 
                     style={{ backgroundImage: `url(${post.author.banner || 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80'})` }}>
                </div>
                <div className="analytics-post-info">
                  <h4 className="analytics-post-title">{post.title}</h4>
                  <div className="analytics-post-stats">
                    <span className="analytics-stat">
                      <span className="analytics-stat-icon">👁️</span>
                      <span className="analytics-stat-value">{formatViews(post.totalViews || 0)}</span>
                    </span>
                    <span className="analytics-stat">
                      <span className="analytics-stat-icon">❤️</span>
                      <span className="analytics-stat-value">{post.likes?.length || 0}</span>
                    </span>
                    <span className="analytics-stat">
                      <span className="analytics-stat-icon">💬</span>
                      <span className="analytics-stat-value">{post.totalComments || 0}</span>
                    </span>
                  </div>
                </div>
                <div className="analytics-post-overlay">
                  <span className="analytics-view-btn">View Analytics</span>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="analytics-pagination">
              <div className="analytics-pagination-info">
                <span>Showing {startIndex + 1}-{Math.min(endIndex, userPosts.length)} of {userPosts.length} posts</span>
              </div>
              <div className="analytics-pagination-controls">
                <button 
                  className="analytics-pagination-btn" 
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>
                <div className="analytics-pagination-pages">
                  <span>{currentPage} of {totalPages}</span>
                </div>
                <button 
                  className="analytics-pagination-btn" 
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedPost && (
        <ViewsAnalytics
          postId={selectedPost.id}
          isOpen={showViewsAnalytics}
          onClose={() => {
            setShowViewsAnalytics(false);
            setSelectedPost(null);
          }}
          currentUser={currentUser}
          postAuthor={selectedPost.author}
        />
      )}
    </>
  );
}

export default ViewsAnalyticsCard;
