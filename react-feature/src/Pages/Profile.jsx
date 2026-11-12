import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// Old stylesheet: no longer used by this page, but Homepage2 (.profile-avatar) and
// Post.jsx (.profile-btn) still rely on it. Remove once those are redesigned.
import '../Styling/Profile.css';
import '../Styling/ProfilePage.css';
import ShowFollow from '../Components/ShowFollow';
import FeedItem from '../Components/FeedItem';
import DemoGrid from '../ProfileComponets/DemoGrid';
import AddDemo from '../ProfileComponets/AddDemo';
import api, { getCurrentUser, logout } from '../services/AuthService';
import { UserRelationsService, updateProfile, changePassword } from '../services/UserService';
import DemoService from '../services/DemoService';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import BadgeService from '../services/BadgeService';
import Icon from '../Components/ui/Icon';
import PlusBadge from '../Components/ui/PlusBadge';
import Dialog from '../Components/ui/Dialog';
import Pagination from '../Components/ui/Pagination';
import { bannerStyle } from '../utils/banner';

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

  const getPlatformName = (url) => {
    try {
      const domain = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
      const known = [
        ['youtube', 'YouTube'], ['youtu.be', 'YouTube'], ['tiktok', 'TikTok'], ['instagram', 'Instagram'],
        ['twitter', 'X'], ['x.com', 'X'], ['facebook', 'Facebook'], ['linkedin', 'LinkedIn'],
        ['twitch', 'Twitch'], ['discord', 'Discord'], ['spotify', 'Spotify'], ['soundcloud', 'SoundCloud'],
        ['apple.com', 'Apple Music'], ['bandcamp', 'Bandcamp'], ['github', 'GitHub'],
      ];
      const match = known.find(([needle]) => domain.includes(needle));
      return match ? match[1] : domain;
    } catch {
      return 'Link';
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
      // Clears the HttpOnly session cookie on the server and goes to /login
      await logout();
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const isOwnProfile = currentUser?.userName === username;

  const closeEdit = () => {
    setIsEditing(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordFields(false);
    setEditProfileTab('basic');
  };

  const deleteDemo = async (demoId) => {
    try {
      await DemoService.deleteDemo(demoId);
      loadDemos();
    } catch (err) {
      console.error('Error deleting demo:', err);
      alert('Failed to delete demo');
    }
  };

  const renderPostGrid = (list, emptyTitle, emptyText) => (
    list.length > 0 ? (
      <div className="fm-profile__grid">
        {list.map((post) => (
          <FeedItem key={post.id} {...post} currentUser={currentUser} />
        ))}
      </div>
    ) : (
      <div className="fm-state">
        <h3>{emptyTitle}</h3>
        <p>{emptyText}</p>
      </div>
    )
  );

  if (loading) {
    return (
      <div className="fm-page">
        <Header />
        <main className="fm-page__main">
          <div className="fm-state" role="status">
            <div className="fm-spinner" aria-hidden="true" />
            <p>Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="fm-page">
        <Header />
        <main className="fm-page__main">
          <div className="fm-state" role="alert">
            <h3>Profile not found</h3>
            <p>This artist may have changed their username or deleted their account.</p>
            <button type="button" className="fm-btn fm-btn--secondary" onClick={() => navigate('/home')}>Go home</button>
          </div>
        </main>
      </div>
    );
  }

  const badges = Array.isArray(user.badges) ? user.badges : [];
  const socials = (user.socialMedia || []).filter(Boolean).slice(0, 6);
  const TABS = [
    { id: 'posts', label: 'Posts', count: user.posts?.length || 0 },
    { id: 'demos', label: 'Demos', count: user.demo?.length || 0 },
    { id: 'featured', label: 'Featured on', count: user.featuredOn?.length || 0 },
  ];

  return (
    <div className="fm-page">
      <Header />
      <main className="fm-page__main">
        <section className={`fm-profile-hero${user.role === 'USERPLUS' ? ' fm-profile-hero--plus' : ''}`} aria-label={`${user.userName}'s profile`}>
          <div className="fm-profile-hero__banner" style={bannerStyle(user)} />
          <div className="fm-profile-hero__inner">
            <img className="fm-profile-hero__avatar" src={user.profilePic || '/dpp.jpg'} alt="" />

            <div className="fm-profile-hero__identity">
              <div className="fm-profile-hero__name-row">
                <h1 className="fm-profile-hero__name">{user.userName}</h1>
                {user.role === 'USERPLUS' && <PlusBadge size={30} />}
              </div>
              {user.location && (
                <p className="fm-profile-hero__location">
                  <Icon name="pin" size={16} />
                  {user.location}
                </p>
              )}
              {user.bio && <p className="fm-profile-hero__bio">{user.bio}</p>}

              {badges.length > 0 && (
                <ul className="fm-profile-badges" aria-label="Badges">
                  {badges.map((b) => {
                    const info = BadgeService.getBadgeInfo ? BadgeService.getBadgeInfo(b) : null;
                    const label = info?.label || b;
                    return (
                      <li key={b} className="fm-profile-badge" title={info?.description || label}>
                        <span className="fm-profile-badge__dot" style={{ background: info?.color || 'var(--fm-muted)' }} aria-hidden="true" />
                        {label}
                        {info?.description && <span className="fm-visually-hidden">: {info.description}</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="fm-profile-hero__side">
              <div className="fm-profile-hero__actions">
                {currentUser && !isOwnProfile ? (
                  <>
                    <button
                      type="button"
                      className={`fm-btn ${isFollowing ? 'fm-btn--secondary' : 'fm-btn--primary'}`}
                      onClick={handleFollow}
                      aria-pressed={isFollowing}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                      type="button"
                      className="fm-btn fm-btn--secondary"
                      onClick={() => navigate(`/messages?createChat=true&user=${username}`)}
                    >
                      <Icon name="message" size={18} />
                      Message
                    </button>
                  </>
                ) : isOwnProfile ? (
                  <button type="button" className="fm-btn fm-btn--secondary" onClick={() => setIsEditing(true)}>
                    Edit profile
                  </button>
                ) : null}
              </div>

              <ul className="fm-profile-stats">
                <li>
                  <div className="fm-profile-stats__item">
                    <span className="fm-profile-stats__value">{user.posts?.length || 0}</span>
                    <span className="fm-profile-stats__label">Posts</span>
                  </div>
                </li>
                <li>
                  <button type="button" className="fm-profile-stats__item" onClick={() => { setFollowPopupType('followers'); setShowFollow(true); }}>
                    <span className="fm-profile-stats__value">{user.followersCount ?? 0}</span>
                    <span className="fm-profile-stats__label">Followers</span>
                  </button>
                </li>
                <li>
                  <button type="button" className="fm-profile-stats__item" onClick={() => { setFollowPopupType('following'); setShowFollow(true); }}>
                    <span className="fm-profile-stats__value">{user.followingCount ?? 0}</span>
                    <span className="fm-profile-stats__label">Following</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <div className="fm-profile">
          <aside className="fm-profile__aside">
            <section className="fm-card">
              <h2 className="fm-profile__card-title">About</h2>
              <p className="fm-profile__about">{user.about || (isOwnProfile ? 'Tell other artists about yourself. Add an About section from Edit profile.' : 'No about information yet.')}</p>
            </section>

            {socials.length > 0 && (
              <section className="fm-card">
                <h2 className="fm-profile__card-title">Links</h2>
                <ul className="fm-profile__links">
                  {socials.map((link) => (
                    <li key={link}>
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        <Icon name="link" size={16} />
                        {getPlatformName(link)}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>

          <section className="fm-profile__content">
            <div className="fm-profile__tabs-row">
              <div className="fm-segmented" role="tablist" aria-label="Profile sections">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`fm-profile-tab-${tab.id}`}
                    aria-selected={activeTab === tab.id}
                    aria-controls="fm-profile-panel"
                    className={`fm-segment${activeTab === tab.id ? ' is-active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                    <span className="fm-profile__tab-count">{tab.count}</span>
                  </button>
                ))}
              </div>
              {isOwnProfile && activeTab === 'posts' && (
                <button type="button" className="fm-btn fm-btn--primary" onClick={() => navigate('/create-post')}>
                  <Icon name="plus" size={18} strokeWidth={2} />
                  Create post
                </button>
              )}
            </div>

            <div id="fm-profile-panel" role="tabpanel" aria-labelledby={`fm-profile-tab-${activeTab}`} className="fm-profile__panel">
              {activeTab === 'posts' && (
                <>
                  {renderPostGrid(
                    posts,
                    'No posts yet',
                    isOwnProfile ? 'Share your first track and request features from other artists.' : `${user.userName} hasn’t posted anything yet.`
                  )}
                  <Pagination page={postsPage} totalPages={postsTotalPages} onChange={loadPosts} label="Posts pages" />
                </>
              )}

              {activeTab === 'demos' && (
                <DemoGrid
                  demos={demos}
                  currentUser={currentUser}
                  username={username}
                  onAddDemo={() => setShowAddDemo(true)}
                  onDeleteDemo={deleteDemo}
                />
              )}

              {activeTab === 'featured' && (
                <>
                  {renderPostGrid(
                    features,
                    'No features yet',
                    `Tracks ${isOwnProfile ? 'you’re' : `${user.userName} is`} featured on will show up here.`
                  )}
                  <Pagination page={featPage} totalPages={featTotalPages} onChange={loadFeatures} label="Featured pages" />
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />

      <ShowFollow
        userName={username}
        isOpen={showFollow}
        onClose={() => setShowFollow(false)}
        type={followPopupType}
      />

      <Dialog open={isEditing} onClose={closeEdit} title="Edit profile" size="md" closeDisabled={showDeleteModal}>
        <div className="fm-segmented fm-profile-edit__tabs" role="tablist" aria-label="Edit profile sections">
          {[['basic', 'Profile'], ['images', 'Images'], ['security', 'Account']].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={editProfileTab === id}
              className={`fm-segment${editProfileTab === id ? ' is-active' : ''}`}
              onClick={() => setEditProfileTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {editProfileTab !== 'security' ? (
          <form onSubmit={handleEditSubmit} className="fm-profile-edit">
            {editProfileTab === 'basic' && (
              <>
                <div className="fm-field">
                  <label htmlFor="edit-bio" className="fm-field__label">Bio</label>
                  <input id="edit-bio" className="fm-input" placeholder="A short line about you" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} aria-describedby="edit-bio-hint" />
                  <span id="edit-bio-hint" className="fm-field__hint">Shown under your name. Keep it short: {editForm.bio.length}/50 characters.</span>
                </div>
                <div className="fm-field">
                  <label htmlFor="edit-location" className="fm-field__label">Location</label>
                  <input id="edit-location" className="fm-input" placeholder="City, State" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
                </div>
                <div className="fm-field">
                  <label htmlFor="edit-about" className="fm-field__label">About</label>
                  <textarea id="edit-about" className="fm-input" rows={4} placeholder="Your sound, influences, what you're looking for..." value={editForm.about} onChange={(e) => setEditForm({ ...editForm, about: e.target.value })} />
                </div>

                {currentUser?.role === 'USERPLUS' ? (
                  <fieldset className="fm-profile-edit__links">
                    <legend className="fm-field__label">Links</legend>
                    {(editForm.socialMedia || []).map((link, idx) => (
                      <div key={idx} className="fm-profile-edit__link-row">
                        <label className="fm-visually-hidden" htmlFor={`edit-link-${idx}`}>Link {idx + 1}</label>
                        <input
                          id={`edit-link-${idx}`}
                          className="fm-input"
                          placeholder="https://example.com/your-profile"
                          value={link}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditForm((prev) => {
                              const arr = [...(prev.socialMedia || [])];
                              arr[idx] = val;
                              return { ...prev, socialMedia: arr };
                            });
                          }}
                        />
                        <button
                          type="button"
                          className="fm-icon-btn"
                          onClick={() => setEditForm((prev) => ({ ...prev, socialMedia: (prev.socialMedia || []).filter((_, i) => i !== idx) }))}
                          aria-label={`Remove link ${idx + 1}`}
                        >
                          <Icon name="close" size={18} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="fm-btn fm-btn--secondary fm-profile-edit__add-link"
                      onClick={() => setEditForm((prev) => ({ ...prev, socialMedia: [...(prev.socialMedia || []), ''] }))}
                      disabled={(editForm.socialMedia?.length || 0) >= 5}
                    >
                      <Icon name="plus" size={16} strokeWidth={2} />
                      {(editForm.socialMedia?.length || 0) >= 5 ? 'Maximum 5 links' : 'Add link'}
                    </button>
                  </fieldset>
                ) : (
                  <p className="fm-field__hint">Links to your other profiles are available with Plus.</p>
                )}
              </>
            )}

            {editProfileTab === 'images' && (
              <>
                {[
                  ['profilePic', 'Profile picture', fileInputRef],
                  ['banner', 'Banner', bannerInputRef],
                ].map(([key, label, ref]) => (
                  <fieldset key={key} className="fm-profile-edit__image">
                    <legend className="fm-field__label">{label}</legend>
                    <div className="fm-segmented" role="radiogroup" aria-label={`${label} source`}>
                      {[['file', 'Upload file'], ['url', 'Use a URL']].map(([method, methodLabel]) => (
                        <button
                          key={method}
                          type="button"
                          role="radio"
                          aria-checked={uploadMethod[key] === method}
                          className={`fm-segment${uploadMethod[key] === method ? ' is-active' : ''}`}
                          onClick={() => setUploadMethod({ ...uploadMethod, [key]: method })}
                        >
                          {methodLabel}
                        </button>
                      ))}
                    </div>
                    {uploadMethod[key] === 'url' ? (
                      <div className="fm-field">
                        <label htmlFor={`edit-${key}-url`} className="fm-visually-hidden">{label} URL</label>
                        <input id={`edit-${key}-url`} className="fm-input" placeholder="https://...jpg" value={editForm[key]} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })} />
                      </div>
                    ) : (
                      <div className="fm-field">
                        <label htmlFor={`edit-${key}-file`} className="fm-visually-hidden">{label} file</label>
                        <input id={`edit-${key}-file`} ref={ref} type="file" accept="image/*" className="fm-profile-edit__file" />
                      </div>
                    )}
                  </fieldset>
                ))}
              </>
            )}

            <div className="fm-profile-edit__actions">
              <button type="button" className="fm-btn fm-btn--secondary" onClick={closeEdit}>Cancel</button>
              <button type="submit" className="fm-btn fm-btn--primary" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save changes'}</button>
            </div>
          </form>
        ) : (
          <div className="fm-profile-edit">
            {/* Kept outside the profile form: nested forms aren't valid HTML, and the
                browser would submit the profile form instead of changing the password. */}
            <section className="fm-profile-edit__section">
              <div className="fm-profile-edit__section-head">
                <h3>Change password</h3>
                <button type="button" className="fm-btn fm-btn--secondary" onClick={() => setShowPasswordFields(!showPasswordFields)} aria-expanded={showPasswordFields}>
                  {showPasswordFields ? 'Cancel' : 'Change'}
                </button>
              </div>
              {showPasswordFields && (
                <form onSubmit={handleChangePassword} className="fm-profile-edit">
                  {[
                    ['currentPassword', 'Current password', 'current-password'],
                    ['newPassword', 'New password', 'new-password'],
                    ['confirmPassword', 'Confirm new password', 'new-password'],
                  ].map(([key, label, autoComplete]) => (
                    <div key={key} className="fm-field">
                      <label htmlFor={`pw-${key}`} className="fm-field__label">{label}</label>
                      <input
                        id={`pw-${key}`}
                        className="fm-input"
                        type="password"
                        autoComplete={autoComplete}
                        value={passwordForm[key]}
                        onChange={(e) => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                      />
                    </div>
                  ))}
                  <span className="fm-field__hint">At least 6 characters.</span>
                  <div className="fm-profile-edit__actions">
                    <button type="submit" className="fm-btn fm-btn--primary" disabled={isChangingPassword}>
                      {isChangingPassword ? 'Changing...' : 'Change password'}
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section className="fm-profile-edit__section fm-profile-edit__danger">
              <h3>Delete account</h3>
              <p>Permanently removes your profile, posts, demos and connections.</p>
              <button type="button" className="fm-btn fm-btn--danger" onClick={() => setShowDeleteModal(true)}>
                <Icon name="trash" size={16} />
                Delete account
              </button>
            </section>
          </div>
        )}
      </Dialog>

      <Dialog
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete account"
        size="sm"
        closeDisabled={deleting}
        footer={(
          <>
            <button type="button" className="fm-btn fm-btn--secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</button>
            <button type="button" className="fm-btn fm-btn--danger" onClick={handleAccountDelete} disabled={deleting || deleteConfirm !== 'DELETE'}>
              {deleting ? 'Deleting...' : 'Delete account'}
            </button>
          </>
        )}
      >
        <p>This can&apos;t be undone. Type <strong>DELETE</strong> to confirm.</p>
        <div className="fm-field">
          <label htmlFor="delete-confirm" className="fm-visually-hidden">Type DELETE to confirm</label>
          <input id="delete-confirm" className="fm-input" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" disabled={deleting} autoComplete="off" />
        </div>
      </Dialog>

      <Dialog open={showAddDemo} onClose={() => setShowAddDemo(false)} title="Add demo" size="md">
        <AddDemo
          setAddDemo={setShowAddDemo}
          onDemoAdded={() => { loadDemos(); setShowAddDemo(false); }}
          userRole={currentUser?.role}
        />
      </Dialog>
    </div>
  );
}


