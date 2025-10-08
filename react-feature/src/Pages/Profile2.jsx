import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getCurrentUser } from '../services/AuthService';
import { UserRelationsService, updateProfile, changePassword, deleteAccount } from '../services/UserService';
import { getPostsByUser, getFeaturedPosts } from '../services/PostsService';
import DemoService from '../services/DemoService';
import BadgeService from '../services/BadgeService';
import FeedItem from '../Components/FeedItem';
import ShowFollow from '../Components/ShowFollow';
import DemoGrid from '../ProfileComponets/DemoGrid';
import AddDemo from '../ProfileComponets/AddDemo';
import Header from '../Components/Header';
import './Profile.css';
import Footer from '../Components/Footer'

const Profile2 = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  
  // Core state
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Content tabs
  const [activeTab, setActiveTab] = useState('demos');
  const [posts, setPosts] = useState([]);
  const [demos, setDemos] = useState([]);
  const [features, setFeatures] = useState([]);
  
  // Pagination
  const [postsPage, setPostsPage] = useState(0);
  const [featPage, setFeatPage] = useState(0);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const [featHasMore, setFeatHasMore] = useState(true);
  const [postsTotalPages, setPostsTotalPages] = useState(0);
  const [featTotalPages, setFeatTotalPages] = useState(0);
  const pageSize = 6;
  
  // Follow system
  const [isFollowing, setIsFollowing] = useState(false);
  const [relationshipSummary, setRelationshipSummary] = useState(null);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState('');
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    location: '',
    about: '',
    socialMedia: [],
    profilePic: '',
    banner: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [uploadMethod, setUploadMethod] = useState({
    profilePic: 'url', // 'url' or 'file'
    banner: 'url'      // 'url' or 'file'
  });
  
  // Social links
  const [newSocialLink, setNewSocialLink] = useState('');
  const [socialLinkError, setSocialLinkError] = useState('');
  
  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Account deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // About modal
  const [showAboutModal, setShowAboutModal] = useState(false);
  
  // Demo management
  const [showAddDemo, setShowAddDemo] = useState(false);
  
  // Load initial data
  useEffect(() => {
    loadProfileData();
  }, [username]);
  
  // Reset pagination when tab changes
  useEffect(() => {
    if (activeTab === 'posts') {
      setPostsPage(0);
      setPostsHasMore(true);
      loadPosts(0, true);
    } else if (activeTab === 'features') {
      setFeatPage(0);
      setFeatHasMore(true);
      loadFeatures(0, true);
    } else if (activeTab === 'demos') {
      loadDemos();
    }
  }, [activeTab, user]);
  
  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [userData, currentUserData] = await Promise.all([
        api.get(`/user/get/${username}`),
        getCurrentUser()
      ]);
      
      setUser(userData.data);
      setCurrentUser(currentUserData);
      
      // Load relationship data for all profiles to get follower/following counts
      loadRelationshipData();
      
      // Initialize edit form
      setEditForm({
        bio: userData.data.bio || '',
        location: userData.data.location || '',
        about: userData.data.about || '',
        socialMedia: userData.data.socialMedia || [],
        profilePic: userData.data.profilePic || '',
        banner: userData.data.banner || ''
      });
      
      // Load initial content
      if (activeTab === 'posts') {
        loadPosts(0, true);
      } else if (activeTab === 'demos') {
        loadDemos();
      }
      
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };
  
  const loadRelationshipData = async () => {
    try {
      const isOwnProfile = currentUser?.userName === username;
      
      if (isOwnProfile) {
        // For own profile, only need relationship summary for follower/following counts
        const summaryResponse = await UserRelationsService.getRelationshipSummary(username);
        setRelationshipSummary(summaryResponse.data);
        setIsFollowing(false); // You can't follow yourself
      } else {
        // For other profiles, need both following status and relationship summary
        const [followingResponse, summaryResponse] = await Promise.all([
          UserRelationsService.isFollowing(username),
          UserRelationsService.getRelationshipSummary(username)
        ]);
        
        setIsFollowing(followingResponse.data);
        setRelationshipSummary(summaryResponse.data);
      }
    } catch (err) {
      console.error('Error loading relationship data:', err);
    }
  };
  
  const loadPosts = async (page = 0, reset = false) => {
    if (!user) return;
    
    // Only make API request if user has posts
    if (!user.posts || user.posts.length === 0) {
      setPosts([]);
      setPostsTotalPages(0);
      return;
    }
    
    try {
      const response = await getPostsByUser(user.posts, page, pageSize);
      const newPosts = response.data.content || [];
      
      // Always replace posts for proper pagination (not append)
      setPosts(newPosts);
      setPostsTotalPages(response.data.page?.totalPages || response.data.totalPages || 0);
      setPostsHasMore(page < (response.data.page?.totalPages || response.data.totalPages) - 1);
      setPostsPage(page);
    } catch (err) {
      console.error('Error loading posts:', err);
      setPosts([]);
      setPostsTotalPages(0);
    }
  };
  
  const loadDemos = async () => {
    if (!user) return;
    
    // Only make API request if user has demos
    if (!user.demo || user.demo.length === 0) {
      setDemos([]);
      return;
    }
    
    try {
      const response = await DemoService.getUserDemos(user.id);
      setDemos(response);
    } catch (err) {
      console.error('Error loading demos:', err);
      setDemos([]);
    }
  };
  
  const loadFeatures = async (page = 0, reset = false) => {
    if (!user) return;
    
    // Only make API request if user has featured content
    if (!user.featuredOn || user.featuredOn.length === 0) {
      setFeatures([]);
      setFeatTotalPages(0);
      return;
    }
    
    try {
      const response = await getFeaturedPosts(user.featuredOn, page, pageSize);
      const newFeatures = response.data.content || [];
      
      // Always replace features for proper pagination (not append)
      setFeatures(newFeatures);
      setFeatTotalPages(response.data.page?.totalPages || response.data.totalPages || 0);
      setFeatHasMore(page < (response.data.page?.totalPages || response.data.totalPages) - 1);
      setFeatPage(page);
    } catch (err) {
      console.error('Error loading features:', err);
      setFeatures([]);
      setFeatTotalPages(0);
    }
  };

  // Pagination helper functions
  const nextPostsPage = () => {
    if (postsPage < postsTotalPages - 1) {
      loadPosts(postsPage + 1);
    }
  };

  const prevPostsPage = () => {
    if (postsPage > 0) {
      loadPosts(postsPage - 1);
    }
  };

  const nextFeatPage = () => {
    if (featPage < featTotalPages - 1) {
      loadFeatures(featPage + 1);
    }
  };

  const prevFeatPage = () => {
    if (featPage > 0) {
      loadFeatures(featPage - 1);
    }
  };
  
  const handleFollow = async () => {
    if (!currentUser) return;
    
    try {
      await UserRelationsService.toggleFollow(username);
      setIsFollowing(!isFollowing);
      loadRelationshipData(); // Refresh counts
    } catch (err) {
      console.error('Error toggling follow:', err);
      alert('Failed to update follow status');
    }
  };
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser || currentUser.userName !== username) return;
    
    setEditLoading(true);
    setEditError('');
    
    try {
      // Create FormData for file uploads if needed
      const formData = new FormData();
      
      // Add text fields - create a User object structure
      const userData = {
        bio: editForm.bio,
        location: editForm.location,
        about: editForm.about,
        socialMedia: editForm.socialMedia
      };
      
      // Only add profilePic and banner URLs if using URL method
      if (uploadMethod.profilePic === 'url') {
        userData.profilePic = editForm.profilePic;
      }
      if (uploadMethod.banner === 'url') {
        userData.banner = editForm.banner;
      }
      
      formData.append('user', new Blob([JSON.stringify(userData)], { type: 'application/json' }));
      
      // Add files if using file upload method
      if (uploadMethod.profilePic === 'file' && fileInputRef.current?.files[0]) {
        formData.append('pp', fileInputRef.current.files[0]); // Note: Profile.jsx uses 'pp', not 'profilePic'
      }
      
      if (uploadMethod.banner === 'file' && bannerInputRef.current?.files[0]) {
        formData.append('banner', bannerInputRef.current.files[0]);
      }
      
      // Add upload method info
      formData.append('profilePicMethod', uploadMethod.profilePic);
      formData.append('bannerMethod', uploadMethod.banner);
      
      const response = await updateProfile(formData, true); // true indicates multipart form data
      
      // Reload profile data
      await loadProfileData();
      setIsEditing(false);
      alert('Profile updated successfully!');
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setEditError('Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };
  
  const handleSocialLinkAdd = () => {
    if (!newSocialLink.trim()) {
      setSocialLinkError('Please enter a valid URL');
      return;
    }
    
    if (editForm.socialMedia.length >= 6) {
      setSocialLinkError('Maximum 6 social links allowed');
      return;
    }
    
    // Basic URL validation
    try {
      new URL(newSocialLink);
    } catch {
      setSocialLinkError('Please enter a valid URL');
      return;
    }
    
    setEditForm(prev => ({
      ...prev,
      socialMedia: [...prev.socialMedia, newSocialLink]
    }));
    
    setNewSocialLink('');
    setSocialLinkError('');
  };
  
  const handleSocialLinkRemove = (index) => {
    setEditForm(prev => ({
      ...prev,
      socialMedia: prev.socialMedia.filter((_, i) => i !== index)
    }));
  };
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }
    
    setPasswordError('');
    
    try {
      await changePassword(passwordForm);
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordSuccess('');
      }, 2000);
      
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError('Failed to change password');
    }
  };
  
  const handleAccountDelete = async () => {
    if (deleteConfirm !== 'DELETE') {
      alert('Please type "DELETE" to confirm');
      return;
    }
    
    if (!currentUser || currentUser.userName !== username) return;
    
    setDeleting(true);
    
    try {
      await deleteAccount(user.id);
      
      // Clear cookies and redirect
      document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      navigate('/login');
      
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };
  
  const getPlatformIcon = (url) => {
    const domain = new URL(url).hostname.toLowerCase();
    if (domain.includes('youtube')) return '🎥';
    if (domain.includes('tiktok')) return '🎵';
    if (domain.includes('instagram')) return '📷';
    if (domain.includes('twitter') || domain.includes('x.com')) return '🐦';
    if (domain.includes('facebook')) return '👥';
    if (domain.includes('soundcloud')) return '🎶';
    if (domain.includes('spotify')) return '🎧';
    return '🔗';
  };
  
  const validateFile = (file, type) => {
    const userRole = currentUser?.role || 'USER';
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }
    
    const allowedTypes = userRole === 'USER' 
      ? ['image/jpeg', 'image/jpg', 'image/png']
      : ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    
    if (!allowedTypes.includes(file.type)) {
      const extensions = userRole === 'USER' ? 'JPEG, JPG, PNG' : 'JPEG, PNG, GIF, WebP, BMP';
      return `Only ${extensions} files are allowed`;
    }
    
    return null;
  };
  
  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }
  
  if (error || !user) {
    return (
      <div className="profile-error">
        <h2>Profile not found</h2>
        <p>The user you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/')} className="profile-back-btn">
          Go Home
        </button>
      </div>
    );
  }
  
  const isOwnProfile = currentUser?.userName === username;
  const canEdit = isOwnProfile;
  const canMessage = !isOwnProfile && currentUser;
  
  return (
    <div className="profile-page">
      <Header />
      <div className="profile-container">
        {/* Header Section */}
      <div className="profile-header">
        <div 
          className="profile-banner"
          style={{ 
            backgroundImage: `url('${user.banner || '/default-banner.jpg'}')` 
          }}
        >
          <div className="profile-banner-overlay"></div>
        </div>
        
        <div className={`profile-info ${user.role === 'USERPLUS' ? 'premium-gradient' : ''}`}>
          <div className="profile-avatar-section">
            <img 
              src={user.profilePic || '/dpp.jpg'} 
              alt={user.userName}
              className="profile-avatar"
              onError={(e) => { e.target.src = '/dpp.jpg'; }}
            />
          </div>
          
          <div className="profile-details">
            <div className="profile-name-section">
              <h1 className="profile-username">{user.userName}</h1>
              <div className="profile-badges">
                {user.badges?.map((badge, index) => {
                  const badgeInfo = BadgeService.getBadgeInfo(badge);
                  return (
                    <span 
                      key={index}
                      className="profile-badge"
                      style={{ backgroundColor: badgeInfo.color }}
                      title={badgeInfo.description}
                    >
                      {badgeInfo.icon} {badgeInfo.label}
                    </span>
                  );
                })}
              </div>
            </div>
            
            {user.bio && (
              <p className="profile-bio">{user.bio}</p>
            )}
            
            {user.location && (
              <p className="profile-location">📍 {user.location}</p>
            )}
            
            {/* About Section */}
            {user.about && (
              <div className="profile-about">
                <p className="profile-about-text">
                  {user.about.length > 150 
                    ? `${user.about.substring(0, 150)}...` 
                    : user.about
                  }
                </p>
                {user.about.length > 150 && (
                  <button 
                    className="profile-read-more"
                    onClick={() => setShowAboutModal(true)}
                  >
                    Read More
                  </button>
                )}
              </div>
            )}
            
            {/* Social Links */}
            {user.socialMedia && user.socialMedia.length > 0 && (
              <div className="profile-social-links">
                {user.socialMedia.map((link, index) => (
                  <a 
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-social-link"
                  >
                    {getPlatformIcon(link)} {new URL(link).hostname}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-number">{relationshipSummary?.followersCount || 0}</span>
          <span className="profile-stat-label">Followers</span>
          <button 
            className="profile-stat-clickable"
            onClick={() => {
              setFollowModalType('followers');
              setShowFollowModal(true);
            }}
          >
            View
          </button>
        </div>
        
        <div className="profile-stat">
          <span className="profile-stat-number">{relationshipSummary?.followingCount || 0}</span>
          <span className="profile-stat-label">Following</span>
          <button 
            className="profile-stat-clickable"
            onClick={() => {
              setFollowModalType('following');
              setShowFollowModal(true);
            }}
          >
            View
          </button>
        </div>
        
        <div className="profile-stat">
          <span className="profile-stat-number">{user.posts?.length || 0}</span>
          <span className="profile-stat-label">Posts</span>
        </div>
        
        <div className="profile-stat">
          <span className="profile-stat-number">{user.featuredOn?.length || 0}</span>
          <span className="profile-stat-label">Featured On</span>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="profile-actions">
        {canEdit ? (
          <button 
            className="profile-edit-btn"
            onClick={() => setIsEditing(true)}
          >
            ✏️ Edit Profile
          </button>
        ) : (
          <button 
            className={`profile-follow-btn ${isFollowing ? 'profile-following' : ''}`}
            onClick={handleFollow}
          >
            {isFollowing ? '✓ Following' : '+ Follow'}
          </button>
        )}
        
        {canMessage && (
          <button 
            className="profile-message-btn"
            onClick={() => navigate(`/messages?createChat=true&user=${username}`)}
          >
            💬 Message
          </button>
        )}
        
        {canEdit && (
          <button 
            className="profile-settings-btn"
            onClick={() => setShowPasswordChange(true)}
          >
            ⚙️ Settings
          </button>
        )}
      </div>
      
      {/* Content Tabs */}
      <div className="profile-content">
        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'posts' ? 'profile-active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            📝 Posts ({user.posts?.length || 0})
          </button>
          <button 
            className={`profile-tab ${activeTab === 'demos' ? 'profile-active' : ''}`}
            onClick={() => setActiveTab('demos')}
          >
            🎵 Demos ({user.demo?.length || 0})
          </button>
          <button 
            className={`profile-tab ${activeTab === 'features' ? 'profile-active' : ''}`}
            onClick={() => setActiveTab('features')}
          >
            ⭐ Featured ({user.featuredOn?.length || 0})
          </button>
        </div>
        
        <div className="profile-tab-content">
          {activeTab === 'posts' && (
            <div className="profile-posts">
              {canEdit && (
                <button 
                  className="profile-create-post-btn"
                  onClick={() => navigate('/create-post')}
                >
                  ➕ Create New Post
                </button>
              )}
              
              {posts.length > 0 ? (
                <div className="profile-posts-grid">
                  {posts.map((post) => (
                    <FeedItem
                      key={post.id}
                      id={post.id}
                      author={post.author}
                      title={post.title}
                      description={post.description}
                      time={post.time}
                      features={post.features}
                      genre={post.genre}
                      music={post.music}
                      comments={post.comments}
                      likes={post.likes}
                      totalViews={post.totalViews}
                      totalComments={post.totalComments}
                      freeDownload={post.freeDownload}
                    />
                  ))}
                </div>
              ) : (
                <div className="profile-empty-state">
                  <div className="profile-empty-icon">📝</div>
                  <h3>No posts yet</h3>
                  <p>Start sharing your music with the world!</p>
                  {canEdit && (
                    <button 
                      className="profile-empty-action"
                      onClick={() => navigate('/create-post')}
                    >
                      Create Your First Post
                    </button>
                  )}
                </div>
              )}
              
              {postsTotalPages > 1 && (
                <div className="profile-pagination">
                  <button 
                    className="profile-pagination-btn profile-pagination-prev"
                    onClick={prevPostsPage}
                    disabled={postsPage === 0}
                    title="Previous Page"
                  >
                    <span className="pagination-icon">←</span>
                    <span className="pagination-text">Previous</span>
                  </button>
                  
                  <div className="profile-pagination-info">
                    <span className="pagination-current">{postsPage + 1}</span>
                    <span className="pagination-separator">/</span>
                    <span className="pagination-total">{postsTotalPages}</span>
                  </div>
                  
                  <button 
                    className="profile-pagination-btn profile-pagination-next"
                    onClick={nextPostsPage}
                    disabled={postsPage >= postsTotalPages - 1}
                    title="Next Page"
                  >
                    <span className="pagination-text">Next</span>
                    <span className="pagination-icon">→</span>
                  </button>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'demos' && (
            <div className="profile-demos">
              <DemoGrid
                demos={demos}
                currentUser={currentUser}
                username={username}
                onAddDemo={() => setShowAddDemo(true)}
                onDeleteDemo={async (demoId) => {
                  try {
                    await DemoService.deleteDemo(demoId);
                    loadDemos();
                  } catch (err) {
                    console.error('Error deleting demo:', err);
                    alert('Failed to delete demo');
                  }
                }}
              />
            </div>
          )}
          
          {activeTab === 'features' && (
            <div className="profile-features">
              {features.length > 0 ? (
                <div className="profile-features-grid">
                  {features.map((post) => (
                    <FeedItem
                      key={post.id}
                      id={post.id}
                      author={post.author}
                      title={post.title}
                      description={post.description}
                      time={post.time}
                      features={post.features}
                      genre={post.genre}
                      music={post.music}
                      comments={post.comments}
                      likes={post.likes}
                      totalViews={post.totalViews}
                      totalComments={post.totalComments}
                      freeDownload={post.freeDownload}
                    />
                  ))}
                </div>
              ) : (
                <div className="profile-empty-state">
                  <div className="profile-empty-icon">⭐</div>
                  <h3>Not featured yet</h3>
                  <p>Collaborate with other artists to get featured on their tracks!</p>
                  <div className="profile-tips">
                    <h4>Tips to get featured:</h4>
                    <ul>
                      <li>Network with other artists</li>
                      <li>Share your demos</li>
                      <li>Be active in the community</li>
                      <li>Create high-quality content</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {featTotalPages > 1 && (
                <div className="profile-pagination">
                  <button 
                    className="profile-pagination-btn profile-pagination-prev"
                    onClick={prevFeatPage}
                    disabled={featPage === 0}
                    title="Previous Page"
                  >
                    <span className="pagination-icon">←</span>
                    <span className="pagination-text">Previous</span>
                  </button>
                  
                  <div className="profile-pagination-info">
                    <span className="pagination-current">{featPage + 1}</span>
                    <span className="pagination-separator">/</span>
                    <span className="pagination-total">{featTotalPages}</span>
                  </div>
                  
                  <button 
                    className="profile-pagination-btn profile-pagination-next"
                    onClick={nextFeatPage}
                    disabled={featPage >= featTotalPages - 1}
                    title="Next Page"
                  >
                    <span className="pagination-text">Next</span>
                    <span className="pagination-icon">→</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="profile-modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>Edit Profile</h2>
              <button 
                className="profile-modal-close"
                onClick={() => setIsEditing(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="profile-edit-form">
              <div className="profile-form-group">
                <label>Bio (50 chars)</label>
                <input
                  type="text"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  maxLength={50}
                  placeholder="Short bio..."
                />
                <small className={editForm.bio.length >= 50 ? 'profile-char-limit' : ''}>
                  {editForm.bio.length}/50
                </small>
              </div>
              
              <div className="profile-form-group">
                <label>Location (50 chars)</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  maxLength={50}
                  placeholder="Your location..."
                />
                <small className={editForm.location.length >= 50 ? 'profile-char-limit' : ''}>
                  {editForm.location.length}/50
                </small>
              </div>
              
              <div className="profile-form-group">
                <label>About (250 chars)</label>
                <textarea
                  value={editForm.about}
                  onChange={(e) => setEditForm({...editForm, about: e.target.value})}
                  maxLength={250}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
                <small className={editForm.about.length >= 250 ? 'profile-char-limit' : ''}>
                  {editForm.about.length}/250
                </small>
              </div>
              
              
              {/* Profile Picture */}
              <div className="profile-form-group">
                <label>Profile Picture</label>
                <div className="profile-upload-method">
                  <label>
                    <input
                      type="radio"
                      value="url"
                      checked={uploadMethod.profilePic === 'url'}
                      onChange={(e) => setUploadMethod({...uploadMethod, profilePic: e.target.value})}
                    />
                    URL
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="file"
                      checked={uploadMethod.profilePic === 'file'}
                      onChange={(e) => setUploadMethod({...uploadMethod, profilePic: e.target.value})}
                    />
                    File Upload
                  </label>
                </div>
                
                {uploadMethod.profilePic === 'file' ? (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const error = validateFile(file, 'profile');
                        if (error) {
                          setEditError(error);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                ) : (
                  <input
                    type="url"
                    placeholder="Image URL"
                    value={editForm.profilePic}
                    onChange={(e) => setEditForm({...editForm, profilePic: e.target.value})}
                  />
                )}
              </div>
              
              {/* Banner */}
              <div className="profile-form-group">
                <label>Banner Image</label>
                <div className="profile-upload-method">
                  <label>
                    <input
                      type="radio"
                      value="url"
                      checked={uploadMethod.banner === 'url'}
                      onChange={(e) => setUploadMethod({...uploadMethod, banner: e.target.value})}
                    />
                    URL
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="file"
                      checked={uploadMethod.banner === 'file'}
                      onChange={(e) => setUploadMethod({...uploadMethod, banner: e.target.value})}
                    />
                    File Upload
                  </label>
                </div>
                
                {uploadMethod.banner === 'file' ? (
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const error = validateFile(file, 'banner');
                        if (error) {
                          setEditError(error);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                ) : (
                  <input
                    type="url"
                    placeholder="Banner URL"
                    value={editForm.banner}
                    onChange={(e) => setEditForm({...editForm, banner: e.target.value})}
                  />
                )}
              </div>
              
              {/* Social Links (USERPLUS only) */}
              {currentUser?.role === 'USERPLUS' && (
                <div className="profile-form-group">
                  <label>Social Media Links (Max 6)</label>
                  <div className="profile-social-links-edit">
                    {editForm.socialMedia.map((link, index) => (
                      <div key={index} className="profile-social-link-item">
                        <span>{getPlatformIcon(link)} {link}</span>
                        <button 
                          type="button"
                          onClick={() => handleSocialLinkRemove(index)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    
                    {editForm.socialMedia.length < 6 && (
                      <div className="profile-add-social-link">
                        <input
                          type="url"
                          value={newSocialLink}
                          onChange={(e) => setNewSocialLink(e.target.value)}
                          placeholder="Enter social media URL..."
                        />
                        <button 
                          type="button"
                          onClick={handleSocialLinkAdd}
                        >
                          Add
                        </button>
                      </div>
                    )}
                    
                    {socialLinkError && (
                      <div className="profile-error-message">{socialLinkError}</div>
                    )}
                  </div>
                </div>
              )}
              
              {editError && (
                <div className="profile-error-message">{editError}</div>
              )}
              
              <div className="profile-form-actions">
                <button 
                  type="submit" 
                  disabled={editLoading}
                  className="profile-save-btn"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="profile-cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="profile-modal-overlay" onClick={() => setShowPasswordChange(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>Change Password</h2>
              <button 
                className="profile-modal-close"
                onClick={() => setShowPasswordChange(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handlePasswordChange} className="profile-password-form">
              <div className="profile-form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  required
                />
              </div>
              
              <div className="profile-form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  minLength={6}
                  required
                />
                <small>Minimum 6 characters</small>
              </div>
              
              <div className="profile-form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  required
                />
              </div>
              
              {passwordError && (
                <div className="profile-error-message">{passwordError}</div>
              )}
              
              {passwordSuccess && (
                <div className="profile-success-message">{passwordSuccess}</div>
              )}
              
              <div className="profile-form-actions">
                <button 
                  type="submit"
                  className="profile-save-btn"
                >
                  Change Password
                </button>
                <button 
                  type="button"
                  onClick={() => setShowPasswordChange(false)}
                  className="profile-cancel-btn"
                >
                  Cancel
                </button>
              </div>
              
              <div className="profile-danger-zone">
                <h3>Danger Zone</h3>
                <button 
                  type="button"
                  className="profile-delete-account-btn"
                  onClick={() => setShowDeleteModal(true)}
                >
                  🗑️ Delete Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <div className="profile-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="profile-modal profile-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>Delete Account</h2>
              <button 
                className="profile-modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="profile-delete-content">
              <div className="profile-delete-warning">
                <h3>⚠️ Warning</h3>
                <p>This action cannot be undone. All your data will be permanently deleted:</p>
                <ul>
                  <li>Your profile and posts</li>
                  <li>All demos and uploads</li>
                  <li>Comments and interactions</li>
                  <li>Followers and following relationships</li>
                </ul>
              </div>
              
              <div className="profile-form-group">
                <label>Type "DELETE" to confirm:</label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                />
              </div>
              
              <div className="profile-form-actions">
                <button 
                  onClick={handleAccountDelete}
                  disabled={deleting || deleteConfirm !== 'DELETE'}
                  className="profile-confirm-delete-btn"
                >
                  {deleting ? 'Deleting...' : 'Delete Account'}
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="profile-cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* About Modal */}
      {showAboutModal && (
        <div className="profile-modal-overlay" onClick={() => setShowAboutModal(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>About {user.userName}</h2>
              <button 
                className="profile-modal-close"
                onClick={() => setShowAboutModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="profile-about-modal-content">
              <p>{user.about}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Demo Modal */}
      {showAddDemo && (
        <div className="profile-modal-overlay" onClick={() => setShowAddDemo(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>Add Demo</h2>
              <button 
                className="profile-modal-close"
                onClick={() => setShowAddDemo(false)}
              >
                ×
              </button>
            </div>
            
            <AddDemo
              setAddDemo={setShowAddDemo}
              onDemoAdded={() => {
                loadDemos();
                setShowAddDemo(false);
              }}
              userRole={currentUser?.role}
            />
          </div>
        </div>
      )}
      
      {/* Follow Modal */}
      <ShowFollow
        userName={username}
        isOpen={showFollowModal}
        onClose={() => setShowFollowModal(false)}
        type={followModalType}
      />
      </div>
      <Footer />
    </div>
  );
};

export default Profile2;