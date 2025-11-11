import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../Styling/Profile.css';
import ShowFollow from '../Components/ShowFollow';
import FeedItem from '../Components/FeedItem';
import DemoGrid from '../ProfileComponets/DemoGrid';
import AddDemo from '../ProfileComponets/AddDemo';
import api, { getCurrentUser } from '../services/AuthService';
import { UserRelationsService, updateProfile, changePassword } from '../services/UserService';
import DemoService from '../services/DemoService';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import BadgeService from '../services/BadgeService';

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();

  // Core data
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Relationship
  const [isFollowing, setIsFollowing] = useState(false);
  const [relationshipSummary, setRelationshipSummary] = useState(null);
  const [showFollow, setShowFollow] = useState(false);
  const [followPopupType, setFollowPopupType] = useState('followers');

  // Tabs/content
  const [activeTab, setActiveTab] = useState('demos');
  const [posts, setPosts] = useState([]);
  const [features, setFeatures] = useState([]);
  const [demos, setDemos] = useState([]);
  const [showAddDemo, setShowAddDemo] = useState(false);

  // Pagination
  const pageSize = 6;
  const [postsPage, setPostsPage] = useState(0);
  const [featPage, setFeatPage] = useState(0);
  const [postsTotalPages, setPostsTotalPages] = useState(0);
  const [featTotalPages, setFeatTotalPages] = useState(0);

  // Edit profile state (kept minimal to enable existing endpoint usage)
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState({ profilePic: 'url', banner: 'url' });
  const [editForm, setEditForm] = useState({ bio: '', location: '', about: '', socialMedia: [], profilePic: '', banner: '' });
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // Delete/Password modals kept out for now (UI already present elsewhere), focus on core transfer
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  
  // Edit Profile Tab state
  const [editProfileTab, setEditProfileTab] = useState('basic');

  const getPlatformIcon = (url) => {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      if (domain.includes('youtube')) return '📺';
      if (domain.includes('tiktok')) return '🎵';
      if (domain.includes('instagram')) return '📷';
      if (domain.includes('twitter') || domain.includes('x.com')) return '🐦';
      if (domain.includes('facebook')) return '👥';
      if (domain.includes('linkedin')) return '💼';
      if (domain.includes('twitch')) return '🎮';
      if (domain.includes('discord')) return '💬';
      if (domain.includes('spotify')) return '🎧';
      if (domain.includes('soundcloud')) return '🎶';
      if (domain.includes('github')) return '🐙';
      return '🌐';
    } catch {
      return '🌐';
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'posts') {
      loadPosts(0);
    } else if (activeTab === 'featured') {
      loadFeatures(0);
    } else if (activeTab === 'demos') {
      loadDemos();
    }
  }, [activeTab, user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const [userRes, cu] = await Promise.all([
        api.get(`/user/get/${username}`),
        getCurrentUser()
      ]);
      setUser(userRes.data);
      setCurrentUser(cu);
      setEditForm({
        bio: userRes.data.bio || '',
        location: userRes.data.location || '',
        about: userRes.data.about || '',
        socialMedia: userRes.data.socialMedia || [],
        profilePic: userRes.data.profilePic || '',
        banner: userRes.data.banner || ''
      });
      await loadRelationship();
    } catch (e) {
      console.error(e);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadRelationship = async () => {
    try {
      const isOwn = currentUser?.userName === username;
      if (isOwn) {
        const summary = await UserRelationsService.getRelationshipSummary(username);
        setRelationshipSummary(summary.data);
        setIsFollowing(false);
      } else {
        const [followingRes, summary] = await Promise.all([
          UserRelationsService.isFollowing(username),
          UserRelationsService.getRelationshipSummary(username)
        ]);
        setIsFollowing(followingRes.data);
        setRelationshipSummary(summary.data);
      }
    } catch (e) {
      console.error('relationship load error', e);
    }
  };

  const loadPosts = async (page = 0) => {
    if (!user || !user.posts || user.posts.length === 0) {
      setPosts([]);
      setPostsTotalPages(0);
      return;
    }
    try {
      const res = await api.get(`posts/get/all/id/${user.posts}/sorted?page=${page}&size=${pageSize}`);
      setPosts(res.data.content || []);
      setPostsTotalPages(res.data.page?.totalPages || 0);
      setPostsPage(page);
    } catch (e) {
      console.error('posts load error', e);
      setPosts([]);
      setPostsTotalPages(0);
    }
  };

  const loadFeatures = async (page = 0) => {
    if (!user || !user.featuredOn || user.featuredOn.length === 0) {
      setFeatures([]);
      setFeatTotalPages(0);
      return;
    }
    try {
      const res = await api.get(`posts/get/all/featuredOn/${user.featuredOn}/sorted?page=${page}&size=${pageSize}`);
      setFeatures(res.data.content || []);
      setFeatTotalPages(res.data.page?.totalPages || 0);
      setFeatPage(page);
    } catch (e) {
      console.error('features load error', e);
      setFeatures([]);
      setFeatTotalPages(0);
    }
  };

  const loadDemos = async () => {
    if (!user || !user.demo || user.demo.length === 0 || !user.id) {
      setDemos([]);
        return;
      }
    try {
      const list = await DemoService.getUserDemos(user.id);
      // Reverse the order so newer demos appear first
      setDemos(list.reverse());
    } catch (e) {
      console.error('demos load error', e);
      setDemos([]);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !user) return;
    try {
      // Optimistically update the UI immediately
      const newFollowingStatus = !isFollowing;
      
      // Update following status immediately
      setIsFollowing(newFollowingStatus);
      
      // Update counts immediately
      setUser(prev => prev ? {
        ...prev,
        followersCount: newFollowingStatus
          ? (prev.followersCount || 0) + 1
          : Math.max(0, (prev.followersCount || 0) - 1)
      } : null);
      
      setCurrentUser(prev => prev ? {
        ...prev,
        followingCount: newFollowingStatus
          ? (prev.followingCount || 0) + 1
          : Math.max(0, (prev.followingCount || 0) - 1)
      } : null);
      
      // Make the API call
      await UserRelationsService.toggleFollow(username);
      
      // Refresh relationship data to ensure consistency
      await loadRelationship();
    } catch (e) {
      console.error('toggle follow error', e);
      // Revert optimistic update on error
      setIsFollowing(isFollowing);
      
      // Revert counts
      setUser(prev => prev ? {
        ...prev,
        followersCount: isFollowing
          ? (prev.followersCount || 0) + 1
          : Math.max(0, (prev.followersCount || 0) - 1)
      } : null);
      
      setCurrentUser(prev => prev ? {
        ...prev,
        followingCount: isFollowing
          ? (prev.followingCount || 0) + 1
          : Math.max(0, (prev.followingCount || 0) - 1)
      } : null);
      
      // Refresh data to get correct state
      await loadRelationship();
      alert('Failed to update follow status');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || currentUser.userName !== username) return;
    setEditLoading(true);
    try {
      const formData = new FormData();
      const userData = {
        bio: editForm.bio,
        location: editForm.location,
        about: editForm.about,
        socialMedia: editForm.socialMedia
      };
      if (uploadMethod.profilePic === 'url') userData.profilePic = editForm.profilePic;
      if (uploadMethod.banner === 'url') userData.banner = editForm.banner;
      formData.append('user', new Blob([JSON.stringify(userData)], { type: 'application/json' }));
      if (uploadMethod.profilePic === 'file' && fileInputRef.current?.files[0]) {
        formData.append('pp', fileInputRef.current.files[0]);
      }
      if (uploadMethod.banner === 'file' && bannerInputRef.current?.files[0]) {
        formData.append('banner', bannerInputRef.current.files[0]);
      }
      formData.append('profilePicMethod', uploadMethod.profilePic);
      formData.append('bannerMethod', uploadMethod.banner);
      await updateProfile(formData, true);
      await loadProfile();
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (e) {
      console.error('update profile error', e);
      alert('Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (isChangingPassword) return;
    
    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('All password fields are required');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    setIsChangingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      // Reset password form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordFields(false);
      
      alert('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.error || 'Failed to change password. Please check your current password.';
      alert(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAccountDelete = async () => {
    if (deleteConfirm !== 'DELETE') {
      alert('Please type "DELETE" to confirm');
      return;
    }
    if (!currentUser || !user) return;
    setDeleting(true);
    try {
      await api.delete(`/user/delete/${user.id}`);
      document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      navigate('/login');
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
  return (
      <div className="profile">
        <div className="profile-main">
          <div className="profile-card" style={{ margin: '32px' }}>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="profile">
        <div className="profile-main">
          <div className="profile-card" style={{ margin: '32px' }}>
            <h2 className="profile-card-title">Profile not found</h2>
            <button className="profile-btn" onClick={() => navigate('/')}>Go Home</button>
                </div>
              </div>
                </div>
    );
  }
  
  return (
    <div className="profile">
      <Header />
      <div className="profile-main">

        <section className="profile-hero">
          <div
            className="profile-cover"
            style={{
              backgroundImage: `url('${user.banner || '/default-banner.jpg'}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <div className="profile-container">
          <div 
            className="profile-hero-content"
            style={user.role === 'USERPLUS' ? {
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1)), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02)), var(--profile-surface)',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            } : {}}
          >
            <img className="profile-avatar" src={user.profilePic || '/dpp.jpg'} alt={user.userName} />
            <div className="profile-identity">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 className="profile-name">{user.userName}</h1>
                {user.role === 'USERPLUS' && (
                  <img 
                    src="/SVGs/Logo Gradient.svg" 
                    alt="FeatureMe" 
                    style={{ 
                      width: '24px', 
                      height: '24px',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }} 
                  />
                )}
                    </div>
              {user.location && <p className="profile-title">📍 {user.location}</p>}
              {user.bio && (
                <p className="profile-paragraph" style={{ marginTop: 6, marginBottom: 0 }}>
                  {user.bio.length > 120 ? (
                    <>
                      {user.bio.slice(0, 120)}...
            <button 
                        className="profile-tab"
                        style={{ padding: '2px 6px', marginLeft: 6 }}
                        onClick={() => {
                          const el = document.getElementById('intro-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                      >Read more</button>
                        </>
                      ) : (
                    user.bio
                  )}
                </p>
              )}
              {/* Badges row */}
              {Array.isArray(user.badges) && user.badges.length > 0 && (
                <div className="profile-socials" style={{ gap: 6 }}>
                  {user.badges.map((b, i) => {
                    const info = BadgeService.getBadgeInfo ? BadgeService.getBadgeInfo(b) : null;
                    const bg = info?.color || 'rgba(148, 163, 184, 0.14)';
                    const icon = info?.icon || '🏷️';
                    const label = info?.label || b;
                    const description = info?.description || '';
                    return (
                      <span key={i} className="profile-badge" style={{ background: 'transparent' }}>
                        <span className="profile-chip" style={{ background: bg, color: '#fff', borderColor: bg }}>
                          {icon}
                        </span>
                        <span className="profile-badge-tooltip">
                          <strong style={{ display: 'block' }}>{label}</strong>
                          <span>{description}</span>
                        </span>
                      </span>
                    );
                  })}
                  </div>
                )}
              {/* Social links */}
              <div className="profile-socials">
                {(user.socialMedia || []).slice(0, 6).map((link, i) => (
                  <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="profile-social" aria-label={`social-${i}`} title={link}>
                    <span>{getPlatformIcon(link)}</span>
                  </a>
                ))}
              </div>
                </div>
            {/* Quick actions on right */}
            <div className="profile-hero-actions" style={{ display: 'grid', alignContent: 'center', justifyItems: 'end', gap: 8 }}>
              {currentUser && currentUser.userName !== username ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="profile-btn profile-btn--primary" onClick={handleFollow}>{isFollowing ? '✓ Following' : '+ Follow'}</button>
                  <button className="profile-btn" onClick={() => navigate(`/messages?createChat=true&user=${username}`)}>💬 Message</button>
                  </div>
                ) : (
                <button className="profile-btn" onClick={() => setIsEditing(true)}>✏️ Edit Profile</button>
              )}
              {/* Compact stats */}
              <ul className="profile-stats" style={{ marginTop: 8 }}>
                <li>
                  <span className="profile-stat-value">{user.posts?.length || 0}</span>
                  <span className="profile-stat-label">Posts</span>
                </li>
                <li>
                  <button className="profile-stat-button" onClick={() => { setFollowPopupType('followers'); setShowFollow(true); }}>
                    <span className="profile-stat-value">{user?.followersCount ?? 0}</span>
                    <span className="profile-stat-label">Followers</span>
                      </button>
                </li>
                <li>
                  <button className="profile-stat-button" onClick={() => { setFollowPopupType('following'); setShowFollow(true); }}>
                    <span className="profile-stat-value">{user?.followingCount ?? 0}</span>
                    <span className="profile-stat-label">Following</span>
                  </button>
                </li>
              </ul>
                </div>
              </div>
              
            </div>
        </section>

        <div className="profile-grid profile-grid--two">
          <section className="profile-card" id="intro-section">
            <h2 className="profile-card-title">Introduction</h2>
            <p className="profile-paragraph">{user.about || 'No about information available'}</p>
            <ul className="profile-list">
              {user.location && (<li><span>📍</span> {user.location}</li>)}
            </ul>
          </section>

          {/* Main content area switches by tab */}
          <section className="profile-card">
            <div className="profile-tabs" style={{ padding: 0, marginBottom: '12px' }}>
              {['Posts', 'Demos', 'Featured'].map((t) => (
            <button 
                  key={t}
                  className={`profile-tab ${(
                    (t === 'Posts' && activeTab === 'posts') ||
                    (t === 'Demos' && activeTab === 'demos') ||
                    (t === 'Featured' && activeTab === 'featured')
                  ) ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(t.toLowerCase())}
                >{t}</button>
              ))}
                </div>
            {activeTab === 'posts' && (
                  <div>
                <h2 className="profile-card-title">Posts</h2>
                {currentUser?.userName === username && (
                  <button className="profile-btn profile-btn--cta" onClick={() => navigate('/create-post')}>➕ Create Post</button>
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
                  <p className="profile-paragraph">No posts yet</p>
                )}
                {postsTotalPages > 1 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="profile-btn" disabled={postsPage === 0} onClick={() => loadPosts(postsPage - 1)}>Previous</button>
                    <button className="profile-btn" disabled={postsPage >= postsTotalPages - 1} onClick={() => loadPosts(postsPage + 1)}>Next</button>
                </div>
            )}
          </div>
            )}

            {activeTab === 'demos' && (
                  <div>
                <h2 className="profile-card-title">Demos</h2>
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

            {activeTab === 'featured' && (
                  <div>
                <h2 className="profile-card-title">Featured On</h2>
                {features.length > 0 ? (
                  <div className="profile-posts-grid">
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
                  <p className="profile-paragraph">No features yet</p>
                )}
                {featTotalPages > 1 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="profile-btn" disabled={featPage === 0} onClick={() => loadFeatures(featPage - 1)}>Previous</button>
                    <button className="profile-btn" disabled={featPage >= featTotalPages - 1} onClick={() => loadFeatures(featPage + 1)}>Next</button>
              </div>
                )}
          </div>
        )}
          </section>

          {/* Connections card removed; main content widened */}
        </div>
        
        
                </div>
      <Footer />

        <ShowFollow 
          userName={username}
          isOpen={showFollow}
        onClose={() => setShowFollow(false)}
          type={followPopupType}
        />

      {isEditing && (
        <div className="profile-card" style={{ position: 'fixed', inset: '100px 20px 20px', maxWidth: 560, margin: 'auto', zIndex: 50, maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 className="profile-card-title" style={{ margin: 0 }}>Edit Profile</h2>
            <button type="button" className="profile-btn" onClick={() => {
              setIsEditing(false);
              setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              });
              setShowPasswordFields(false);
              setEditProfileTab('basic');
            }} aria-label="Close edit profile">✕</button>
              </div>
          
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '2px solid var(--profile-border)' }}>
            <button
              type="button"
              className={`profile-tab ${editProfileTab === 'basic' ? 'is-active' : ''}`}
              onClick={() => setEditProfileTab('basic')}
              style={{ borderBottom: editProfileTab === 'basic' ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: '-2px' }}
            >
              Basic Info
            </button>
            <button
              type="button"
              className={`profile-tab ${editProfileTab === 'images' ? 'is-active' : ''}`}
              onClick={() => setEditProfileTab('images')}
              style={{ borderBottom: editProfileTab === 'images' ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: '-2px' }}
            >
              Images
            </button>
            <button
              type="button"
              className={`profile-tab ${editProfileTab === 'security' ? 'is-active' : ''}`}
              onClick={() => setEditProfileTab('security')}
              style={{ borderBottom: editProfileTab === 'security' ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: '-2px' }}
            >
              Security
            </button>
          </div>

          <form onSubmit={handleEditSubmit} style={{ display: 'grid', gap: 12 }}>
            {/* Basic Info Tab */}
            {editProfileTab === 'basic' && (
              <>
                <h3 className="profile-card-title" style={{ margin: 0 }}>Basic Information</h3>
            <label>
              <div className="profile-stat-label" style={{ marginBottom: 6 }}>Bio</div>
              <input className="profile-input" placeholder="Short bio (max 50 chars)" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} />
            </label>
            <label>
              <div className="profile-stat-label" style={{ marginBottom: 6 }}>Location</div>
              <input className="profile-input" placeholder="City, State" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
            </label>
            <label>
              <div className="profile-stat-label" style={{ marginBottom: 6 }}>About</div>
              <textarea className="profile-input" rows={4} placeholder="About you" value={editForm.about} onChange={(e) => setEditForm({ ...editForm, about: e.target.value })} />
            </label>

            {/* Social Links (USERPLUS only) */}
            {currentUser?.role === 'USERPLUS' && (
              <div style={{ display: 'grid', gap: 8 }}>
                <h3 className="profile-card-title" style={{ margin: 0 }}>Social Links</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    type="button"
                    className="profile-btn"
                    onClick={() => {
                      if ((editForm.socialMedia?.length || 0) >= 5) return;
                      setEditForm(prev => ({ ...prev, socialMedia: [...(prev.socialMedia || []), ''] }));
                    }}
                    disabled={(editForm.socialMedia?.length || 0) >= 5}
                  >➕ Add Link {(editForm.socialMedia?.length || 0) >= 5 ? '(Max 5)' : ''}</button>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {(editForm.socialMedia || []).map((link, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', alignItems: 'center', gap: 8 }}>
                      <input
                        className="profile-input"
                        placeholder="https://example.com/your-profile"
                        value={link}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditForm(prev => {
                            const arr = [...(prev.socialMedia || [])];
                            arr[idx] = val;
                            return { ...prev, socialMedia: arr };
                          });
                        }}
                      />
                      <button 
                        type="button"
                        className="profile-btn"
                        onClick={() => setEditForm(prev => ({ ...prev, socialMedia: (prev.socialMedia || []).filter((_, i) => i !== idx) }))}
                        title="Remove link"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
              </>
            )}

            {/* Images Tab */}
            {editProfileTab === 'images' && (
              <>
                <h3 className="profile-card-title" style={{ margin: 0 }}>Images</h3>
                
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <label className="profile-btn" style={{ cursor: 'pointer' }}>
                      <input type="radio" name="ppMethod" value="url" checked={uploadMethod.profilePic === 'url'} onChange={() => setUploadMethod({ ...uploadMethod, profilePic: 'url' })} /> URL
                    </label>
                    <label className="profile-btn" style={{ cursor: 'pointer' }}>
                      <input type="radio" name="ppMethod" value="file" checked={uploadMethod.profilePic === 'file'} onChange={() => setUploadMethod({ ...uploadMethod, profilePic: 'file' })} /> File
                    </label>
                  </div>
                  {uploadMethod.profilePic === 'url' ? (
                    <label>
                      <div className="profile-stat-label" style={{ marginBottom: 6 }}>Profile Picture URL</div>
                      <input className="profile-input" placeholder="https://...jpg" value={editForm.profilePic} onChange={(e) => setEditForm({ ...editForm, profilePic: e.target.value })} />
                    </label>
                  ) : (
                    <label>
                      <div className="profile-stat-label" style={{ marginBottom: 6 }}>Upload Profile Picture</div>
                      <input ref={fileInputRef} type="file" accept="image/*" />
                    </label>
                  )}
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <label className="profile-btn" style={{ cursor: 'pointer' }}>
                      <input type="radio" name="bannerMethod" value="url" checked={uploadMethod.banner === 'url'} onChange={() => setUploadMethod({ ...uploadMethod, banner: 'url' })} /> URL
                    </label>
                    <label className="profile-btn" style={{ cursor: 'pointer' }}>
                      <input type="radio" name="bannerMethod" value="file" checked={uploadMethod.banner === 'file'} onChange={() => setUploadMethod({ ...uploadMethod, banner: 'file' })} /> File
                    </label>
                  </div>
                  {uploadMethod.banner === 'url' ? (
                    <label>
                      <div className="profile-stat-label" style={{ marginBottom: 6 }}>Banner Image URL</div>
                      <input className="profile-input" placeholder="https://...jpg" value={editForm.banner} onChange={(e) => setEditForm({ ...editForm, banner: e.target.value })} />
                    </label>
                  ) : (
                    <label>
                      <div className="profile-stat-label" style={{ marginBottom: 6 }}>Upload Banner Image</div>
                      <input ref={bannerInputRef} type="file" accept="image/*" />
                    </label>
                  )}
                </div>
              </>
            )}

            {/* Security Tab */}
            {editProfileTab === 'security' && (
              <>
                <h3 className="profile-card-title" style={{ margin: 0 }}>Security</h3>
                
                {/* Change Password Section */}
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="profile-stat-label" style={{ marginBottom: 0 }}>Change Password</div>
                    <button 
                      type="button"
                      className="profile-btn"
                      onClick={() => setShowPasswordFields(!showPasswordFields)}
                    >
                      {showPasswordFields ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  
                  {showPasswordFields && (
                    <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: 8 }}>
                      <label>
                        <div className="profile-stat-label" style={{ marginBottom: 6 }}>Current Password</div>
                        <input 
                          className="profile-input" 
                          type="password"
                          placeholder="Enter current password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} 
                        />
                      </label>
                      
                      <label>
                        <div className="profile-stat-label" style={{ marginBottom: 6 }}>New Password</div>
                        <input 
                          className="profile-input" 
                          type="password"
                          placeholder="Enter new password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
                        />
                      </label>
                      
                      <label>
                        <div className="profile-stat-label" style={{ marginBottom: 6 }}>Confirm New Password</div>
                        <input 
                          className="profile-input" 
                          type="password"
                          placeholder="Confirm new password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} 
                        />
                      </label>
                      
                      <button 
                        type="submit" 
                        disabled={isChangingPassword}
                        className="profile-btn profile-btn--primary"
                        style={{ justifySelf: 'flex-start' }}
                      >
                        {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                      </button>
                    </form>
                  )}
                </div>

                {/* Danger Zone */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--profile-border)' }}>
                  <h3 className="profile-card-title">Danger Zone</h3>
                  <p className="profile-paragraph">Deleting your account will permanently remove your profile, posts, demos, and relationships.</p>
                  <button className="profile-btn" onClick={() => setShowDeleteModal(true)}>🗑️ Delete Account</button>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="profile-btn" onClick={() => {
              setIsEditing(false);
              setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              });
              setShowPasswordFields(false);
              setEditProfileTab('basic');
            }}>Cancel</button>
              <button type="submit" disabled={editLoading} className="profile-btn profile-btn--primary">{editLoading ? 'Saving...' : 'Save'}</button>
      </div>
          </form>
            </div>
        )}
        
      {showDeleteModal && (
        <div className="profile-card" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 60 }} onClick={() => setShowDeleteModal(false)}>
          <div className="profile-card" style={{ width: 'min(560px, 92vw)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 className="profile-card-title">Delete Account</h3>
              <button className="profile-btn" onClick={() => setShowDeleteModal(false)} disabled={deleting}>✕</button>
                </div>
            <p className="profile-paragraph">This action cannot be undone. Type <strong>DELETE</strong> to confirm.</p>
            <input className="profile-input" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" disabled={deleting} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="profile-btn" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</button>
              <button className="profile-btn profile-btn--primary" onClick={handleAccountDelete} disabled={deleting || deleteConfirm !== 'DELETE'}>
                {deleting ? 'Deleting...' : 'Delete Account'}
                    </button>
                </div>
              </div>
          </div>
        )}

      {showAddDemo && (
        <div className="profile-card" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 60 }} onClick={() => setShowAddDemo(false)}>
          <div className="profile-card" style={{ width: 'min(560px, 92vw)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 className="profile-card-title">Add Demo</h3>
              <button className="profile-btn" onClick={() => setShowAddDemo(false)}>✕</button>
                </div>
              <AddDemo 
              setAddDemo={setShowAddDemo}
              onDemoAdded={() => { loadDemos(); setShowAddDemo(false); }}
              userRole={currentUser?.role}
            />
                </div>
              </div>
            )}
    </div>
  );
}


