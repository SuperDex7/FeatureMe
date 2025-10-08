import React, { useEffect, useState } from 'react';
import Header3 from '../Components/Header';
import Footer from '../Components/Footer';
import Spotlight from '../Components/Spotlight';
import Notifications from '../Components/Notifications';
import ShowFollow from '../Components/ShowFollow';
import ViewsAnalyticsCard from '../Components/ViewsAnalyticsCard';
import FriendSuggestions from '../Components/FriendSuggestions';
import { UserRelationsService, clearMyNotifications } from '../services/UserService';
import '../Styling/Homepage.css';
import axios from 'axios';
import api from '../services/AuthService';

function Homepage2() {
  const [trendsTab, setTrendsTab] = useState('trends');
  const [latestModalOpen, setLatestModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true);
  const [latestPost, setLatestPostt] = useState(null)
  const [length, setLength] = useState(0);
  const [showFollow, setShowFollow] = useState(false)
  const [followPopupType, setFollowPopupType] = useState('followers')
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false)
  const [relationshipSummary, setRelationshipSummary] = useState(null)

  useEffect(() =>{
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Use the new /me endpoint to get current user info
        const response = await api.get('/user/me');
        setUser(response.data);
        
        // Get relationship summary for current user
        const relationshipResponse = await UserRelationsService.getRelationshipSummary(response.data.userName);
        setRelationshipSummary(relationshipResponse.data);
        
        // Get latest post if user has posts
        if (response.data.posts && response.data.posts.length > 0) {
          const postResponse = await api.get(`/posts/get/id/${response.data.posts[0]}`);
          setLatestPostt(postResponse.data);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setIsLoading(false);
        // If authentication fails, redirect to login
        window.location.href = '/login';
      }
    };
    
    fetchData();
  }, [])

  if (isLoading) {
    return (
      <div className="home-loading-screen">
        <div className="home-loading-spinner">
          <div className="home-spinner"></div>
          <span>Loading your profile...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (!user) {
    return (
      <div className="home-error-screen">
        <h2>Error loading profile</h2>
        <p>Please try refreshing the page or logging in again.</p>
      </div>
    );
  }

  // Modal close handler (click outside or close button)
  const handleModalClose = (e) => {
    if (e.target.classList.contains('home-modal-overlay') || e.target.classList.contains('home-modal-close-btn')) {
      setLatestModalOpen(false);
      setActivityModalOpen(false);
      setAnalyticsModalOpen(false);
    }
  };

  const showTheFollow = (type) => {
    setFollowPopupType(type)
    setShowFollow(true)
  }

  const closeFollowPopup = () => {
    setShowFollow(false)
  }

  const handleClearAllNotifications = async (e) => {
    if (e) e.stopPropagation();
    try {
      await clearMyNotifications();
      setUser(prev => prev ? { ...prev, notifications: [] } : prev);
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
  }

  return (
    <div className={`home-container${latestModalOpen ? ' home-modal-open' : ''}`}>
      <Header3 />
      
      <main className="home-main-content">
        {/* Welcome Section */}
        <section className="home-welcome-section">
          <div className="home-welcome-card">
            <div className="home-profile-section">
              <div className="home-avatar-container">
                <img className="home-profile-avatar" src={user.profilePic} alt="avatar" />
                <div className="home-online-indicator"></div>
              </div>
              <div className="home-profile-info">
                <h1 className="home-welcome-text">Welcome back,</h1>
                <h2 className="home-username">
                  <a href={`/profile/${user.userName}`}>{user.userName}</a>
                </h2>
                <p className="home-profile-subtitle">Ready to create something amazing?</p>
              </div>
            </div>
            
            <div className="home-quick-actions">
              <a href="/create-post" className="home-action-btn home-action-primary">
                <span className="home-action-icon">🎵</span>
                <span>Upload Beat</span>
              </a>
              <a href="/create-post" className="home-action-btn home-action-secondary">
                <span className="home-action-icon">🎤</span>
                <span>Upload Song</span>
              </a>
              <a href="/create-post" className="home-action-btn home-action-tertiary">
                <span className="home-action-icon">🎹</span>
                <span>Upload Loop</span>
              </a>
            </div>
          </div>
        </section>

        {/* Stats Dashboard */}
        <section className="home-stats-section">
          <div className="home-stats-grid">
            <div className="home-stat-card">
              <div className="home-stat-icon">📝</div>
              <div className="home-stat-content">
                <span className="home-stat-number">{user?.posts?.length || 0}</span>
                <span className="home-stat-label">Posts</span>
              </div>
            </div>
            
            <div className="home-stat-card home-stat-clickable" onClick={() => showTheFollow('followers')}>
              <div className="home-stat-icon">👥</div>
              <div className="home-stat-content">
                <span className="home-stat-number">{relationshipSummary?.followersCount || 0}</span>
                <span className="home-stat-label">Followers</span>
              </div>
            </div>
            
            <div className="home-stat-card home-stat-clickable" onClick={() => showTheFollow('following')}>
              <div className="home-stat-icon">🔗</div>
              <div className="home-stat-content">
                <span className="home-stat-number">{relationshipSummary?.followingCount || 0}</span>
                <span className="home-stat-label">Following</span>
              </div>
            </div>
            
            <div className="home-stat-card">
              <div className="home-stat-icon">❤️</div>
              <div className="home-stat-content">
                <span className="home-stat-number">{user?.notifications?.length || 0}</span>
                <span className="home-stat-label">Notifications</span>
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <div className="home-content-grid">
          {/* Activity Feed */}
          <section className="home-activity-card" onClick={() => setActivityModalOpen(true)}>
            <div className="home-card-header">
              <h3 className="home-card-title">Recent Activity</h3>
              <span className="home-card-badge">{user?.notifications?.length || 0}</span>
            </div>
            
            <div className="home-activity-content">
              {user.notifications !== null && user.notifications.length !== 0 ? (
                <Notifications notifications={user.notifications.slice(0, 3)} className="home-activity-list" />
              ) : (
                <div className="home-empty-state">
                  <span className="home-empty-icon">🔔</span>
                  <p>No notifications yet</p>
                </div>
              )}
            </div>
            
            <button 
              className="home-view-all-btn" 
              onClick={e => {e.stopPropagation(); setActivityModalOpen(true);}}
            >
              View All Activity
            </button>
          </section>

          {/* Latest Post */}
          <section className="home-latest-post-card" onClick={() => setLatestModalOpen(true)}>
            <div className="home-card-header">
              <h3 className="home-card-title">Latest Post</h3>
              {latestPost && <span className="home-card-badge home-badge-success">New</span>}
            </div>
            
            <div className="home-latest-content">
              {latestPost ? (
                <>
                  <div className="home-post-preview">
                    <h4 className="home-post-title">{latestPost.title}</h4>
                    <p className="home-post-description">{latestPost.description}</p>
                    <div className="home-post-meta">
                      <span className="home-post-date">{new Date(latestPost.time).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="home-post-stats">
                    <div className="home-post-stat">
                      <span className="home-stat-emoji">👍</span>
                      <span>{latestPost?.likes?.length || 0}</span>
                    </div>
                    <div className="home-post-stat">
                      <span className="home-stat-emoji">💬</span>
                      <span>{latestPost?.totalComments || 0}</span>
                    </div>
                    <div className="home-post-stat">
                      <span className="home-stat-emoji">⬇️</span>
                      <span>{latestPost?.totalDownloads || 0}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="home-empty-state">
                  <span className="home-empty-icon">📝</span>
                  <p>No posts yet</p>
                  <a href="/create-post" className="home-create-first-btn">Create Your First Post</a>
                </div>
              )}
            </div>
            
            {latestPost && (
              <button 
                className="home-view-post-btn" 
                onClick={e => {e.stopPropagation(); setLatestModalOpen(true);}}
              >
                View Post
              </button>
            )}
          </section>
        </div>

        {/* Analytics Section */}
        <section className="home-analytics-section">
          {user.role === 'USERPLUS' ? (
            <div className="home-analytics-card home-premium-card" onClick={() => setAnalyticsModalOpen(true)}>
              <div className="home-analytics-header">
                <div className="home-analytics-icon">📊</div>
                <div className="home-analytics-info">
                  <h3>View Analytics</h3>
                  <p>Track your posts performance and engagement</p>
                </div>
                <div className="home-analytics-arrow">→</div>
              </div>
              <div className="home-analytics-stats">
                <span>{user?.posts?.length || 0} Posts</span>
                <span>•</span>
                <span className="home-premium-badge">Premium</span>
              </div>
            </div>
          ) : (
            <div className="home-analytics-card home-upgrade-card" onClick={() => alert('Get a Plus Membership to view analytics')}>
              <div className="home-analytics-header">
                <div className="home-analytics-icon">📊</div>
                <div className="home-analytics-info">
                  <h3>View Analytics</h3>
                  <p>Track your posts performance and engagement</p>
                </div>
                <div className="home-analytics-arrow">→</div>
              </div>
              <div className="home-analytics-stats">
                <span>{user?.posts?.length || 0} Posts</span>
                <span>•</span>
                <span className="home-upgrade-badge">Upgrade Required</span>
              </div>
            </div>
          )}
        </section>

        {/* Friend Suggestions */}
        <section className="home-suggestions-section">
          <FriendSuggestions limit={5} />
        </section>

        {/* Community Section */}
        <section className="home-community-section">
          <div className="home-community-card">
            <div className="home-community-header">
              <h2 className="home-community-title">Community</h2>
              <div className="home-community-tabs">
                <button 
                  className={`home-tab ${trendsTab === 'trends' ? 'home-tab-active' : ''}`} 
                  onClick={() => setTrendsTab('trends')}
                >
                  Trends
                </button>
                <button 
                  className={`home-tab ${trendsTab === 'spotlight' ? 'home-tab-active' : ''}`} 
                  onClick={() => setTrendsTab('spotlight')}
                >
                  Spotlight
                </button>
              </div>
            </div>
            
            <div className="home-community-content">
              {trendsTab === 'trends' && (
                <div className="home-trends-placeholder">
                  <div className="home-placeholder-icon">🚧</div>
                  <h3>Under Construction</h3>
                  <p>Trending features coming soon!</p>
                </div>
              )}
              
              {trendsTab === 'spotlight' && (
                <div className="home-spotlight-content">
                  <Spotlight />
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Follow Modal */}
      <ShowFollow 
        userName={user?.userName}
        isOpen={showFollow}
        onClose={closeFollowPopup}
        type={followPopupType}
      />

      {/* Latest Post Modal */}
      <div className={`home-modal-overlay ${latestModalOpen ? 'home-modal-overlay-open' : ''}`} onClick={handleModalClose}>
        <div className={`home-modal-content home-latest-modal ${latestModalOpen ? 'home-modal-content-open' : ''}`} onClick={e => e.stopPropagation()}>
          <button className="home-modal-close-btn" onClick={handleModalClose}>&times;</button>
          
          <div className="home-modal-header">
            <img src={user.banner} alt="Banner" className="home-modal-banner" />
            <div className="home-modal-avatar-container">
              <img className="home-modal-avatar" src={user.profilePic} alt="avatar" />
            </div>
          </div>
          
          {latestPost ? (
            <div className="home-modal-body">
              <div className="home-modal-post-content">
                <h4 className="home-modal-post-title">{latestPost.title}</h4>
                <div className="home-modal-post-stats">
                  <span className="home-modal-stat">
                    <span className="home-stat-emoji">👍</span> 
                    {latestPost.likes.length} Likes
                  </span>
                  <span className="home-modal-stat">
                    <span className="home-stat-emoji">💬</span> 
                    {latestPost?.totalComments || 0} Comments
                  </span>
                  <span className="home-modal-stat">
                    <span className="home-stat-emoji">⬇️</span> 
                    {latestPost?.totalDownloads || 0} Downloads
                  </span>
                </div>
                <p className="home-modal-post-description">{latestPost.description}</p>
              </div>
              <a href={`/post/${latestPost.id}`}>
                <button className="home-modal-action-btn">Go to Post</button>
              </a>
            </div>
          ) : (
            <div className="home-modal-empty">
              <span className="home-empty-icon">📝</span>
              <p>Upload a post to see it here</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Modal */}
      <div className={`home-modal-overlay ${activityModalOpen ? 'home-modal-overlay-open' : ''}`} onClick={handleModalClose}>
        <div className={`home-modal-content home-activity-modal ${activityModalOpen ? 'home-modal-content-open' : ''}`} onClick={e => e.stopPropagation()}>
          <button className="home-modal-close-btn" onClick={handleModalClose}>&times;</button>
          
          <div className="home-modal-header">
            <h3 className="home-modal-title">All Notifications</h3>
            {user.notifications && user.notifications.length > 0 && (
              <button className="home-clear-all-btn" onClick={handleClearAllNotifications}>
                Clear All
              </button>
            )}
          </div>
          
          <div className="home-modal-body">
            {user.notifications !== null && user.notifications.length !== 0 ? (
              <Notifications notifications={user.notifications} className="home-modal-notifications" />
            ) : (
              <div className="home-modal-empty">
                <span className="home-empty-icon">🔔</span>
                <p>No Notifications Yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Modal */}
      <div className={`home-modal-overlay ${analyticsModalOpen ? 'home-modal-overlay-open' : ''}`} onClick={handleModalClose}>
        <div className={`home-modal-content home-analytics-modal ${analyticsModalOpen ? 'home-modal-content-open' : ''}`} onClick={e => e.stopPropagation()}>
          <button className="home-modal-close-btn" onClick={handleModalClose}>&times;</button>
          
          <div className="home-modal-header">
            <h3 className="home-modal-title">📊 View Analytics</h3>
            <p className="home-modal-subtitle">Track your posts performance and engagement</p>
          </div>
          
          <div className="home-modal-body">
            <ViewsAnalyticsCard />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Homepage2;
