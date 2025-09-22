import React, { useState, useEffect } from 'react';
import api from '../services/AuthService';
import './ViewsAnalytics.css';

function ViewsAnalytics({ postId, postTitle, isOpen, onClose, currentUser, postAuthor, totalDownloads: postTotalDownloads = 0 }) {
  const [views, setViews] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('lastView');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination state
  const [viewsPage, setViewsPage] = useState(0);
  const [downloadsPage, setDownloadsPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [viewsTotalPages, setViewsTotalPages] = useState(0);
  const [downloadsTotalPages, setDownloadsTotalPages] = useState(0);
  const [viewsTotalElements, setViewsTotalElements] = useState(0);
  const [downloadsTotalElements, setDownloadsTotalElements] = useState(0);
  
  // Analytics data
  const [analyticsData, setAnalyticsData] = useState({
    totalViews: 0,
    uniqueViewers: 0,
    totalDownloads: 0,
    avgViewsPerUser: 0,
    topViewers: [],
    recentActivity: []
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'views', 'downloads'

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
    try {
      setLoading(true);
      const response = await api.get(`/posts/views/${postId}/paginated`, {
        params: {
          page: viewsPage,
          size: pageSize
        }
      });
      
      if (response.data) {
        // Handle PagedModel response structure
        const content = response.data.content || response.data._embedded?.viewsDTO || [];
        const totalPages = response.data.page?.totalPages || 0;
        const totalElements = response.data.page?.totalElements || 0;
        
        setViews(content);
        setViewsTotalPages(totalPages);
        setViewsTotalElements(totalElements);
        
        // Calculate analytics
        const totalViews = totalElements || 0;
        const uniqueViewers = new Set(content.map(view => view.userName)).size;
        const avgViewsPerUser = uniqueViewers > 0 ? (totalViews / uniqueViewers).toFixed(1) : 0;
        
        setAnalyticsData(prev => ({
          ...prev,
          totalViews,
          uniqueViewers,
          avgViewsPerUser
        }));
      }
    } catch (error) {
      console.error('Error fetching views:', error);
      setViews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDownloads = async () => {
    try {
      const response = await api.get(`/posts/downloads/${postId}/paginated`, {
        params: {
          page: downloadsPage,
          size: pageSize
        }
      });
      
      if (response.data) {
        // Handle PagedModel response structure
        const content = response.data.content || response.data._embedded?.postDownloadDTO || [];
        const totalPages = response.data.page?.totalPages || 0;
        const totalElements = response.data.page?.totalElements || 0;
        
        setDownloads(content);
        setDownloadsTotalPages(totalPages);
        setDownloadsTotalElements(totalElements);
        
        setAnalyticsData(prev => ({
          ...prev,
          totalDownloads: totalElements || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching downloads:', error);
      setDownloads([]);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEngagementRate = () => {
    if (analyticsData.totalViews === 0) return '0%';
    const rate = ((analyticsData.totalDownloads / analyticsData.totalViews) * 100).toFixed(1);
    return `${rate}%`;
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setViewsPage(0);
  };

  const handleSortOrderToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setViewsPage(0);
  };

  if (!isOpen) return null;

  return (
    <div className="views-analytics-overlay" onClick={onClose}>
      <div className="views-analytics-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="views-analytics-header">
          <div className="views-analytics-header-content">
            <div className="views-analytics-icon">📊</div>
            <div className="views-analytics-title">
              <h3>Post Analytics</h3>
              {postTitle && (
                <p className="views-analytics-subtitle">{postTitle}</p>
              )}
            </div>
          </div>
          <button className="views-analytics-close" onClick={onClose}>&times;</button>
        </div>

        {/* Navigation Tabs */}
        <div className="views-analytics-nav">
          <button 
            className={`views-analytics-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📈 Overview
          </button>
          <button 
            className={`views-analytics-nav-tab ${activeTab === 'views' ? 'active' : ''}`}
            onClick={() => setActiveTab('views')}
          >
            👁️ Views ({analyticsData.totalViews})
          </button>
          <button 
            className={`views-analytics-nav-tab ${activeTab === 'downloads' ? 'active' : ''}`}
            onClick={() => setActiveTab('downloads')}
          >
            ⬇️ Downloads ({analyticsData.totalDownloads})
          </button>
        </div>

        {/* Content */}
        <div className="views-analytics-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Stats Cards */}
              <div className="stats-section">
                <div className="stats-header">
                  <span>Analytics Summary</span>
                </div>
                
                <div className="stats-grid">
                  <div className="views-analytics-stat-card">
                    <div className="stat-icon">👁️</div>
                    <div className="stat-content">
                      <div className="stat-number">{formatNumber(analyticsData.totalViews)}</div>
                      <div className="stat-label">Total Views</div>
                    </div>
                  </div>
                  
                  <div className="views-analytics-stat-card">
                    <div className="stat-icon">👤</div>
                    <div className="stat-content">
                      <div className="stat-number">{formatNumber(analyticsData.uniqueViewers)}</div>
                      <div className="stat-label">Unique Viewers</div>
                    </div>
                  </div>
                  
                  <div className="views-analytics-stat-card">
                    <div className="stat-icon">⬇️</div>
                    <div className="stat-content">
                      <div className="stat-number">{formatNumber(analyticsData.totalDownloads)}</div>
                      <div className="stat-label">Downloads</div>
                    </div>
                  </div>
                  
                  <div className="views-analytics-stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <div className="stat-number">{analyticsData.avgViewsPerUser}</div>
                      <div className="stat-label">Avg Views/User</div>
                    </div>
                  </div>
                  
                  <div className="views-analytics-stat-card">
                    <div className="stat-icon">💯</div>
                    <div className="stat-content">
                      <div className="stat-number">{getEngagementRate()}</div>
                      <div className="stat-label">Engagement Rate</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                <button 
                  className="action-btn"
                  onClick={() => setActiveTab('views')}
                >
                  View All Viewers
                </button>
                <button 
                  className="action-btn"
                  onClick={() => setActiveTab('downloads')}
                >
                  View All Downloads
                </button>
              </div>
            </div>
          )}

          {activeTab === 'views' && (
            <div className="views-tab">
              <div className="tab-header">
                <div className="tab-controls">
                  <div className="sort-controls">
                    <label>Sort by:</label>
                    <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)}>
                      <option value="lastView">Last View</option>
                      <option value="firstView">First View</option>
                      <option value="viewCount">View Count</option>
                      <option value="userName">User Name</option>
                    </select>
                    <button className="sort-btn" onClick={handleSortOrderToggle}>
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </button>
                  </div>
                  
                  <div className="views-analytics-pagination-controls">
                    <label>Per page:</label>
                    <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="views-list">
                {loading ? (
                  <div className="loading-state">Loading viewers...</div>
                ) : views.length === 0 ? (
                  <div className="empty-state">No views recorded yet</div>
                ) : (
                  views.map((view, index) => (
                    <div key={index} className="views-analytics-view-item">
                      <div className="view-user">
                        <div className="views-analytics-user-avatar">
                          {view.profilePic ? (
                            <img 
                            src={view?.profilePic || "/dpp.jpg"} 
                            alt={view.userName}
                            onError={(e) => {
                              e.target.src = '/dpp.jpg';
                            }}
                          />
                          ) : (
                            <span>{view.userName?.charAt(0)?.toUpperCase() || '?'}</span>
                          )}
                        </div>
                        <div className="user-info">
                          <div className="views-analytics-username">{view.userName || 'Unknown User'}</div>
                          <div className="user-email">Viewer</div>
                        </div>
                      </div>
                      <div className="view-stats">
                        <div className="view-count">{view.viewCount || 1} views</div>
                        <div className="view-times">
                          <div className="view-time">
                            <span className="time-label">First:</span>
                            <span className="time-value">{formatDate(view.firstView)}</span>
                          </div>
                          <div className="view-time">
                            <span className="time-label">Last:</span>
                            <span className="time-value">{formatDate(view.lastView)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {viewsTotalPages > 1 && (
                <div className="views-analytics-pagination">
                  <div className="views-analytics-pagination-info">
                    Showing {viewsPage * pageSize + 1}-{Math.min((viewsPage + 1) * pageSize, viewsTotalElements)} of {viewsTotalElements} viewers
                  </div>
                  <div className="views-analytics-pagination-buttons">
                    <button 
                      className="views-analytics-pagination-btn"
                      onClick={() => setViewsPage(Math.max(0, viewsPage - 1))}
                      disabled={viewsPage === 0}
                    >
                      ← Previous
                    </button>
                    <span className="page-info">
                      Page {viewsPage + 1} of {viewsTotalPages}
                    </span>
                    <button 
                      className="views-analytics-pagination-btn"
                      onClick={() => setViewsPage(Math.min(viewsTotalPages - 1, viewsPage + 1))}
                      disabled={viewsPage >= viewsTotalPages - 1}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'downloads' && (
            <div className="downloads-tab">
              <div className="tab-header">
                <div className="tab-controls">
                  <div className="views-analytics-pagination-controls">
                    <label>Per page:</label>
                    <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="downloads-list">
                {loading ? (
                  <div className="loading-state">Loading downloads...</div>
                ) : downloads.length === 0 ? (
                  <div className="empty-state">No downloads recorded yet</div>
                ) : (
                  downloads.map((download, index) => (
                    <div key={index} className="views-analytics-download-item">
                      <div className="download-user">
                        <div className="views-analytics-user-avatar">
                          {download.profilePic ? (
                            <img src={download.profilePic} alt={download.userName} />
                          ) : (
                            <span>{download.userName?.charAt(0)?.toUpperCase() || '?'}</span>
                          )}
                        </div>
                        <div className="user-info">
                          <div className="views-analytics-username">{download.userName || 'Unknown User'}</div>
                          <div className="user-email">Downloader</div>
                        </div>
                      </div>
                      <div className="download-info">
                        <div className="download-date">{formatDate(download.downloadTime)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {downloadsTotalPages > 1 && (
                <div className="views-analytics-pagination">
                  <div className="views-analytics-pagination-info">
                    Showing {downloadsPage * pageSize + 1}-{Math.min((downloadsPage + 1) * pageSize, downloadsTotalElements)} of {downloadsTotalElements} downloads
                  </div>
                  <div className="views-analytics-pagination-buttons">
                    <button 
                      className="views-analytics-pagination-btn"
                      onClick={() => setDownloadsPage(Math.max(0, downloadsPage - 1))}
                      disabled={downloadsPage === 0}
                    >
                      ← Previous
                    </button>
                    <span className="page-info">
                      Page {downloadsPage + 1} of {downloadsTotalPages}
                    </span>
                    <button 
                      className="views-analytics-pagination-btn"
                      onClick={() => setDownloadsPage(Math.min(downloadsTotalPages - 1, downloadsPage + 1))}
                      disabled={downloadsPage >= downloadsTotalPages - 1}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewsAnalytics;