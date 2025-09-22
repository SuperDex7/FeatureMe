import React, { useState, useEffect } from 'react';
import api from '../services/AuthService';
import './ViewsAnalytics.css';

function ViewsAnalytics({ postId, postTitle, isOpen, onClose, currentUser, postAuthor, totalDownloads: postTotalDownloads = 0, totalViews: postTotalViews = 0, totalComments: postTotalComments = 0 }) {
  const [views, setViews] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [likerUsernames, setLikerUsernames] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [sortBy, setSortBy] = useState('lastView');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination state
  const [viewsPage, setViewsPage] = useState(0);
  const [downloadsPage, setDownloadsPage] = useState(0);
  const [likesPage, setLikesPage] = useState(0);
  const [commentsPage, setCommentsPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [viewsTotalPages, setViewsTotalPages] = useState(0);
  const [downloadsTotalPages, setDownloadsTotalPages] = useState(0);
  const [likesTotalPages, setLikesTotalPages] = useState(0);
  const [commentsTotalPages, setCommentsTotalPages] = useState(0);
  const [viewsTotalElements, setViewsTotalElements] = useState(0);
  const [downloadsTotalElements, setDownloadsTotalElements] = useState(0);
  const [likesTotalElements, setLikesTotalElements] = useState(0);
  const [commentsTotalElements, setCommentsTotalElements] = useState(0);
  
  // Analytics data
  const [analyticsData, setAnalyticsData] = useState({
    totalViews: 0,
    uniqueViewers: 0,
    totalDownloads: 0,
    totalLikes: 0,
    totalComments: 0,
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
      setLikesPage(0);
      setCommentsPage(0);
      // Initialize totals from props immediately
      setAnalyticsData(prev => ({
        ...prev,
        totalViews: postTotalViews || 0,
        totalDownloads: postTotalDownloads || 0,
        totalComments: postTotalComments || 0
      }));
      fetchSummary();
      fetchLikesSummary();
      fetchViews();
      fetchDownloads();
      fetchLikes();
      fetchLikers();
      fetchComments();
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

  useEffect(() => {
    if (isOpen && postId) {
      fetchLikes();
    }
  }, [likesPage, pageSize, isOpen, postId]);

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [commentsPage, pageSize, isOpen, postId]);

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
        
        // Calculate analytics (do not overwrite totalViews here)
        const uniqueViewers = totalElements || 0;
        setAnalyticsData(prev => ({
          ...prev,
          uniqueViewers,
          avgViewsPerUser: uniqueViewers > 0 ? (prev.totalViews / uniqueViewers).toFixed(1) : 0
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

  const fetchLikes = async () => {
    try {
      const response = await api.get(`/posts/likes/${postId}/paginated`, {
        params: {
          page: likesPage,
          size: pageSize
        }
      });
      
      if (response.data) {
        const content = response.data.content || response.data._embedded?.likesDTO || [];
        const totalPages = response.data.page?.totalPages || 0;
        const totalElements = response.data.page?.totalElements || 0;
        
        setLikes(content);
        setLikesTotalPages(totalPages);
        setLikesTotalElements(totalElements);
        
        setAnalyticsData(prev => ({
          ...prev,
          totalLikes: totalElements || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
      setLikes([]);
    }
  };

  const fetchLikers = async () => {
    try {
      const response = await api.get(`/posts/likes/${postId}/paginated`, {
        params: {
          page: 0,
          size: 1000
        }
      });
      if (response.data) {
        const content = response.data.content || response.data._embedded?.likesDTO || [];
        const names = new Set(content.map(l => l.userName).filter(Boolean));
        setLikerUsernames(names);
      }
    } catch (e) {
      console.error('Error fetching liker usernames:', e);
      setLikerUsernames(new Set());
    }
  };

  const fetchLikesSummary = async () => {
    try {
      const response = await api.get(`/posts/likes/${postId}/summary`);
      if (response.data && typeof response.data.totalLikes !== 'undefined') {
        setAnalyticsData(prev => ({
          ...prev,
          totalLikes: response.data.totalLikes || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching likes summary:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get(`/posts/views/${postId}/summary`);
      if (res.data) {
        const summaryTotalViews = res.data.totalViews || 0;
        const summaryUniqueViewers = res.data.uniqueViewers || 0;
        const summaryAvg = summaryUniqueViewers > 0 ? (summaryTotalViews / summaryUniqueViewers).toFixed(1) : 0;
        setAnalyticsData(prev => ({
          ...prev,
          totalViews: summaryTotalViews,
          uniqueViewers: summaryUniqueViewers,
          avgViewsPerUser: summaryAvg
        }));
      }
    } catch (e) {
      // Fallback stays as previously computed values
      console.error('Error fetching view summary:', e);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/posts/comments/${postId}/paginated`, {
        params: {
          page: commentsPage,
          size: pageSize
        }
      });
      if (response.data) {
        const content = response.data.content || response.data._embedded?.commentDTO || [];
        const totalPages = response.data.page?.totalPages || 0;
        const totalElements = response.data.page?.totalElements || 0;
        setComments(content);
        setCommentsTotalPages(totalPages);
        setCommentsTotalElements(totalElements);
        setAnalyticsData(prev => ({
          ...prev,
          totalComments: totalElements || prev.totalComments
        }));
      }
    } catch (e) {
      console.error('Error fetching comments:', e);
      setComments([]);
    }
  };

  const handleAddComment = async () => {
    const text = (newComment || "").trim();
    if (!text) return;
    if (!currentUser) return;
    setPostingComment(true);
    try {
      await api.post(`/posts/add/comment/${postId}`, text, { headers: { 'Content-Type': 'application/json' } });
      setNewComment("");
      // Refresh comments first page
      setCommentsPage(0);
      await fetchComments();
    } catch (e) {
      console.error('Error adding comment:', e);
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!commentId) return;
    setDeletingCommentId(commentId);
    try {
      await api.delete(`/posts/delete/comment/${commentId}`);
      // Remove locally and refresh counts
      setComments(prev => prev.filter(c => c.id !== commentId));
      setAnalyticsData(prev => ({ ...prev, totalComments: Math.max(0, (prev.totalComments || 1) - 1) }));
    } catch (e) {
      console.error('Error deleting comment:', e);
    } finally {
      setDeletingCommentId(null);
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
            👁️ Views ({analyticsData.uniqueViewers})
          </button>
          <button 
            className={`views-analytics-nav-tab ${activeTab === 'downloads' ? 'active' : ''}`}
            onClick={() => setActiveTab('downloads')}
          >
            ⬇️ Downloads ({analyticsData.totalDownloads})
          </button>
          <button 
            className={`views-analytics-nav-tab ${activeTab === 'likes' ? 'active' : ''}`}
            onClick={() => setActiveTab('likes')}
          >
            ❤️ Likes ({analyticsData.totalLikes})
          </button>
          <button 
            className={`views-analytics-nav-tab ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            💬 Comments ({analyticsData.totalComments})
          </button>
        </div>

        {/* Content */}
        <div className="views-analytics-content">
          {activeTab === 'overview' && (
            <div className="views-analytics-overview-tab">
              {/* Stats Cards */}
              <div className="views-analytics-stats-section">
                <div className="views-analytics-stats-header">
                  <span>Analytics Summary</span>
                </div>
                
                <div className="views-analytics-stats-grid">
                  <div className="views-analytics-stat-card">
                    <div className="views-analytics-stat-icon">👁️</div>
                    <div className="views-analytics-stat-content">
                      <div className="views-analytics-stat-number">{formatNumber(analyticsData.totalViews)}</div>
                      <div className="views-analytics-stat-label">Total Views</div>
                    </div>
                  </div>
                  
                  <div className="views-analytics-stat-card">
                    <div className="views-analytics-stat-icon">👤</div>
                    <div className="views-analytics-stat-content">
                      <div className="views-analytics-stat-number">{formatNumber(analyticsData.uniqueViewers)}</div>
                      <div className="views-analytics-stat-label">Unique Viewers</div>
                    </div>
                  </div>
                  
                  <div className="views-analytics-stat-card">
                    <div className="views-analytics-stat-icon">⬇️</div>
                    <div className="views-analytics-stat-content">
                      <div className="views-analytics-stat-number">{formatNumber(analyticsData.totalDownloads)}</div>
                      <div className="views-analytics-stat-label">Downloads</div>
                    </div>
                  </div>
                  
                  <div className="views-analytics-stat-card">
                    <div className="views-analytics-stat-icon">📊</div>
                    <div className="views-analytics-stat-content">
                      <div className="views-analytics-stat-number">{analyticsData.avgViewsPerUser}</div>
                      <div className="views-analytics-stat-label">Avg Views/User</div>
                    </div>
                  </div>
                  
                  <div className="views-analytics-stat-card">
                    <div className="views-analytics-stat-icon">💯</div>
                    <div className="views-analytics-stat-content">
                      <div className="views-analytics-stat-number">{getEngagementRate()}</div>
                      <div className="views-analytics-stat-label">Engagement Rate</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="views-analytics-quick-actions">
                <button 
                  className="views-analytics-action-btn"
                  onClick={() => setActiveTab('views')}
                >
                  View All Viewers
                </button>
                <button 
                  className="views-analytics-action-btn"
                  onClick={() => setActiveTab('downloads')}
                >
                  View All Downloads
                </button>
              </div>
            </div>
          )}

          {activeTab === 'views' && (
            <div className="views-analytics-views-tab">
              <div className="views-analytics-tab-header">
                <div className="views-analytics-tab-controls">
                  <div className="views-analytics-sort-controls">
                    <label>Sort by:</label>
                    <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)}>
                      <option value="lastView">Last View</option>
                      <option value="firstView">First View</option>
                      <option value="viewCount">View Count</option>
                      <option value="userName">User Name</option>
                    </select>
                    <button className="views-analytics-sort-btn" onClick={handleSortOrderToggle}>
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

              <div className="views-analytics-views-list">
                {loading ? (
                  <div className="views-analytics-loading-state">Loading viewers...</div>
                ) : views.length === 0 ? (
                  <div className="views-analytics-empty-state">No views recorded yet</div>
                ) : (
                  views.map((view, index) => (
                    <div key={index} className="views-analytics-view-item">
                      <div className="views-analytics-view-user">
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
                        <div className="views-analytics-user-info">
                          <div className="views-analytics-username">
                            {view.userName || 'Unknown User'}
                            {likerUsernames && likerUsernames.has && likerUsernames.has(view.userName) && (
                              <span style={{ marginLeft: '8px', color: '#ffa726', fontSize: '0.9rem' }}>❤️</span>
                            )}
                          </div>
                          <div className="views-analytics-user-role">Viewer</div>
                        </div>
                      </div>
                      <div className="views-analytics-view-stats">
                        <div className="views-analytics-view-count">{view.viewCount || 1} views</div>
                        <div className="views-analytics-view-times">
                          <div className="views-analytics-view-time">
                            <span className="views-analytics-time-label">First:</span>
                            <span className="views-analytics-time-value">{formatDate(view.firstView)}</span>
                          </div>
                          <div className="views-analytics-view-time">
                            <span className="views-analytics-time-label">Last:</span>
                            <span className="views-analytics-time-value">{formatDate(view.lastView)}</span>
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
                    <span className="views-analytics-page-info">
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
            <div className="views-analytics-downloads-tab">
              <div className="views-analytics-tab-header">
                <div className="views-analytics-tab-controls">
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

              <div className="views-analytics-downloads-list">
                {loading ? (
                  <div className="views-analytics-loading-state">Loading downloads...</div>
                ) : downloads.length === 0 ? (
                  <div className="views-analytics-empty-state">No downloads recorded yet</div>
                ) : (
                  downloads.map((download, index) => (
                    <div key={index} className="views-analytics-download-item">
                      <div className="views-analytics-download-user">
                        <div className="views-analytics-user-avatar">
                          {download.profilePic ? (
                            <img src={download.profilePic} alt={download.userName} />
                          ) : (
                            <span>{download.userName?.charAt(0)?.toUpperCase() || '?'}</span>
                          )}
                        </div>
                        <div className="views-analytics-user-info">
                          <div className="views-analytics-username">{download.userName || 'Unknown User'}</div>
                          <div className="views-analytics-user-role">Downloader</div>
                        </div>
                      </div>
                      <div className="views-analytics-download-info">
                        <div className="views-analytics-download-date">{formatDate(download.downloadTime)}</div>
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
                    <span className="views-analytics-page-info">
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

          {activeTab === 'likes' && (
            <div className="views-analytics-tab views-analytics-likes-tab">
              <div className="views-analytics-tab-header">
                <div className="views-analytics-tab-controls">
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

              <div className="views-analytics-views-list">
                {loading ? (
                  <div className="views-analytics-loading-state">Loading likes...</div>
                ) : likes.length === 0 ? (
                  <div className="views-analytics-empty-state">No likes yet</div>
                ) : (
                  likes.map((like, index) => (
                    <div key={index} className="views-analytics-view-item">
                      <div className="views-analytics-view-user">
                        <div className="views-analytics-user-avatar">
                          {like.profilePic ? (
                            <img 
                              src={like.profilePic || "/dpp.jpg"} 
                              alt={like.userName}
                              onError={(e) => { e.target.src = '/dpp.jpg'; }}
                            />
                          ) : (
                            <span>{like.userName?.charAt(0)?.toUpperCase() || '?'}</span>
                          )}
                        </div>
                        <div className="views-analytics-user-info">
                          <div className="views-analytics-username">{like.userName || 'Unknown User'}</div>
                          <div className="views-analytics-user-role">Liked</div>
                        </div>
                      </div>
                      <div className="views-analytics-view-stats">
                        <div className="views-analytics-view-times">
                          <div className="views-analytics-view-time">
                            <span className="views-analytics-time-label">Time:</span>
                            <span className="views-analytics-time-value">{formatDate(like.time)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {likesTotalPages > 1 && (
                <div className="views-analytics-pagination">
                  <div className="views-analytics-pagination-info">
                    Showing {likesPage * pageSize + 1}-{Math.min((likesPage + 1) * pageSize, likesTotalElements)} of {likesTotalElements} likes
                  </div>
                  <div className="views-analytics-pagination-buttons">
                    <button 
                      className="views-analytics-pagination-btn"
                      onClick={() => setLikesPage(Math.max(0, likesPage - 1))}
                      disabled={likesPage === 0}
                    >
                      ← Previous
                    </button>
                    <span className="views-analytics-page-info">
                      Page {likesPage + 1} of {likesTotalPages}
                    </span>
                    <button 
                      className="views-analytics-pagination-btn"
                      onClick={() => setLikesPage(Math.min(likesTotalPages - 1, likesPage + 1))}
                      disabled={likesPage >= likesTotalPages - 1}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="views-analytics-tab views-analytics-comments-tab">
              <div className="views-analytics-tab-header">
                <div className="views-analytics-tab-controls">
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

              <div className="views-analytics-views-list">
                {comments.length === 0 ? (
                  <div className="views-analytics-empty-state">No comments yet</div>
                ) : (
                  comments.map((comment, index) => (
                    <div key={index} className="views-analytics-view-item">
                      <div className="views-analytics-view-user">
                        <div className="views-analytics-user-avatar">
                          {comment.profilePic ? (
                            <img src={comment.profilePic || "/dpp.jpg"} alt={comment.userName}
                              onError={(e) => { e.target.src = '/dpp.jpg'; }} />
                          ) : (
                            <span>{comment.userName?.charAt(0)?.toUpperCase() || '?'}</span>
                          )}
                        </div>
                        <div className="views-analytics-user-info">
                          <div className="views-analytics-username">{comment.userName || 'Unknown User'}</div>
                          <div className="views-analytics-user-role">{formatDate(comment.time)}</div>
                        </div>
                      </div>
                      <div className="views-analytics-view-stats" style={{ alignItems: 'flex-end' }}>
                        <div style={{ color: '#bfc9d1', maxWidth: '420px' }}>{comment.comment}</div>
                        {(currentUser?.userName === comment.userName || currentUser?.userName === postAuthor?.userName) && (
                          <button 
                            className="views-analytics-pagination-btn" 
                            style={{ padding: '0.4rem 0.8rem' }}
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deletingCommentId === comment.id}
                          >
                            {deletingCommentId === comment.id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {commentsTotalPages > 1 && (
                <div className="views-analytics-pagination">
                  <div className="views-analytics-pagination-info">
                    Showing {commentsPage * pageSize + 1}-{Math.min((commentsPage + 1) * pageSize, commentsTotalElements)} of {commentsTotalElements} comments
                  </div>
                  <div className="views-analytics-pagination-buttons">
                    <button 
                      className="views-analytics-pagination-btn"
                      onClick={() => setCommentsPage(Math.max(0, commentsPage - 1))}
                      disabled={commentsPage === 0}
                    >
                      ← Previous
                    </button>
                    <span className="views-analytics-page-info">
                      Page {commentsPage + 1} of {commentsTotalPages}
                    </span>
                    <button 
                      className="views-analytics-pagination-btn"
                      onClick={() => setCommentsPage(Math.min(commentsTotalPages - 1, commentsPage + 1))}
                      disabled={commentsPage >= commentsTotalPages - 1}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              <div className="views-analytics-tab-header" style={{ borderTop: '1px solid rgba(120, 120, 255, 0.2)' }}>
                <div className="views-analytics-tab-controls" style={{ justifyContent: 'space-between' }}>
                  <input 
                    type="text" 
                    className="views-analytics-comment-input" 
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(120, 120, 255, 0.3)',
                      borderRadius: '0.8rem',
                      color: '#f3f3f7',
                      padding: '0.6rem 0.8rem'
                    }}
                  />
                  <button 
                    className="views-analytics-pagination-btn"
                    onClick={handleAddComment}
                    disabled={postingComment || !newComment.trim()}
                    style={{ marginLeft: '0.8rem' }}
                  >
                    {postingComment ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewsAnalytics;