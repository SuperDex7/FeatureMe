import "../Styling/CreatePost.css"
import React, { useState, useRef, useEffect } from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { useNavigate } from "react-router-dom";
import api, { getCurrentUser } from "../services/AuthService";
const GENRES = [
  "Song","Beat","Loop","Instrument","Open","Free","Paid",'Hip Hop', 'Pop', 'Rock', 'Jazz', 'R&B', 'Electronic', 'Classical',
  'Reggae', 'Metal', 'Country', 'Indie', 'Folk', 'Blues'
];

function CreatePost(){
  const [currentStep, setCurrentStep] = useState(1);
  const [songName, setSongName] = useState('');
  const [features, setFeatures] = useState([]);
  const [featureInput, setFeatureInput] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [genres, setGenres] = useState([]);
  const [ddOpen, setDdOpen] = useState(false);
  const [genrePopupOpen, setGenrePopupOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  
  const [post, setPost] = useState({
    title: "",
    description: "",
    features: [],
    genre: [],
    music: "",
    freeDownload: false
  })

  const navigate = useNavigate();
  const ddRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []); 

  const handleFeatureKeyDown = (e) => {
    if (e.key === 'Enter' && featureInput.trim()) {
      e.preventDefault();
      const newFeature = featureInput.trim();
      const newFeatures = [...features, newFeature];
      setFeatures(newFeatures);
      setFeatureInput("");
      setPost({ ...post, features: newFeatures });
    }
  };

  const handleInput = (e) => {
    setPost({...post, [e.target.name]: e.target.value})
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  }

  const handleFreeDownloadToggle = () => {
    setPost({...post, freeDownload: !post.freeDownload})
  }

  const removeFeature = (name) =>
    setFeatures(features.filter((f) => f !== name));

  const toggleGenre = (g) => {
    const newGenres = genres.includes(g)
      ? genres.filter((x) => x !== g)
      : [...genres, g];
    setGenres(newGenres);
    setPost({ ...post, genre: newGenres });
    
    // Clear genre error when a genre is selected
    if (newGenres.length > 0 && errors.genre) {
      setErrors(prev => ({ ...prev, genre: '' }));
    }
  };

  const handleGenrePopupClose = () => {
    setGenrePopupOpen(false);
  };

  const handleGenrePopupOpen = () => {
    setGenrePopupOpen(true);
  };

  // Handle escape key to close popup
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && genrePopupOpen) {
        handleGenrePopupClose();
      }
    };

    if (genrePopupOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [genrePopupOpen]);

  const genreLabel =
    genres.length === 0 ? 'Select genres…' : genres.join(', ');

  // Validation functions
  const validateStep1 = () => {
    const newErrors = {};
    if (!post.title || post.title.trim() === '') {
      newErrors.title = 'Song name is required';
    }
    if (genres.length === 0) {
      newErrors.genre = 'At least one genre is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!file) {
      newErrors.file = 'Audio file is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = (e) => {
    // Prevent form submission when clicking Next button
    if (e) {
      e.preventDefault();
    }
    
    let canProceed = true;
    
    if (currentStep === 1) {
      canProceed = validateStep1();
    } else if (currentStep === 3) {
      canProceed = validateStep3();
    }
    
    if (canProceed && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Only allow submission on the final step
    if (currentStep !== 4) {
      return;
    }

    const formData = new FormData();
    formData.append("post", new Blob([JSON.stringify(post)], {type: "application/json"}) )
    if (file) {
      /*
      if (file.type !== "audio/mpeg") {
        alert("Only MP3 files are allowed.");
        return;
      } */
      formData.append('file', file);
    }

    console.log('Posting…', Object.fromEntries(formData));
    api.post(`/posts/create`, formData, {
      headers:{"Content-Type": "multipart/form-data"}
    }).then(res => {
      console.log('Upload successful:', res.data);
      alert("Upload successful!");
      navigate("/feed");
    })
    .catch(error => {
      console.error('Upload failed:', error);
      if (error.code === 'ECONNABORTED') {
        alert("Request timed out. Please check your connection and try again.");
      } else if (error.response && error.response.status === 500) {
        alert("Server error: " + (error.response.data || "Unknown error"));
      } else {
        alert("Upload failed. Please try again.");
      }
  });
}

  // Handle file selection with validation
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file type based on user role
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    const userRole = currentUser?.role;
    
    let isValidFile = false;
    let errorMessage = '';

    if (userRole === 'USERPLUS') {
      // Plus users can upload MP3 and WAV
      if (fileExtension === 'mp3' || fileExtension === 'wav') {
        isValidFile = true;
      } else {
        errorMessage = `Plus users can only upload MP3 and WAV files. You selected: .${fileExtension}`;
      }
    } else if (userRole === 'USER') {
      // Free users can only upload MP3
      if (fileExtension === 'mp3') {
        isValidFile = true;
      } else {
        errorMessage = `Free users can only upload MP3 files. You selected: .${fileExtension}. Upgrade to Plus for WAV support!`;
      }
    } else {
      errorMessage = 'Invalid user role. Cannot upload files.';
    }

    // Additional file size validation
    const maxFileSize = userRole === 'USERPLUS' ? 90 * 1024 * 1024 : 15 * 1024 * 1024; // 90MB for Plus, 15MB for free
    if (isValidFile && selectedFile.size > maxFileSize) {
      const maxSizeMB = maxFileSize / (1024 * 1024);
      isValidFile = false;
      errorMessage = `File size exceeds limit. Maximum allowed: ${maxSizeMB}MB for ${userRole} users.`;
    }

    if (isValidFile) {
      setFile(selectedFile);
      // Clear file error when user selects a valid file
      if (errors.file) {
        setErrors(prev => ({ ...prev, file: '' }));
      }
    } else {
      setFile(null);
      setErrors(prev => ({ ...prev, file: errorMessage }));
      // Clear the file input
      e.target.value = '';
    }
  };

  const renderStepIndicator = () => (
    <div className="create-post-step-indicator">
      <div className={`create-post-step ${currentStep >= 1 ? 'active' : ''}`}>
        <span className="create-post-step-number">1</span>
        <span className="create-post-step-label">Song Details</span>
      </div>
      <div className={`create-post-step ${currentStep >= 2 ? 'active' : ''}`}>
        <span className="create-post-step-number">2</span>
        <span className="create-post-step-label">Features</span>
      </div>
      <div className={`create-post-step ${currentStep >= 3 ? 'active' : ''}`}>
        <span className="create-post-step-number">3</span>
        <span className="create-post-step-label">Upload & Download</span>
      </div>
      <div className={`create-post-step ${currentStep >= 4 ? 'active' : ''}`}>
        <span className="create-post-step-number">4</span>
        <span className="create-post-step-label">Preview</span>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="create-post-step-content">
      <h3 className="create-post-step-title">Song Details</h3>
      <p className="create-post-step-description">Tell us about your song</p>
      
      <div className="create-post-input-group">
        <label className="create-post-input-label">Song Name *</label>
        <input
          name="title"
          type="text"
          className={`create-post-text-input ${errors.title ? 'error' : ''}`}
          placeholder="Format Suggestion: Song Name or Instrument - BPM"
          maxLength="50"
          onChange={handleInput}
        />
        <div className="create-post-char-counter">
          {post.title.length}/50 characters
        </div>
        {errors.title && <span className="create-post-error-message">{errors.title}</span>}
      </div>

      <div className="create-post-input-group">
        <label className="create-post-input-label">Description</label>
        <textarea
          name="description"
          rows={4}
          className="create-post-text-area"
          placeholder="Describe your song, inspiration, or any special notes..."
          maxLength="80"
          onChange={handleInput}
        />
        <div className="create-post-char-counter">
          {post.description.length}/80 characters
        </div>
      </div>


      <div className="create-post-input-group">
        <label className="create-post-input-label">Genre *</label>
        <button
          type="button"
          className={`create-post-genre-selector-button ${errors.genre ? 'error' : ''}`}
          onClick={handleGenrePopupOpen}
        >
          <span className="create-post-genre-button-text">
            {genres.length === 0 ? 'Select genres…' : `${genres.length} genre${genres.length > 1 ? 's' : ''} selected`}
          </span>
          <span className="create-post-genre-button-icon">🎵</span>
        </button>
        {errors.genre && <span className="create-post-error-message">{errors.genre}</span>}
        {genres.length > 0 && (
          <div className="selected-genres-preview">
            {genres.map((genre, index) => (
              <span key={index} className="selected-genre-tag">
                {genre}
                <button
                  type="button"
                  className="remove-genre-btn"
                  onClick={() => toggleGenre(genre)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="create-post-step-content">
      <h3 className="create-post-step-title">Features & Collaborators</h3>
      <p className="create-post-step-description">Add any featured artists or collaborators</p>
      
      <div className="approval-notice">
        <div className="notice-icon">⚠️</div>
        <div className="notice-content">
          <strong>Feature Approval Required</strong>
          <p>Featured users must approve before your post goes live. Your post will remain in draft status until all features are approved. Make sure to spell their
            username correctly. Case sensitive!
          </p>
        </div>
      </div>
      
      <div className="create-post-input-group">
        <label className="create-post-input-label">Features</label>
        <input
          name="features"
          type="text"
          className="create-post-text-input"
          placeholder="Press Enter to add a feature"
          value={featureInput}
          onChange={(e) => setFeatureInput(e.target.value)}
          onKeyDown={handleFeatureKeyDown}
        />
        <div className="create-post-tag-list">
          {features.map((f) => (
            <span key={f} className="create-post-tag" onClick={() => removeFeature(f)}>
              {f} ×
            </span>
          ))}
        </div>
      </div>

      <div className="create-post-features-preview">
        <h4>Current Features:</h4>
        {features.length === 0 ? (
          <p className="no-features">No features added yet</p>
        ) : (
          <div className="create-post-features-grid">
            {features.map((feature, index) => (
              <div key={index} className="create-post-feature-card">
                <span className="create-post-feature-icon">🎤</span>
                <span className="create-post-feature-name">{feature}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => {
    const userRole = currentUser?.role;
    const acceptedTypes = userRole === 'USERPLUS' ? '.mp3,.wav' : '.mp3';
    const maxFileSize = userRole === 'USERPLUS' ? 90 : 15;
    const supportedFormats = userRole === 'USERPLUS' ? 'MP3, WAV' : 'MP3 only';
    
    return (
      <div className="create-post-step-content">
        <h3 className="create-post-step-title">Upload Audio File & Download Settings</h3>
        <p className="create-post-step-description">
          {userRole === 'USERPLUS' 
            ? 'Upload your audio file (.mp3 or .wav) and configure download settings' 
            : 'Upload your MP3 file (.mp3 only - Upgrade to Plus for WAV support!) and configure download settings'
          }
        </p>
        
        {userRole === 'USER' && (
          <div className="create-post-upgrade-notice">
            <div className="notice-icon">⭐</div>
            <div className="notice-content">
              <strong>Upgrade to Plus for more formats!</strong>
              <p>Plus users can upload both MP3 and WAV files with higher file size limits.</p>
            </div>
          </div>
        )}
        
        <div className="create-post-upload-section">
          <div className="create-post-file-upload-area">
            <input
              type="file"
              accept={acceptedTypes}
              className="create-post-file-input"
              onChange={handleFileChange}
              id="audio-upload"
            />
            <label htmlFor="audio-upload" className={`create-post-file-upload-label ${errors.file ? 'error' : ''}`}>
              <div className="create-post-upload-icon">🎵</div>
              <div className="create-post-upload-text">
                {file ? (
                  <>
                    <strong>File Selected:</strong>
                    <span>{file.name}</span>
                    <span className="create-post-file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </>
                ) : (
                  <>
                    <strong>Click to upload</strong>
                    <span>or drag and drop</span>
                    <span className="create-post-file-types">{supportedFormats} up to {maxFileSize}MB</span>
                  </>
                )}
              </div>
            </label>
          </div>
          {errors.file && <span className="create-post-error-message">{errors.file}</span>}
        </div>

        {file && (
          <div className="create-post-file-preview">
            <h4>File Preview:</h4>
            <div className="create-post-file-info">
              <span className="create-post-file-name">{file.name}</span>
              <span className="create-post-file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              <span className="create-post-file-type">{file.type}</span>
            </div>
          </div>
        )}

        <div className="create-post-input-group">
          <div className="create-post-toggle-container">
            <label className="create-post-toggle-label">
              <input
                type="checkbox"
                checked={post.freeDownload}
                onChange={handleFreeDownloadToggle}
                className="create-post-toggle-checkbox"
              />
              <span className="create-post-toggle-slider"></span>
              <span className="create-post-toggle-text">Enable Download</span>
            </label>
            <p className="create-post-toggle-description">
              Allow users to download your track.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="create-post-step-content">
      <h3 className="create-post-step-title">Preview Your Post</h3>
      <p className="create-post-step-description">Review your post before publishing</p>
      
      <div className="create-post-preview">
        <div className="create-post-preview-card">
          <div className="create-post-preview-header">
            <div className="create-post-preview-profile">
              <div className="create-post-preview-avatar">👤</div>
              <div className="create-post-preview-user-info">
                <span className="create-post-preview-username">{currentUser?.userName || 'User'}</span>
                <span className="create-post-preview-time">Just now</span>
              </div>
            </div>
          </div>
          
          <div className="create-post-preview-content">
            <h3 className="create-post-preview-title">{post.title || "Song Title"}</h3>
            <p className="create-post-preview-description">{post.description || "No description provided"}</p>
            
            {features.length > 0 && (
              <div className="create-post-preview-features">
                <span className="create-post-preview-feat-label">Feat:</span>
                <span className="create-post-preview-feat-list">{features.join(", ")}</span>
              </div>
            )}
            
            {genres.length > 0 && (
              <div className="create-post-preview-genres">
                {genres.map((genre, index) => (
                  <span key={index} className="create-post-preview-genre-tag">{genre}</span>
                ))}
              </div>
            )}
            
            {file && (
              <div className="create-post-preview-audio">
                <div className="create-post-audio-player-preview">
                  <span className="create-post-audio-icon">🎵</span>
                  <span className="create-post-audio-name">{file.name}</span>
                  <span className="create-post-audio-duration">--:--</span>
                </div>
                <div className="create-post-preview-download-status">
                  <span className={`download-badge ${post.freeDownload ? 'free' : 'paid'}`}>
                    {post.freeDownload ? '🆓 Free Download' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="create-post-preview-stats">
            <span className="create-post-preview-likes">❤️ 0</span>
            <span className="create-post-preview-comments">💬 0</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch(currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  const renderGenrePopup = () => (
    <div className={`create-post-genre-popup-overlay ${genrePopupOpen ? 'open' : ''}`} onClick={handleGenrePopupClose}>
      <div className="create-post-genre-popup" onClick={(e) => e.stopPropagation()}>
        <div className="create-post-genre-popup-header">
          <h3 className="create-post-genre-popup-title">Select Genres</h3>
          <button 
            type="button" 
            className="create-post-genre-popup-close"
            onClick={handleGenrePopupClose}
          >
            ×
          </button>
        </div>
        
        <div className="create-post-genre-popup-content">
          <div className="create-post-genre-category">
            <h4 className="create-post-genre-category-title">Category</h4>
            <div className="create-post-genre-options">
              {GENRES.slice(0, 7).map((g) => (
                <label key={g} className="create-post-genre-option">
                  <input
                    type="checkbox"
                    checked={genres.includes(g)}
                    onChange={() => toggleGenre(g)}
                  />
                  <span className="create-post-genre-option-text">{g}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="create-post-genre-category">
            <h4 className="create-post-genre-category-title">Music Genres</h4>
            <div className="create-post-genre-options">
              {GENRES.slice(7).map((g) => (
                <label key={g} className="create-post-genre-option">
                  <input
                    type="checkbox"
                    checked={genres.includes(g)}
                    onChange={() => toggleGenre(g)}
                  />
                  <span className="create-post-genre-option-text">{g}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="create-post-genre-popup-footer">
          <button 
            type="button" 
            className="create-post-genre-popup-done"
            onClick={handleGenrePopupClose}
          >
            Done ({genres.length} selected)
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="create-post-page">
      <Header />
      <div className="create-post-main">
        <div className="create-post-container">
          <div className="create-post-header">
            <h1 className="create-post-title">Create New Post</h1>
            <p className="create-post-subtitle">Share your music with the world</p>
          </div>
          
          <div className="create-post-card">
            {renderStepIndicator()}
            
            <form onSubmit={handleSubmit} className="create-post-form">
              {renderCurrentStep()}
              
              <div className="create-post-step-navigation">
                {currentStep > 1 && (
                  <button 
                    type="button" 
                    className="create-post-nav-button create-post-prev-button"
                    onClick={prevStep}
                  >
                    ← Previous
                  </button>
                )}
                
                {currentStep < 4 ? (
                  <button 
                    type="button" 
                    className={`create-post-nav-button create-post-next-button ${(currentStep === 1 && (!post.title.trim() || genres.length === 0)) || (currentStep === 3 && !file) ? 'disabled' : ''}`}
                    onClick={(e) => nextStep(e)}
                    disabled={(currentStep === 1 && (!post.title.trim() || genres.length === 0)) || (currentStep === 3 && !file)}
                  >
                    Next →
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    className="create-post-submit-button"
                  >
                    Publish Post
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {renderGenrePopup()}
      <Footer />
    </div>
  );
}

export default CreatePost