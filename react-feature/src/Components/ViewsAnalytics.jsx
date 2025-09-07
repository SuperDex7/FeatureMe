import React, { useState, useEffect } from 'react';
import api from '../services/AuthService';
import './ViewsAnalytics.css';

function ViewsAnalytics({ postId, isOpen, onClose, currentUser, postAuthor }) {
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('lastView'); // 'lastView', 'firstView', 'viewCount', 'userName'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  useEffect(() => {
    if (isOpen && postId) {
      fetchViews();
    }
  }, [isOpen, postId]);

  const fetchViews = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/posts/views/${postId}`);
      setViews(response.data);
    } catch (error) {
      console.error('Error fetching views:', error);
      setViews([]);
    } finally {
      setLoading(false);
    }
  };

  const sortedViews = [...views].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'viewCount':
        aValue = a.viewCount;
        bValue = b.viewCount;
        break;
      case 'userName':
        aValue = a.userName.toLowerCase();
        bValue = b.userName.toLowerCase();
        break;
      case 'firstView':
        aValue = new Date(a.firstView);
        bValue = new Date(b.firstView);
        break;
      case 'lastView':
      default:
        aValue = new Date(a.lastView);
        bValue = new Date(b.lastView);
        break;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalViews = views.reduce((sum, view) => sum + view.viewCount, 0);
  const uniqueViewers = views.length;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTimeSince = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!isOpen) return null;

  // Only show to post author
  if (!currentUser || currentUser.userName !== postAuthor.userName) {
    return (
      <div className="views-analytics-overlay" onClick={onClose}>
        <div className="views-analytics-modal" onClick={e => e.stopPropagation()}>
          <div className="views-analytics-header">
            <h3>Access Denied</h3>
            <button className="views-analytics-close" onClick={onClose}>&times;</button>
          </div>
          <p>Only the post author can view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="views-analytics-overlay" onClick={onClose}>
      <div className="views-analytics-modal" onClick={e => e.stopPropagation()}>
        <div className="views-analytics-header">
          <h3>View Analytics</h3>
          <button className="views-analytics-close" onClick={onClose}>&times;</button>
        </div>

        <div className="views-analytics-summary">
          <div className="views-stat">
            <span className="views-stat-number">{totalViews}</span>
            <span className="views-stat-label">Total Views</span>
          </div>
          <div className="views-stat">
            <span className="views-stat-number">{uniqueViewers}</span>
            <span className="views-stat-label">Unique Viewers</span>
          </div>
          <div className="views-stat">
            <span className="views-stat-number">{uniqueViewers > 0 ? (totalViews / uniqueViewers).toFixed(1) : 0}</span>
            <span className="views-stat-label">Avg Views/User</span>
          </div>
        </div>

        <div className="views-analytics-controls">
          <div className="views-sort-controls">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="lastView">Last View</option>
              <option value="firstView">First View</option>
              <option value="viewCount">View Count</option>
              <option value="userName">Username</option>
            </select>
            <button 
              className={`sort-order-btn ${sortOrder === 'desc' ? 'active' : ''}`}
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>

        <div className="views-analytics-content">
          {loading ? (
            <div className="views-loading">Loading views...</div>
          ) : views.length === 0 ? (
            <div className="views-empty">No views yet</div>
          ) : (
            <div className="views-list">
              {sortedViews.map((view, index) => (
                <div key={view.userName} className="view-item">
                  <div className="view-user">
                   <a href={`/profile/${view.userName}`}><img 
                      className="view-user-avatar" 
                      src={view.profilePic || "https://randomuser.me/api/portraits/men/32.jpg"} 
                      alt={view.userName}
                    /></a>
                    <div className="view-user-info">
                     <a href={`/profile/${view.userName}`}><span className="view-username">{view.userName}</span></a>
                      <span className="view-count">{view.viewCount} view{view.viewCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="view-times">
                    <div className="view-time">
                      <span className="view-time-label">Last:</span>
                      <span className="view-time-value">{getTimeSince(view.lastView)}</span>
                    </div>
                    {view.viewCount > 1 && (
                      <div className="view-time">
                        <span className="view-time-label">First:</span>
                        <span className="view-time-value">{getTimeSince(view.firstView)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewsAnalytics;
