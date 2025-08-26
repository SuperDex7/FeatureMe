import React, { useEffect, useState } from 'react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import Spotlight from '../Components/Spotlight';
import Notifications, { dummyNotifications } from '../Components/Notifications';
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
  const userString = localStorage.getItem('user');
  const userrr = JSON.parse(userString);
  //console.log(userrr)
// Add null check for user
  if (!userrr || !userrr.username) {
    console.error('No user data found');
    setIsLoading(false);
    window.location.href = '/login';
    return;
  }
  useEffect(() =>{
    
    setIsLoading(true);
    axios.get(`http://localhost:8080/api/user/get/${userrr.username}`, {withCredentials:true}).then(response=> {
      setUser(response.data)
      
      //setLength(response.data.posts.length)
      const len = response.data.posts.length - 1
      //console.log(len)
      //setLatestPostt(response.data.posts[0])
      //console.log(response.data.posts.length)
  api.get(`http://localhost:8080/api/posts/get/id/${response.data.posts[len]}`).then(res=>{
  //console.log(res.data)
  setLatestPostt(res.data)
})

      setIsLoading(false);
    }).catch((err)=>{
      console.error(err)
      setIsLoading(false);
    })
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
  // Example data (replace with real data as needed)
  const userr = {
    name: 'SuperDex',
    avatar: 'dpp.jpg',
    posts: 256,
    followers: 1200,
    following: 300,
    profileCompletion: 80,
    banner: 'banner.jpg',
  };
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
  const latestPostt = {
    title: 'My New Track',
    date: '2 days ago',
    description: 'Check out my latest synthwave track!',
    likes: 128,
    shares: 42,
    comments: [
      { id: 1, user: 'LoFiCat', text: 'Love this vibe!' },
      { id: 2, user: 'SynthMaster', text: 'Amazing production!' },
      { id: 3, user: 'AK2003', text: 'On repeat!' },
    ],
  };

  // Modal close handler (click outside or close button)
  const handleModalClose = (e) => {
  
    if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close-btn')) {
      setLatestModalOpen(false);
      setActivityModalOpen(false);
    }
  };

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
              <div ><a className='hero-username' href="/profile">{user.userName}</a></div>
              <div className="hero-upload-options">
                <span className="upload-option">Beat</span>
                <span className="upload-option">Song</span>
                <span className="upload-option">Instrument</span>
                <span className="upload-option">Loop</span>
              </div>
            </div>
          </div>
          <div className="hero-stats-row">
            <div className="hero-stat"><span>{user?.posts?.length || 0}</span><label>Posts</label></div>
            <div className="hero-stat"><span>{user?.followers?.length || 0}</span><label>Followers</label></div>
            <div className="hero-stat"><span>{user?.following?.length || 0}</span><label>Following</label></div>
            <div className="hero-progress">
              <label>Profile</label>
              <div className="hero-progress-bar">
                <div className="hero-progress-bar-fill" style={{width: user.profileCompletion + '%'}}></div>
              </div>
              <span className="hero-progress-label">{userr.profileCompletion}%</span>
            </div>
          </div>
        </section>

        {/* Community Trends/Spotlight Tabbed Card */}
        <section className="trends-card glass-card">
          <h2 className="trends-title">Community Trends</h2>
          <div className="trends-tabs-row">
            <button className={`trends-tab${trendsTab === 'trends' ? ' trends-tab-active' : ''}`} onClick={() => setTrendsTab('trends')}>Trends</button>
            <button className={`trends-tab${trendsTab === 'spotlight' ? ' trends-tab-active' : ''}`} onClick={() => setTrendsTab('spotlight')}>Spotlight</button>
          </div>
          <div className="trends-tab-content">
            {trendsTab === 'trends' && (
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
            )}
            {trendsTab === 'spotlight' && (
              <div className="spotlight-tab-content">
                <Spotlight />
              </div>
            )}
          </div>
        </section>

        {/* Activity & Latest Post */}
        <div className="activity-latest-row">
          <section className="activity-card glass-card card-balanced" onClick={() => setActivityModalOpen(true)} style={{cursor: 'pointer'}}>
            <h3>Recent Activity</h3>
            <Notifications notifications={dummyNotifications.slice(0, 3)} className="activity-list" />
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
              <span className="latest-post-shares"><span role="img" aria-label="shares">🔗</span> {latestPost?.comments?.length || 0}</span>
            </div>
            <button className="latest-post-btn" onClick={e => {e.stopPropagation(); setLatestModalOpen(true);}}>View Post</button>
            </>
            ) || "No posts yet"}
          </section>
        </div>
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
                  <span className="latest-post-shares"><span role="img" aria-label="shares">🔗</span> {latestPost?.comments?.length || 0} Shares</span>
                </div>
                <p>{latestPost.description}</p>
                <div className="latest-post-comments-section">
                  <h5>Comments</h5>
                  
                  <ul className="latest-post-comments-list">
                    { latestPost?.comments?.map((c, idx) => (
                      <li key={idx}><span className="comment-user">user:</span> {c}</li>
                    )) || "No Comments yet"}
                  </ul>
                </div>
                <div className="latest-post-comments-placeholder">Add your comment feature coming soon...</div>
              </div>
              <button className="latest-post-btn" style={{marginTop: '1.5rem'}} onClick={() => {/* future: go to post url */}}>Go to Post</button>
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
            <Notifications notifications={dummyNotifications} className="activity-modal-list" />
          </div>
        </div>
      )}
    </div>
  );
}

export default Homepage;