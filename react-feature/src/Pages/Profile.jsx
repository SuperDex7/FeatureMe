import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import "../Styling/Profile.css";
import { UserRelationsService, updateProfile } from "../services/UserService";
import api, { getCurrentUser } from "../services/AuthService";
import BadgeService from "../services/BadgeService";
import ShowFollow from "../Components/ShowFollow";
import FeedItem from "../Components/FeedItem";
import AddDemo from "../ProfileComponets/AddDemo";
import DemoGrid from "../ProfileComponets/DemoGrid";
import DemoService from "../services/DemoService";


function Profile() {
  const [activeTab, setActiveTab] = useState("demos");
  const { username } = useParams();
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [featuredOn, setFeatureOn] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showFollow, setShowFollow] = useState(false)
  const [followPopupType, setFollowPopupType] = useState('followers')
  const [relationshipSummary, setRelationshipSummary] = useState(null)
  const [addDemo, setAddDemo] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [demos, setDemos] = useState([])
  

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    bio: '',
    location: '',
    about: '',
    profilePic: '',
    banner: '',
    socialMedia: []
  });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [uploadMethod, setUploadMethod] = useState({
    profilePic: 'url', // 'url' or 'file'
    banner: 'url'      // 'url' or 'file'
  });
  const [editLoading, setEditLoading] = useState(false);
  const [socialLinksExpanded, setSocialLinksExpanded] = useState(false);
  
  // File validation state
  const [profilePicError, setProfilePicError] = useState("");
  const [bannerError, setBannerError] = useState("");
  const [profilePicUrlError, setProfilePicUrlError] = useState("");
  const [bannerUrlError, setBannerUrlError] = useState("");

  // File validation function for USER role
  const validateImageFile = (file, type) => {
    if (!file) return { isValid: true, error: "" };
    
    // Check if user is USER role - restrict to JPEG, JPG, PNG only
    if (currentUser?.role === 'USER') {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        return { 
          isValid: false, 
          error: `Please select a valid ${type} file (JPEG, JPG, or PNG only)` 
        };
      }
    } else {
      // For other roles, allow more formats
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
      if (!allowedTypes.includes(file.type)) {
        return { 
          isValid: false, 
          error: `Please select a valid ${type} file (JPEG, PNG, GIF, WebP, or BMP)` 
        };
      }
    }
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return { 
        isValid: false, 
        error: `${type} file size must be less than 5MB` 
      };
    }
    
    return { isValid: true, error: "" };
  };

  // URL validation function for USER role
  const validateImageUrl = (url, type) => {
    if (!url || !url.trim()) return { isValid: true, error: "" };
    
    // Check if user is USER role - restrict to JPEG, JPG, PNG only
    if (currentUser?.role === 'USER') {
      const allowedExtensions = ['.jpg', '.jpeg', '.png'];
      const urlLower = url.toLowerCase();
      
      // Check if URL ends with allowed extension
      const hasValidExtension = allowedExtensions.some(ext => urlLower.endsWith(ext));
      
      if (!hasValidExtension) {
        return { 
          isValid: false, 
          error: `Please use a valid ${type} URL (JPEG, JPG, or PNG only)` 
        };
      }
    }
    
    return { isValid: true, error: "" };
  };

  const [size, setSize] = useState(6)
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    const [featSize, setFeatSize] = useState(6)
    const [featPage, setFeatPage] = useState(0)
    const [featTotalPages, setFeatTotalPages] = useState(0)
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const currentUserData = await getCurrentUser();
        setCurrentUser(currentUserData);
        
        const response = await api.get(`/user/get/${username}`);
        setUser(response.data);
        console.log(response.data);
        
        // Get relationship summary using new endpoint
        const relationshipResponse = await UserRelationsService.getRelationshipSummary(username);
        setRelationshipSummary(relationshipResponse.data);
        setIsFollowing(relationshipResponse.data.isFollowing);
        console.log('Relationship summary:', relationshipResponse.data);
        
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [username]);

  // Populate edit form when user data is loaded
  useEffect(() => {
    if (user && currentUser?.userName === username) {
      setEditFormData({
        bio: user.bio || '',
        location: user.location || '',
        about: user.about || '',
        profilePic: user.profilePic || '',
        banner: user.banner || '',
        socialMedia: user.socialMedia || []
      });
    }
  }, [user, currentUser, username]);

  // Note: isFollowing is now set directly from relationship summary

  const nextPage = () =>{
    setPage(page+1)
  }
  const prevPage = () =>{
    setPage(page-1)
  }
  const nextFeatPage = () =>{
    setFeatPage(featPage+1)
  }
  const prevFeatPage = () =>{
    setFeatPage(featPage-1)
  }
  // Load posts when activeTab changes or page changes
  useEffect(() => {
    if (activeTab === "posts" && user && user.posts) {
      api.get(`posts/get/all/id/${user.posts}/sorted?page=${page}&size=${size}`).then(res => {
        setTotalPages(res.data.page.totalPages)
        setPosts(res.data.content)
        console.log(res.data)
      })
    }
  }, [activeTab, user, page, size]);

  // Load featuredOn when activeTab changes or page changes
  useEffect(() => {
    if (activeTab === "friends" && user && user.featuredOn) {
      api.get(`posts/get/all/featuredOn/${user.featuredOn}/sorted?page=${featPage}&size=${featSize}`).then(res => {
        setFeatTotalPages(res.data.page.totalPages)
        setFeatureOn(res.data.content)
        console.log(res.data)
      })
    }
  }, [activeTab, user, featPage, featSize]);

  useEffect(() => {
    if (activeTab === "demos" && user && user.id) {
      // Fetch demos for the current user
      DemoService.getUserDemos(user.id).then(demos => {
        setDemos(demos)
        console.log("User demos:", demos)
      }).catch(err => {
        console.error("Error fetching demos:", err)
        setDemos([])
      })
    }
  }, [activeTab, user]);

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
  const showTheFollow = (type) => {
    setFollowPopupType(type)
    setShowFollow(true)
  }
  const handleAddDemo = () =>{
    setAddDemo(!addDemo)
  }

  const handleDemoAdded = () => {
    // Refresh demos list after a new demo is added
    if (activeTab === "demos" && user) {
      DemoService.getUserDemos(user.id).then(demos => {
        setDemos(demos)
        console.log("Demos refreshed:", demos)
      }).catch(err => {
        console.error("Error refreshing demos:", err)
      })
    }
  }

  const handleDeleteDemo = async (demoId) => {
    if (window.confirm("Are you sure you want to delete this demo? This action cannot be undone.")) {
      try {
        await DemoService.deleteDemo(demoId);
        // Refresh demos list after deletion
        const updatedDemos = await DemoService.getUserDemos(user.id);
        setDemos(updatedDemos);
        console.log("Demo deleted successfully");
      } catch (err) {
        console.error("Error deleting demo:", err);
        alert("Failed to delete demo. Please try again.");
      }
    }
  }

  const closeFollowPopup = () => {
    setShowFollow(false)
  }

  const follow = async () => {
    if (!currentUser) return;
    
    try {
      const response = await UserRelationsService.toggleFollow(username);
      console.log('Follow response:', response.data);
      
      // Toggle the following state
      setIsFollowing(!isFollowing);
      
      // Refresh relationship summary to get updated counts
      const relationshipResponse = await UserRelationsService.getRelationshipSummary(username);
      setRelationshipSummary(relationshipResponse.data);
      
    } catch (err) {
      console.error('Error following/unfollowing user:', err);
    }
  };

  // Edit profile handlers
  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data to original user data
    if (user) {
      setEditFormData({
        bio: user.bio || '',
        location: user.location || '',
        about: user.about || '',
        profilePic: user.profilePic || '',
        banner: user.banner || '',
        socialMedia: user.socialMedia || []
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate URLs for profile picture and banner
    if (name === 'profilePic' && uploadMethod.profilePic === 'url') {
      const validation = validateImageUrl(value, 'profile picture');
      if (!validation.isValid) {
        setProfilePicUrlError(validation.error);
      } else {
        setProfilePicUrlError("");
      }
    } else if (name === 'banner' && uploadMethod.banner === 'url') {
      const validation = validateImageUrl(value, 'banner');
      if (!validation.isValid) {
        setBannerUrlError(validation.error);
      } else {
        setBannerUrlError("");
      }
    }
  };

  const handleSocialMediaChange = (index, value) => {
    const newSocialMedia = [...editFormData.socialMedia];
    newSocialMedia[index] = value;
    setEditFormData(prev => ({
      ...prev,
      socialMedia: newSocialMedia
    }));
  };

  const addSocialMediaLink = () => {
    setEditFormData(prev => ({
      ...prev,
      socialMedia: [...prev.socialMedia, '']
    }));
  };

  const removeSocialMediaLink = (index) => {
    setEditFormData(prev => ({
      ...prev,
      socialMedia: prev.socialMedia.filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (type, file) => {
    if (file) {
      // Validate the file
      const validation = validateImageFile(file, type);
      if (!validation.isValid) {
        if (type === 'profilePic') {
          setProfilePicError(validation.error);
        } else if (type === 'banner') {
          setBannerError(validation.error);
        }
        return;
      }
      
      // Clear any previous errors
      if (type === 'profilePic') {
        setProfilePicError("");
        setProfilePicFile(file);
      } else if (type === 'banner') {
        setBannerError("");
        setBannerFile(file);
      }
    } else {
      // Clear error when no file is selected
      if (type === 'profilePic') {
        setProfilePicError("");
      } else if (type === 'banner') {
        setBannerError("");
      }
    }
  };

  const handleUploadMethodChange = (type, method) => {
    setUploadMethod(prev => ({
      ...prev,
      [type]: method
    }));
    
    // Clear the other method's data when switching
    if (type === 'profilePic') {
      if (method === 'file') {
        setEditFormData(prev => ({ ...prev, profilePic: '' }));
        setProfilePicUrlError(""); // Clear URL error
      } else {
        setProfilePicFile(null);
        setProfilePicError(""); // Clear file error
      }
    } else if (type === 'banner') {
      if (method === 'file') {
        setEditFormData(prev => ({ ...prev, banner: '' }));
        setBannerUrlError(""); // Clear URL error
      } else {
        setBannerFile(null);
        setBannerError(""); // Clear file error
      }
    }
  };
  

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    // Check for file and URL validation errors
    if (profilePicError || bannerError || profilePicUrlError || bannerUrlError) {
      alert("Please fix file upload errors before saving.");
      return;
    }
    
    setEditLoading(true);
    
    try {
      // Create FormData for file uploads if needed
      const formData = new FormData();
      
      // Add text fields - create a User object structure
      const userData = {
        bio: editFormData.bio,
        location: editFormData.location,
        about: editFormData.about,
        socialMedia: editFormData.socialMedia
      };
      
      // Only add profilePic and banner URLs if using URL method
      if (uploadMethod.profilePic === 'url') {
        userData.profilePic = editFormData.profilePic;
      }
      if (uploadMethod.banner === 'url') {
        userData.banner = editFormData.banner;
      }
      
      formData.append('user', new Blob([JSON.stringify(userData)], { type: 'application/json' }));
      
      // Add files if using file upload method
      if (uploadMethod.profilePic === 'file' && profilePicFile) {
        formData.append('pp', profilePicFile);
      }
      
      if (uploadMethod.banner === 'file' && bannerFile) {
        formData.append('banner', bannerFile);
      }
      
      // Add upload method info
      formData.append('profilePicMethod', uploadMethod.profilePic);
      formData.append('bannerMethod', uploadMethod.banner);
      
      const response = await updateProfile(formData, true); // true indicates multipart form data
      console.log('Profile updated:', response.data);
      
      // Reset file states and clear validation errors
      setProfilePicFile(null);
      setBannerFile(null);
      setUploadMethod({ profilePic: 'url', banner: 'url' });
      setProfilePicError("");
      setBannerError("");
      setProfilePicUrlError("");
      setBannerUrlError("");
      
      // Refresh the entire profile data to ensure consistency
      try {
        const refreshedUser = await api.get(`/user/get/${username}`);
        setUser(refreshedUser.data);
        console.log("Profile refreshed with latest data:", refreshedUser.data);
      } catch (refreshError) {
        console.error("Error refreshing profile data:", refreshError);
        // Fallback to response data if refresh fails
        setUser(response.data);
      }
      
      setIsEditing(false);
      
      // Show success message (you can implement a toast notification here)
      alert('Profile updated successfully!');
      
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };
  
  return (
    <div className="profile-glass-root">
      <Header />
      <div className="profile-glass-banner-wrap taller">
        <img className="profile-glass-banner" src={user?.banner || '/default-banner.jpg'} alt="Profile Banner" />
        
        <div className="profile-glass-avatar-wrap overlap-half">
          <img className="profile-glass-avatar" src={user?.profilePic || '/default-avatar.jpg'} alt="User Avatar" />
        </div>
      </div>
      <div className="profile-glass-info-card overlap-margin">
        {currentUser?.userName === username ? (
          <button className="profile-glass-edit" onClick={isEditing ? handleCancelEdit : handleEditClick}>
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        ) : (
          <button 
            className={`profile-glass-edit ${isFollowing ? 'following' : ''}`} 
            onClick={follow}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
        {isEditing ? (
          <form className="profile-edit-form modern-form" onSubmit={handleSaveProfile}>
            <div className="form-header">
              <h3 className="form-title">✏️ Edit Your Profile</h3>
              <p className="form-subtitle">Update your information to keep your profile fresh</p>
            </div>
            
            <div className="form-section">
              <h4 className="section-title">📝 Basic Information</h4>
              
              <div className="edit-field">
                <label htmlFor="bio">
                  <span className="field-icon">💬</span>
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={editFormData.bio}
                  onChange={handleInputChange}
                  rows="3"
                  disabled={editLoading}
                  placeholder="Tell us about yourself..."
                  className="modern-textarea"
                  maxLength="50"
                />
                <div className="char-counter">
                  {editFormData.bio.length}/50 characters
                </div>
              </div>
              
              <div className="edit-field">
                <label htmlFor="location">
                  <span className="field-icon">📍</span>
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={editFormData.location}
                  onChange={handleInputChange}
                  disabled={editLoading}
                  placeholder="City, State?"
                  className="modern-input"
                  maxLength="50"
                />
                <div className="char-counter">
                  {editFormData.location.length}/50 characters
                </div>
              </div>
              
              <div className="edit-field">
                <label htmlFor="about">
                  <span className="field-icon">📋</span>
                  About Me
                </label>
                <textarea
                  id="about"
                  name="about"
                  value={editFormData.about}
                  onChange={handleInputChange}
                  rows="4"
                  disabled={editLoading}
                  placeholder="Share more details about yourself, your music, and your journey..."
                  className="modern-textarea"
                  maxLength="250"
                />
                <div className="char-counter">
                  {editFormData.about.length}/250 characters
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h4 className="section-title">🖼️ Visual Assets</h4>
              
              {/* Profile Picture */}
              <div className="edit-field">
                <label>
                  <span className="field-icon">👤</span>
                  Profile Picture
                </label>
                
                <div className="upload-method-selector">
                  <button
                    type="button"
                    className={`method-btn ${uploadMethod.profilePic === 'url' ? 'active' : ''}`}
                    onClick={() => handleUploadMethodChange('profilePic', 'url')}
                    disabled={editLoading}
                  >
                    🔗 URL
                  </button>
                  <button
                    type="button"
                    className={`method-btn ${uploadMethod.profilePic === 'file' ? 'active' : ''}`}
                    onClick={() => handleUploadMethodChange('profilePic', 'file')}
                    disabled={editLoading}
                  >
                    📁 Upload File
                  </button>
                </div>
                
                {uploadMethod.profilePic === 'url' ? (
                  <div>
                    <input
                      type="url"
                      name="profilePic"
                      value={editFormData.profilePic}
                      onChange={handleInputChange}
                      disabled={editLoading}
                      placeholder="https://example.com/your-profile-pic.jpg"
                      className={`modern-input ${profilePicUrlError ? 'error-input' : ''}`}
                    />
                    {profilePicUrlError && (
                      <div className="error-message">{profilePicUrlError}</div>
                    )}
                    <div className="file-info">
                      <small>
                        {currentUser?.role === 'USER' 
                          ? "Accepted formats: JPEG, JPG, PNG URLs only" 
                          : "Accepted formats: JPEG, PNG, GIF, WebP, BMP URLs"
                        }
                      </small>
                    </div>
                  </div>
                ) : (
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="profilePicFile"
                      accept={currentUser?.role === 'USER' ? "image/jpeg,image/jpg,image/png" : "image/*"}
                      onChange={(e) => handleFileChange('profilePic', e.target.files[0])}
                      disabled={editLoading}
                      className={`file-input ${profilePicError ? 'error-input' : ''}`}
                    />
                    <label htmlFor="profilePicFile" className="file-label">
                      {profilePicFile ? (
                        <>
                          <span className="file-icon">✅</span>
                          {profilePicFile.name}
                        </>
                      ) : (
                        <>
                          <span className="file-icon">📷</span>
                          Choose profile picture...
                        </>
                      )}
                    </label>
                    {profilePicError && (
                      <div className="error-message">{profilePicError}</div>
                    )}
                    <div className="file-info">
                      <small>
                        {currentUser?.role === 'USER' 
                          ? "Accepted formats: JPEG, JPG, PNG (max 5MB)" 
                          : "Accepted formats: JPEG, PNG, GIF, WebP, BMP (max 5MB)"
                        }
                      </small>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Banner */}
              <div className="edit-field">
                <label>
                  <span className="field-icon">🎨</span>
                  Banner Image
                </label>
                
                <div className="upload-method-selector">
                  <button
                    type="button"
                    className={`method-btn ${uploadMethod.banner === 'url' ? 'active' : ''}`}
                    onClick={() => handleUploadMethodChange('banner', 'url')}
                    disabled={editLoading}
                  >
                    🔗 URL
                  </button>
                  <button
                    type="button"
                    className={`method-btn ${uploadMethod.banner === 'file' ? 'active' : ''}`}
                    onClick={() => handleUploadMethodChange('banner', 'file')}
                    disabled={editLoading}
                  >
                    📁 Upload File
                  </button>
                </div>
                
                {uploadMethod.banner === 'url' ? (
                  <div>
                    <input
                      type="url"
                      name="banner"
                      value={editFormData.banner}
                      onChange={handleInputChange}
                      disabled={editLoading}
                      placeholder="https://example.com/your-banner.jpg"
                      className={`modern-input ${bannerUrlError ? 'error-input' : ''}`}
                    />
                    {bannerUrlError && (
                      <div className="error-message">{bannerUrlError}</div>
                    )}
                    <div className="file-info">
                      <small>
                        {currentUser?.role === 'USER' 
                          ? "Accepted formats: JPEG, JPG, PNG URLs only" 
                          : "Accepted formats: JPEG, PNG, GIF, WebP, BMP URLs"
                        }
                      </small>
                    </div>
                  </div>
                ) : (
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="bannerFile"
                      accept={currentUser?.role === 'USER' ? "image/jpeg,image/jpg,image/png" : "image/*"}
                      onChange={(e) => handleFileChange('banner', e.target.files[0])}
                      disabled={editLoading}
                      className={`file-input ${bannerError ? 'error-input' : ''}`}
                    />
                    <label htmlFor="bannerFile" className="file-label">
                      {bannerFile ? (
                        <>
                          <span className="file-icon">✅</span>
                          {bannerFile.name}
                        </>
                      ) : (
                        <>
                          <span className="file-icon">🖼️</span>
                          Choose banner image...
                        </>
                      )}
                    </label>
                    {bannerError && (
                      <div className="error-message">{bannerError}</div>
                    )}
                    <div className="file-info">
                      <small>
                        {currentUser?.role === 'USER' 
                          ? "Accepted formats: JPEG, JPG, PNG (max 5MB)" 
                          : "Accepted formats: JPEG, PNG, GIF, WebP, BMP (max 5MB)"
                        }
                      </small>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Social Media Links - UserPlus Feature */}
            {user.role === 'USERPLUS' && (
              <div className="form-section">
                <h4 className="section-title">🔗 Social Media Links</h4>
                <p className="section-description">Connect your social profiles (UserPlus Feature)</p>
                <div className="social-media-inputs">
                  {editFormData.socialMedia.map((link, index) => (
                    <div key={index} className="social-media-input-group">
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => handleSocialMediaChange(index, e.target.value)}
                        disabled={editLoading}
                        placeholder="https://www.youtube.com/@yourname"
                        className="social-media-input"
                        maxLength="200"
                      />
                      <button
                        type="button"
                        onClick={() => removeSocialMediaLink(index)}
                        disabled={editLoading}
                        className="remove-social-btn"
                        title="Remove link"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSocialMediaLink}
                    disabled={editLoading || editFormData.socialMedia.length >= 6}
                    className="add-social-btn"
                  >
                    ➕ Add Social Link {editFormData.socialMedia.length >= 6 && '(Max 6)'}
                  </button>
                </div>
              </div>
            )}
            
            <div className="form-actions">
              <button 
                type="button"
                className="cancel-btn modern-btn" 
                onClick={handleCancelEdit}
                disabled={editLoading}
              >
                ❌ Cancel
              </button>
              <button 
                type="submit" 
                className="save-btn modern-btn primary" 
                disabled={editLoading}
              >
                {editLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    ✅ Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <>
            <h2 className="profile-glass-username">{user?.userName || 'Unknown User'}</h2>
            <div className="profile-glass-badges-row">
              {user?.badges?.map((badge, i) => {
                const badgeInfo = BadgeService.getBadgeInfo(badge);
                return (
                  <span
                    key={i}
                    className="profile-glass-badge"
                    style={{ background: badgeInfo.color }}
                    title={badgeInfo.description}
                  >
                    {badgeInfo.icon}
                  </span>
                );
              })}
            </div>
            <p className="profile-glass-bio">{user?.bio || 'No bio available'}</p>
            <p className="profile-glass-location">{user?.location || 'Location not set'}</p>
            
            {/* Social Links - UserPlus Feature */}
            {user?.role === 'USERPLUS' && user?.socialMedia && user.socialMedia.length > 0 && (
              <div className={`profile-glass-social-links ${socialLinksExpanded ? 'expanded' : ''}`}>
                <div 
                  className="social-links-header"
                  onClick={() => setSocialLinksExpanded(!socialLinksExpanded)}
                >
                  <h4 className="social-links-title">🔗 Social Links</h4>
                  <span className={`expand-arrow ${socialLinksExpanded ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </div>
                
                {socialLinksExpanded && (
                  <div className="social-links-grid">
                    {user.socialMedia.map((link, index) => {
                      const domain = new URL(link).hostname.replace('www.', '');
                      const platformName = domain.split('.')[0];
                      
                      // Get platform icon based on domain
                      const getPlatformIcon = (domain) => {
                        if (domain.includes('youtube')) return '📺';
                        if (domain.includes('tiktok')) return '🎵';
                        if (domain.includes('instagram')) return '📷';
                        if (domain.includes('twitter') || domain.includes('x.com')) return '🐦';
                        if (domain.includes('facebook')) return '👥';
                        if (domain.includes('linkedin')) return '💼';
                        if (domain.includes('twitch')) return '🎮';
                        if (domain.includes('discord')) return '💬';
                        if (domain.includes('spotify')) return '🎧';
                        return '🌐';
                      };
                      
                      return (
                        <a 
                          key={index}
                          href={link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="social-link"
                          title={`Visit ${platformName}`}
                        >
                          <span className="social-icon">{getPlatformIcon(domain)}</span>
                          <span className="social-platform">{platformName.charAt(0).toUpperCase() + platformName.slice(1)}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {/* About Section - Moved to top */}
        {user?.about && (
          <div className="profile-glass-about-section">
            <div className="about-preview">
              <h4 className="about-title">📋 About</h4>
              <p className="about-text">
                {user?.about && user.about.length > 150 ? `${user.about.substring(0, 150)}...` : user?.about || 'No about information available'}
              </p>
              {user?.about && user.about.length > 150 && (
                <button 
                  className="read-more-btn"
                  onClick={() => setShowAboutModal(true)}
                >
                  Read More →
                </button>
              )}
            </div>
          </div>
        )}

        <div className="profile-glass-stats">
          <div className="profile-glass-stat"><span className="stat-icon">📝</span><span className="stat-value">{user?.posts?.length || 0}</span><span className="stat-label">Posts</span></div>
          <div className="profile-glass-stat"><span className="stat-icon">👥</span><span className="stat-value">{relationshipSummary?.followersCount || 0}</span><span className="stat-label clickable" onClick={() => showTheFollow('followers')}>Followers</span></div>
          <div className="profile-glass-stat"><span className="stat-icon">➡️</span><span className="stat-value">{relationshipSummary?.followingCount || 0}</span><span className="stat-label clickable" onClick={() => showTheFollow('following')}>Following</span></div>
        </div>
        
        <ShowFollow 
          userName={username}
          isOpen={showFollow}
          onClose={closeFollowPopup}
          type={followPopupType}
        />

        {/* About Modal */}
        {showAboutModal && (
          <div className="modal-overlay" onClick={() => setShowAboutModal(false)}>
            <div className="modal-content about-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">📋 About {user?.userName || 'User'}</h3>
                <button 
                  className="modal-close-btn"
                  onClick={() => setShowAboutModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <p className="about-full-text">{user?.about || 'No about information available'}</p>
              </div>
            </div>
          </div>
        )}
        
      </div>
      
      <div className="profile-glass-tabs">
        <button className={`profile-glass-tab${activeTab === "posts" ? " active" : ""}`} onClick={() => setActiveTab("posts")}>Posts</button>
        <button className={`profile-glass-tab${activeTab === "demos" ? " active" : ""}`} onClick={() => setActiveTab("demos")}>Demos</button>
        <button className={`profile-glass-tab${activeTab === "friends" ? " active" : ""}`} onClick={() => setActiveTab("friends")}>Features</button>
      </div>
      <div className="profile-glass-content">
        {activeTab === "posts" && (
          <div>
            <h3>Your Recent Posts</h3>
             <div className="profilePosts">
            
           {posts.map((item) => (
             <FeedItem key={item.id} {...item} />
           ))}
         </div>
         <div id="pageButtons">
        <button className="section-more-btn" onClick={prevPage} hidden={totalPages < 2 ? true:false} disabled={page == 0 || page == null? true: false}>Previous Page</button>
        <button className="section-more-btn" onClick={nextPage} hidden={totalPages < 2 ? true:false}  disabled={page == totalPages-1 || page == null? true: false}>Next Page</button>
        </div>
          </div>
        )}
        {activeTab === "demos" && (
          <div>
            {addDemo && currentUser?.userName === username && (
              <AddDemo 
                setAddDemo={setAddDemo} 
                onDemoAdded={handleDemoAdded} 
                userRole={currentUser?.role || 'USER'} 
              />
            )}
            
            <DemoGrid 
              demos={demos}
              currentUser={currentUser}
              username={username}
              onAddDemo={handleAddDemo}
              onDeleteDemo={handleDeleteDemo}
            />
          </div>
        )}
        {activeTab === "friends" && (
          <div>
          <h3>Featured On</h3>
           <div className="profilePosts">
            
           {featuredOn.map((item) => (
             <FeedItem key={item.id} {...item} />
           ))}
         </div>
         <div id="pageButtons">
        <button className="section-more-btn" onClick={prevFeatPage} hidden={featTotalPages < 2 ? true:false} disabled={featPage == 0 || featPage == null? true: false}>Previous Page</button>
        <button className="section-more-btn" onClick={nextFeatPage} hidden={featTotalPages < 2 ? true:false}  disabled={featPage == featTotalPages-1 || featPage == null? true: false}>Next Page</button>
        </div>
         </div>
          /*
          <div>
            
            {featuredOn.length > 0 && 
            <h4>{Array.from(new Map(featuredOn.map(featuredOn => [featuredOn.id, featuredOn])).values())?.map((featuredOn, i) => (
              <div key={featuredOn.id}>
                <h3>{featuredOn.title}</h3>
                <p>{featuredOn.description}</p>
              </div>
            ))} </h4>
            || "List or grid of featured on posts go here."}
          </div>
          */
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Profile;
