import "../Styling/CreatePost.css"
import React, { useState, useRef, useEffect } from "react";
import Header from "../Components/Header";
import { useNavigate } from "react-router-dom";
import api, { getCurrentUser } from "../services/AuthService";
const GENRES = [
  "Song","Beat","Loop","Instrument","Free","Paid",'Hip Hop', 'Pop', 'Rock', 'Jazz', 'R&B', 'Electronic', 'Classical',
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
  const [errors, setErrors] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  
  const [post, setPost] = useState({
    title: "",
    description: "",
    features: [],
    genre: [],
    music:""
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

  const removeFeature = (name) =>
    setFeatures(features.filter((f) => f !== name));

  const toggleGenre = (g) => {
    const newGenres = genres.includes(g)
      ? genres.filter((x) => x !== g)
      : [...genres, g];
    setGenres(newGenres);
    setPost({ ...post, genre: newGenres });
  };

  const genreLabel =
    genres.length === 0 ? 'Select genres…' : genres.join(', ');

  // Validation functions
  const validateStep1 = () => {
    const newErrors = {};
    if (!post.title || post.title.trim() === '') {
      newErrors.title = 'Song name is required';
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

  // Handle file selection and clear errors
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    // Clear file error when user selects a file
    if (errors.file) {
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
        <span className="step-number">1</span>
        <span className="step-label">Song Details</span>
      </div>
      <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
        <span className="step-number">2</span>
        <span className="step-label">Features</span>
      </div>
      <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
        <span className="step-number">3</span>
        <span className="step-label">Upload</span>
      </div>
      <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
        <span className="step-number">4</span>
        <span className="step-label">Preview</span>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="step-content">
      <h3 className="step-title">Song Details</h3>
      <p className="step-description">Tell us about your song</p>
      
      <div className="input-group">
        <label className="input-label">Song Name *</label>
        <input
          name="title"
          type="text"
          className={`text-input ${errors.title ? 'error' : ''}`}
          placeholder="Format Suggestion: Song Name or Instrument - BPM"
          onChange={handleInput}
        />
        {errors.title && <span className="error-message">{errors.title}</span>}
      </div>

      <div className="input-group">
        <label className="input-label">Description</label>
        <textarea
          name="description"
          rows={4}
          className="text-area"
          placeholder="Describe your song, inspiration, or any special notes..."
          onChange={handleInput}
        />
      </div>

      <div className="input-group">
        <label className="input-label">Genre</label>
        <div
          className={`dropdown${ddOpen ? ' open' : ''}`}
          tabIndex={0}
          onBlur={() => setDdOpen(false)}
          ref={ddRef}
        >
          <div
            className="dropdown-toggle"
            onClick={() => {
              setDdOpen((o) => !o);
              setTimeout(() => ddRef.current?.focus(), 0);
            }}
          >
            {genreLabel}
          </div>

          <div className="dropdown-menu">
            <h3>Category:</h3>
            {GENRES.slice(0, 6).map((g) => (
              <label key={g} className="dropdown-item">
                <input
                  name="genre"
                  type="checkbox"
                  checked={genres.includes(g)}
                  onChange={() => toggleGenre(g)}
                />
                {g}
              </label>
            ))}
            <h3>Genres:</h3>
            {GENRES.slice(6).map((g) => (
              <label key={g} className="dropdown-item">
                <input
                  type="checkbox"
                  checked={genres.includes(g)}
                  onChange={() => toggleGenre(g)}
                />
                {g}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h3 className="step-title">Features & Collaborators</h3>
      <p className="step-description">Add any featured artists or collaborators</p>
      
      <div className="input-group">
        <label className="input-label">Features</label>
        <input
          name="features"
          type="text"
          className="text-input"
          placeholder="Press Enter to add a feature"
          value={featureInput}
          onChange={(e) => setFeatureInput(e.target.value)}
          onKeyDown={handleFeatureKeyDown}
        />
        <div className="tag-list">
          {features.map((f) => (
            <span key={f} className="tag" onClick={() => removeFeature(f)}>
              {f} ×
            </span>
          ))}
        </div>
      </div>

      <div className="features-preview">
        <h4>Current Features:</h4>
        {features.length === 0 ? (
          <p className="no-features">No features added yet</p>
        ) : (
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <span className="feature-icon">🎤</span>
                <span className="feature-name">{feature}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h3 className="step-title">Upload Audio File</h3>
      <p className="step-description">Upload your audio file (.mp3 or .wav)</p>
      
      <div className="upload-section">
        <div className="file-upload-area">
          <input
            type="file"
            accept=".mp3,.wav"
            className="file-input"
            onChange={handleFileChange}
            id="audio-upload"
          />
          <label htmlFor="audio-upload" className={`file-upload-label ${errors.file ? 'error' : ''}`}>
            <div className="upload-icon">🎵</div>
            <div className="upload-text">
              {file ? (
                <>
                  <strong>File Selected:</strong>
                  <span>{file.name}</span>
                  <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </>
              ) : (
                <>
                  <strong>Click to upload</strong>
                  <span>or drag and drop</span>
                  <span className="file-types">MP3, WAV up to 50MB</span>
                </>
              )}
            </div>
          </label>
        </div>
        {errors.file && <span className="error-message">{errors.file}</span>}
      </div>

      {file && (
        <div className="file-preview">
          <h4>File Preview:</h4>
          <div className="file-info">
            <span className="file-name">{file.name}</span>
            <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            <span className="file-type">{file.type}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content">
      <h3 className="step-title">Preview Your Post</h3>
      <p className="step-description">Review your post before publishing</p>
      
      <div className="post-preview">
        <div className="preview-card">
          <div className="preview-header">
            <div className="preview-profile">
              <div className="preview-avatar">👤</div>
              <div className="preview-user-info">
                <span className="preview-username">{currentUser?.userName || 'User'}</span>
                <span className="preview-time">Just now</span>
              </div>
            </div>
          </div>
          
          <div className="preview-content">
            <h3 className="preview-title">{post.title || "Song Title"}</h3>
            <p className="preview-description">{post.description || "No description provided"}</p>
            
            {features.length > 0 && (
              <div className="preview-features">
                <span className="preview-feat-label">Feat:</span>
                <span className="preview-feat-list">{features.join(", ")}</span>
              </div>
            )}
            
            {genres.length > 0 && (
              <div className="preview-genres">
                {genres.map((genre, index) => (
                  <span key={index} className="preview-genre-tag">{genre}</span>
                ))}
              </div>
            )}
            
            {file && (
              <div className="preview-audio">
                <div className="audio-player-preview">
                  <span className="audio-icon">🎵</span>
                  <span className="audio-name">{file.name}</span>
                  <span className="audio-duration">--:--</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="preview-stats">
            <span className="preview-likes">❤️ 0</span>
            <span className="preview-comments">💬 0</span>
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

  return (
    <div className="page-wrapper">
      <Header />
      <div className="create-post-container">
        <div className="create-post-card">
          <h2 className="card-heading">Create New Post</h2>
          
          {renderStepIndicator()}
          
          <form onSubmit={handleSubmit}>
            {renderCurrentStep()}
            
            <div className="step-navigation">
              {currentStep > 1 && (
                <button 
                  type="button" 
                  className="nav-button prev-button"
                  onClick={prevStep}
                >
                  ← Previous
                </button>
              )}
              
              {currentStep < 4 ? (
                <button 
                  type="button" 
                  className={`nav-button next-button ${(currentStep === 1 && !post.title.trim()) || (currentStep === 3 && !file) ? 'disabled' : ''}`}
                  onClick={(e) => nextStep(e)}
                  disabled={(currentStep === 1 && !post.title.trim()) || (currentStep === 3 && !file)}
                >
                  Next →
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="submit-button"
                >
                  Publish Post
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreatePost