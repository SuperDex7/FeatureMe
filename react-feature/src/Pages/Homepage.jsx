import React, { useEffect, useState } from 'react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import Spotlight from '../Components/Spotlight';
import Notifications from '../Components/Notifications';
import ShowFollow from '../Components/ShowFollow';
import ViewsAnalyticsCard from '../Components/ViewsAnalyticsCard';
import FriendSuggestions from '../Components/FriendSuggestions';
import { UserRelationsService } from '../services/UserService';
import '../Styling/HomepageModern.css';
import axios from 'axios';
import api from '../services/AuthService';

function Homepage() {
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
        console.log(response.data);
        
        // Get relationship summary for current user
        const relationshipResponse = await UserRelationsService.getRelationshipSummary(response.data.userName);
        setRelationshipSummary(relationshipResponse.data);
        console.log('Relationship summary:', relationshipResponse.data);
        
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
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Loading your profile...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (!user) {
    return (
      <div className="error-screen">
        <h2>Error loading profile</h2>
        <p>Please try refreshing the page or logging in again.</p>
      </div>
    );
  }
  
  const trendingPosts = [
    { id: 1, title: 'Synthwave Dreams', author: 'DJ Nova', cover: 'pb.jpg', likes: 120 },
    { id: 2, title: 'Lo-Fi Chill', author: 'LoFiCat', cover: 'dpp.jpg', likes: 98 },
    { id: 3, title: 'Trap Beat', author: '808King', cover: 'pb.jpg', likes: 87 },
  ];
  const topUsers = [
    { id: 1, name: 'DJ Nova', avatar: 'dpp.jpg', followers: 3200 },
    { id: 2, name: 'LoFiCat', avatar: 'pb.jpg', followers: 2800 },
    { id: 3, name: '808King', avatar: 'dpp.jpg', followers: 2500 },
  ];
  const recentActivity = [
    { id: 1, text: 'StrongBoy123 followed you' },
    { id: 2, text: 'AK2003 liked your post' },
    { id: 3, text: 'Over9000 commented on your post' },
  ];
  

  // Modal close handler (click outside or close button)
  const handleModalClose = (e) => {
  
    if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close-btn')) {
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

  return (
    <div className={`homepage-modern-root${latestModalOpen ? ' modal-open' : ''}`}>
      <Header />
      <main className="homepage-modern-main">
        {/* Hero Card */}
        <section className="hero-card glass-card">
          <div className="hero-avatar-section">
            <img className="hero-avatar" src={user.profilePic} alt="avatar" />
            <div>
              <div className="hero-greeting">Welcome back,</div>
              <div ><a className='hero-username' href={`/profile/${user.userName}`} >{user.userName}</a></div>
              <div className="hero-upload-options">
                <a href="/create-post"><span className="upload-option">Beat</span></a>
                <a href="/create-post"><span className="upload-option">Song</span></a>
                <a href="/create-post"><span className="upload-option">Instrument</span></a>
                <a href="/create-post"><span className="upload-option">Loop</span></a>
              </div>
            </div>
          </div>
          <div className="hero-stats-row">
            <div className="hero-stat"><span>{user?.posts?.length || 0}</span><label>Posts</label></div>
            <div className="hero-stat"><span>{relationshipSummary?.followersCount || 0}</span><label className="clickable" onClick={() => showTheFollow('followers')}>Followers</label></div>
            <div className="hero-stat"><span>{relationshipSummary?.followingCount || 0}</span><label className="clickable" onClick={() => showTheFollow('following')}>Following</label></div>
           
          </div>
        </section>
        
{/* Activity & Latest Post */}
        <div className="activity-latest-row">
          <section className="activity-card glass-card card-balanced" onClick={() => setActivityModalOpen(true)} style={{cursor: 'pointer'}}>
            <h3>Recent Activity</h3>
            {user.notifications !== null && user.notifications.length !==0 ?(
            <Notifications notifications={user.notifications.slice(0,3)} className="activity-modal-list" />
            ): "No Notifications Yet"}
            <button className="activity-viewall-btn" onClick={e => {e.stopPropagation(); setActivityModalOpen(true);}}>View All</button>
            
          </section>
          <section className="latest-post-card glass-card card-balanced" onClick={() => setLatestModalOpen(true)} style={{cursor: 'pointer'}}>
            <h3>Your Latest Post</h3>
            {latestPost && (
              <>
            <div className="latest-post-title">{latestPost.title}</div>
            <div className="latest-post-date">{new Date(latestPost.time).toLocaleDateString()}</div>
            <div className="latest-post-desc">{latestPost.description}</div>
            <div className="latest-post-stats">
              <span className="latest-post-likes"><span role="img" aria-label="likes">👍</span> {latestPost?.likes?.length || 0}</span>
              <span className="latest-post-comments"><span role="img" aria-label="comments">💬</span> {latestPost?.totalComments || 0}</span>
              <span className="latest-post-downloads"><span role="img" aria-label="downloads">⬇️</span> {latestPost?.totalDownloads || 0}</span>
            </div>
            <button className="latest-post-btn" onClick={e => {e.stopPropagation(); setLatestModalOpen(true);}}>View Post</button>
            </>
            ) || "No posts yet"}
          </section>
        </div>

        {/* View Analytics Card */}
        {user.role === 'USERPLUS' && (
        <section className="analytics-preview-card glass-card" onClick={() => setAnalyticsModalOpen(true)} style={{cursor: 'pointer'}}>
          <div className="analytics-preview-content">
            <div className="analytics-preview-icon">📊</div>
            <div className="analytics-preview-text">
              <h3>View Analytics</h3>
              <p>Track your posts performance and engagement</p>
              <div className="analytics-preview-stats">
                <span>{user?.posts?.length || 0} Posts</span>
                <span>•</span>
                <span>Premium Feature</span>
              </div>
            </div>
            <div className="analytics-preview-arrow">→</div>
          </div>
        </section>
        )|| <section className="analytics-preview-card glass-card" onClick={() => alert('Get a Plus Membership to view analytics')} style={{cursor: 'pointer'}}>
        <div className="analytics-preview-content">
          <div className="analytics-preview-icon">📊</div>
          <div className="analytics-preview-text">
            <h3>View Analytics</h3>
            <p>Track your posts performance and engagement</p>
            <div className="analytics-preview-stats">
              <span>{user?.posts?.length || 0} Posts</span>
              <span>•</span>
              <span>Premium Feature</span>
            </div>
          </div>
          <div className="analytics-preview-arrow">→</div>
        </div>
      </section>}
        {/* Friend Suggestions */}
        <FriendSuggestions limit={5} />

        {/* Community Trends/Spotlight Tabbed Card */}
        <section className="trends-card glass-card">
          <h2 className="trends-title">Community Trends</h2>
          <div className="trends-tabs-row">
            <button className={`trends-tab${trendsTab === 'trends' ? ' trends-tab-active' : ''}`} onClick={() => setTrendsTab('trends')}>Trends</button>
            <button className={`trends-tab${trendsTab === 'spotlight' ? ' trends-tab-active' : ''}`} onClick={() => setTrendsTab('spotlight')}>Spotlight</button>
          </div>
          <div className="trends-tab-content">
            { trendsTab === 'trends' && (
              <h1 id='underCon'>Under Construction</h1>
            ) }
            
            {/* trendsTab === 'trends' && (
              <div className="trends-section">
                <div className="trending-posts">
                  <h3>Trending Posts</h3>
                  <div className="trending-posts-list">
                    {trendingPosts.map(post => (
                      <div className="trending-post-card" key={post.id}>
                        <img src={post.cover} alt="cover" className="trending-post-cover" />
                        <div className="trending-post-info">
                          <div className="trending-post-title">{post.title}</div>
                          <div className="trending-post-author">by {post.author}</div>
                          <div className="trending-post-likes">&#x1F44D; {post.likes}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="top-users">
                  <h3>Top Artists</h3>
                  <div className="top-users-list">
                    {topUsers.map(user => (
                      <div className="top-user-card" key={user.id}>
                        <img src={user.avatar} alt="avatar" className="top-user-avatar" />
                        <div className="top-user-name">{user.name}</div>
                        <div className="top-user-followers">{user.followers.toLocaleString()} followers</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) */}
            {trendsTab === 'spotlight' && (
              <div className="spotlight-tab-content">
                <Spotlight />
              </div>
            )}
          </div>
        </section>

        
        <ShowFollow 
          userName={user?.userName}
          isOpen={showFollow}
          onClose={closeFollowPopup}
          type={followPopupType}
        />
        
      </main>
      <Footer />
      {/* Modal Popup for Latest Post */}
      
      {latestModalOpen && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content latest-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleModalClose}>&times;</button>
            <div className="modal-banner-section">
              <img src={user.banner} alt="Banner" className="modal-banner-image" />
              <div className="modal-avatar-container">
                <img className="modal-avatar" src={user.profilePic} alt="avatar" />
              </div>
            </div>
            {latestPost && (
              <>
            <div className="modal-main-content">
              <div className="latest-post-full-content">
                <h4>{latestPost.title}</h4>
                <div className="latest-post-modal-stats">
                  <span className="latest-post-likes"><span role="img" aria-label="likes">👍</span> {latestPost.likes.length} Likes</span>
                  <span className="latest-post-comments"><span role="img" aria-label="comments">💬</span> {latestPost?.totalComments || 0} Comments</span>
                  <span className="latest-post-downloads"><span role="img" aria-label="downloads">⬇️</span> {latestPost?.totalDownloads || 0} Downloads</span>
                </div>
                <p>{latestPost.description}</p>
                
              </div>
              <a href={`/post/${latestPost.id}`}><button className="latest-post-btn" style={{marginTop: '1.5rem'}} >Go to Post</button></a>
            </div>
            </>
            )|| "Upload a post to see it here"}
          </div>
          </div>
        )}
      
      {/* Modal Popup for Activity */}
      {activityModalOpen && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content activity-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleModalClose}>&times;</button>
            <h3 className="activity-modal-title">All Notifications</h3>
            {user.notifications !== null && user.notifications.length !== 0 ?(
            <Notifications notifications={user.notifications} className="activity-modal-list" />
            ): "No Notifications Yet"}
          </div>
        </div>
        )}

      {/* Analytics Modal */}
      {analyticsModalOpen && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content analytics-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleModalClose}>&times;</button>
            <div className="analytics-modal-header">
              <h3>📊 View Analytics</h3>
              <p>Track your posts performance and engagement</p>
            </div>
            <div className="analytics-modal-body">
              <ViewsAnalyticsCard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Homepage;