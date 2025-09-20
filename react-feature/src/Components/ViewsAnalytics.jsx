import React, { useState, useEffect } from 'react';
import api from '../services/AuthService';
import { getPostDownloads } from '../services/PostsService';
import './ViewsAnalytics.css';

function ViewsAnalytics({ postId, postTitle, isOpen, onClose, currentUser, postAuthor, totalDownloads: postTotalDownloads = 0 }) {
  const [views, setViews] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('lastView'); // 'lastView', 'firstView', 'viewCount', 'userName'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  
  // Pagination state
  const [viewsPage, setViewsPage] = useState(0);
  const [downloadsPage, setDownloadsPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [viewsTotalPages, setViewsTotalPages] = useState(0);
  const [downloadsTotalPages, setDownloadsTotalPages] = useState(0);
  const [viewsTotalElements, setViewsTotalElements] = useState(0);
  const [downloadsTotalElements, setDownloadsTotalElements] = useState(0);
  
  // Enhanced analytics state
  const [analyticsData, setAnalyticsData] = useState({
    totalViews: 0,
    uniqueViewers: 0,
    totalDownloads: 0,
    avgViewsPerUser: 0,
    topViewers: [],
    recentActivity: []
  });

  useEffect(() => {
    if (isOpen && postId) {
      setViewsPage(0);
      setDownloadsPage(0);
      fetchViews();
      fetchDownloads();
    }
  }, [isOpen, postId]);

  useEffect(() => {
    if (isOpen && postId) {
      fetchViews();
    }
  }, [viewsPage, pageSize, isOpen, postId]);

  useEffect(() => {
    if (isOpen && postId) {
      fetchDownloads();
    }
  }, [downloadsPage, pageSize, isOpen, postId]);

  const fetchViews = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/posts/views/${postId}/paginated?page=${viewsPage}&size=${pageSize}`);
      const viewsData = response.data.content || [];
      setViews(viewsData);
      setViewsTotalPages(response.data.totalPages || 0);
      setViewsTotalElements(response.data.totalElements || 0);
      
      // Update analytics data
      const totalViews = viewsData.reduce((sum, view) => sum + view.viewCount, 0);
      const uniqueViewers = response.data.totalElements || 0;
      const avgViewsPerUser = uniqueViewers > 0 ? (totalViews / uniqueViewers) : 0;
      
      setAnalyticsData(prev => ({
        ...prev,
        totalViews,
        uniqueViewers,
        avgViewsPerUser: avgViewsPerUser.toFixed(1)
      }));
    } catch (error) {
      console.error('Error fetching views:', error);
      setViews([]);
      setViewsTotalPages(0);
      setViewsTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchDownloads = async () => {
    try {
      const response = await api.get(`/posts/downloads/${postId}/paginated?page=${downloadsPage}&size=${pageSize}`);
      const downloadsData = response.data.content || [];
      setDownloads(downloadsData);
      setDownloadsTotalPages(response.data.totalPages || 0);
      setDownloadsTotalElements(response.data.totalElements || 0);
      
      // Update analytics data
      setAnalyticsData(prev => ({
        ...prev,
        totalDownloads: postTotalDownloads
      }));
    } catch (error) {
      console.error('Error fetching downloads:', error);
      setDownloads([]);
      setDownloadsTotalPages(0);
      setDownloadsTotalElements(0);
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

  const totalViews = analyticsData.totalViews;
  const uniqueViewers = analyticsData.uniqueViewers;
  const totalDownloads = analyticsData.totalDownloads;

  const formatDate = (dateString) => {
    // Ensure the date is parsed correctly as UTC if it's an ISO string
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const getTimeSince = (dateString) => {
    // Ensure the date is parsed correctly as UTC if it's an ISO string
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    return `${diffMonths}mo ago`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getEngagementRate = () => {
    if (uniqueViewers === 0) return 0;
    const engagement = ((totalViews + totalDownloads) / uniqueViewers).toFixed(1);
    return engagement;
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
          <div className="views-analytics-header-content">
            <h3>View Analytics</h3>
            {postTitle && (
              <div className="views-analytics-post-title">
                <span className="views-analytics-post-label">Title:</span>
                <a 
                  href={`/post/${postId}`} 
                  className="views-analytics-post-link"
                >
                  {postTitle}
                </a>
              </div>
            )}
          </div>
          <button className="views-analytics-close" onClick={onClose}>&times;</button>
        </div>

        <div className="views-analytics-summary">
          <div className="views-stat">
            <span className="views-stat-number">{formatNumber(totalViews)}</span>
            <span className="views-stat-label">Total Views</span>
          </div>
          <div className="views-stat">
            <span className="views-stat-number">{formatNumber(uniqueViewers)}</span>
            <span className="views-stat-label">Unique Viewers</span>
          </div>
          <div className="views-stat">
            <span className="views-stat-number">{formatNumber(totalDownloads)}</span>
            <span className="views-stat-label">Downloads</span>
          </div>
          <div className="views-stat">
            <span className="views-stat-number">{analyticsData.avgViewsPerUser}</span>
            <span className="views-stat-label">Avg Views/User</span>
          </div>
          <div className="views-stat">
            <span className="views-stat-number">{getEngagementRate()}</span>
            <span className="views-stat-label">Engagement Rate</span>
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
          <div className="views-pagination-controls">
            <label>Items per page:</label>
            <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value))}>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        <div className="views-analytics-content">
          <div className="analytics-sections-container">
            {/* Views Section */}
            <div className="analytics-section">
              <div className="analytics-section-header">
                <h4 className="analytics-section-title">
                  <span className="analytics-section-icon">👁️</span>
                  Views ({formatNumber(uniqueViewers)})
                </h4>
              </div>
              
              {loading ? (
                <div className="views-loading">Loading views...</div>
              ) : views.length === 0 ? (
                <div className="views-empty">No views yet</div>
              ) : (
                <div className="views-list">
                  {sortedViews.map((view, index) => (
                    <div key={`${view.userName}-${index}`} className="view-item">
                      <div className="view-user">
                        <a href={`/profile/${view.userName}`} className="view-user-link">
                          <img 
                            className="view-user-avatar" 
                            src={view.profilePic || "https://randomuser.me/api/portraits/men/32.jpg"} 
                            alt={view.userName}
                            loading="lazy"
                          />
                        </a>
                        <div className="view-user-info">
                          <a href={`/profile/${view.userName}`} className="view-username">
                            {view.userName}
                          </a>
                          <div className="view-count">
                            {view.viewCount} view{view.viewCount !== 1 ? 's' : ''}
                            {view.viewCount > 1 && (
                              <span className="view-count-badge">Returning</span>
                            )}
                          </div>
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
                        <div className="view-time">
                          <span className="view-time-label">Total:</span>
                          <span className="view-time-value">{view.viewCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Views Pagination */}
              {viewsTotalPages > 1 && (
                <div className="pagination-controls">
                  <div className="pagination-info">
                    Showing {viewsPage * pageSize + 1}-{Math.min((viewsPage + 1) * pageSize, viewsTotalElements)} of {viewsTotalElements} views
                  </div>
                  <div className="pagination-buttons">
                    <button 
                      className="pagination-btn"
                      onClick={() => setViewsPage(0)}
                      disabled={viewsPage === 0}
                    >
                      First
                    </button>
                    <button 
                      className="pagination-btn"
                      onClick={() => setViewsPage(viewsPage - 1)}
                      disabled={viewsPage === 0}
                    >
                      Previous
                    </button>
                    <span className="pagination-page">
                      Page {viewsPage + 1} of {viewsTotalPages}
                    </span>
                    <button 
                      className="pagination-btn"
                      onClick={() => setViewsPage(viewsPage + 1)}
                      disabled={viewsPage >= viewsTotalPages - 1}
                    >
                      Next
                    </button>
                    <button 
                      className="pagination-btn"
                      onClick={() => setViewsPage(viewsTotalPages - 1)}
                      disabled={viewsPage >= viewsTotalPages - 1}
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Downloads Section */}
            <div className="analytics-section">
              <div className="analytics-section-header">
                <h4 className="analytics-section-title">
                  <span className="analytics-section-icon">📥</span>
                  Downloads ({formatNumber(totalDownloads)})
                </h4>
              </div>
              
              {totalDownloads > 0 ? (
                <>
                  <div className="downloads-list">
                    {downloads.map((download, index) => (
                      <div key={`${download.userName}-${download.downloadTime}-${index}`} className="download-item">
                        <div className="download-user">
                          <a href={`/profile/${download.userName}`} className="download-user-link">
                            <img 
                              className="download-user-avatar" 
                              src={download.profilePic || "https://randomuser.me/api/portraits/men/32.jpg"} 
                              alt={download.userName}
                              loading="lazy"
                            />
                          </a>
                          <div className="download-user-info">
                            <a href={`/profile/${download.userName}`} className="download-username">
                              {download.userName}
                            </a>
                            <div className="download-meta">
                              <span className="download-date">{formatDate(download.downloadTime)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="download-time">
                          <span className="download-time-badge">{getTimeSince(download.downloadTime)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Downloads Pagination */}
                  {downloadsTotalPages > 1 && (
                    <div className="pagination-controls">
                      <div className="pagination-info">
                        Showing {downloadsPage * pageSize + 1}-{Math.min((downloadsPage + 1) * pageSize, downloadsTotalElements)} of {downloadsTotalElements} downloads
                      </div>
                      <div className="pagination-buttons">
                        <button 
                          className="pagination-btn"
                          onClick={() => setDownloadsPage(0)}
                          disabled={downloadsPage === 0}
                        >
                          First
                        </button>
                        <button 
                          className="pagination-btn"
                          onClick={() => setDownloadsPage(downloadsPage - 1)}
                          disabled={downloadsPage === 0}
                        >
                          Previous
                        </button>
                        <span className="pagination-page">
                          Page {downloadsPage + 1} of {downloadsTotalPages}
                        </span>
                        <button 
                          className="pagination-btn"
                          onClick={() => setDownloadsPage(downloadsPage + 1)}
                          disabled={downloadsPage >= downloadsTotalPages - 1}
                        >
                          Next
                        </button>
                        <button 
                          className="pagination-btn"
                          onClick={() => setDownloadsPage(downloadsTotalPages - 1)}
                          disabled={downloadsPage >= downloadsTotalPages - 1}
                        >
                          Last
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="views-empty">No downloads yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewsAnalytics;
