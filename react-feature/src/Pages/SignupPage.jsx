import React, { useState } from "react";
import Header2 from "../Components/Header2";
import "../SignupComp/SignupPage.css";
import "../Styling/Profile.css";
import axios from 'axios';
import api from '../services/AuthService';

function SignupPage() {
  const [step, setStep] = useState(1); // 1-4 = form steps, 5 = profile preview
  const [activeTab, setActiveTab] = useState("about");
  const [formData, setFormData] = useState({
    userName: "",
    password: "",
    email: "",
    role: "USER",
    bio: "",
    about: "",
    profilePic: "/dpp.jpg",
    banner: "/pb.jpg",
    location: "",
    socialMedia: [],
    badges: [],
    demo: [],
    friends: [],
    followers: [],
    following: [],
    featuredOn: [],
    posts: []
  });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const handleInput = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const picUrl = URL.createObjectURL(file);
      setFormData({ ...formData, profilePic: picUrl });
      setProfilePicFile(file);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const bannerUrl = URL.createObjectURL(file);
      setFormData({ ...formData, banner: bannerUrl });
      setBannerFile(file);
    }
  };



  const handleNext = () => {
    if (step === 1 && (!formData.email || !formData.password)) {
      alert("Please fill in both email and password");
      return;
    }
    if (step === 2 && !formData.userName) {
      alert("Please enter a username");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 5) {
      setStep(4); // Go back to last form step
    } else {
      setStep(step - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    
    const submitData = new FormData();
    submitData.append("user", new Blob([JSON.stringify(formData)], { type: "application/json" }));
    
    if (profilePicFile) {
      submitData.append("pp", profilePicFile);
    }
    if (bannerFile) {
      submitData.append("banner", bannerFile);
    }

    axios.post("http://localhost:8080/api/user/auth/create", submitData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    .then(res => {
      console.log(res);
      alert("Account created successfully!");
      // Redirect to login or dashboard
    })
    .catch(err => {
      console.log(err);
      alert("Error creating account. Please try again.");
    });
  };

  // Step 1: Email and Password
  if (step === 1) {
    return (
      <div className="signup-page">
        <Header2 />
        <div className="signup-container">
          <div className="signup-form-card">
            <div className="step-indicator">
              <span className="step-number">1</span>
              <span className="step-title">Account Details</span>
            </div>
            <h2>Create Your Account</h2>
            <p>Let's start with your basic account information</p>
            
            <form className="signup-form">
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInput}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInput}
                  placeholder="Create a strong password"
                  required
                />
              </div>

              <button type="button" className="next-btn" onClick={handleNext}>
                Next: Choose Username
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Username
  if (step === 2) {
    return (
      <div className="signup-page">
        <Header2 />
        <div className="signup-container">
          <div className="signup-form-card">
            <div className="step-indicator">
              <span className="step-number">2</span>
              <span className="step-title">Choose Username</span>
            </div>
            <h2>Pick Your Username</h2>
            <p>This is how others will see you on the platform</p>
            
            <form className="signup-form">
              <div className="form-group">
                <label htmlFor="userName">Username *</label>
                <input
                  type="text"
                  id="userName"
                  name="userName"
                  value={formData.userName}
                  onChange={handleInput}
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="back-btn" onClick={handleBack}>
                  Back
                </button>
                <button type="button" className="next-btn" onClick={handleNext}>
                  Next: Tell Us About You
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Bio and About
  if (step === 3) {
    return (
      <div className="signup-page">
        <Header2 />
        <div className="signup-container">
          <div className="signup-form-card">
            <div className="step-indicator">
              <span className="step-number">3</span>
              <span className="step-title">About You</span>
            </div>
            <h2>Tell Us About Yourself</h2>
            <p>Help others get to know you better (optional)</p>
            
            <form className="signup-form">
              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <input
                  type="text"
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInput}
                  placeholder="Short description about yourself..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="about">About</label>
                <textarea
                  id="about"
                  name="about"
                  value={formData.about}
                  onChange={handleInput}
                  placeholder="Tell me about yourself..."
                  rows="4"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="back-btn" onClick={handleBack}>
                  Back
                </button>
                <button type="button" className="next-btn" onClick={handleNext}>
                  Next: Profile Pictures
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Profile Pictures
  if (step === 4) {
    return (
      <div className="signup-page">
        <Header2 />
        <div className="signup-container">
          <div className="signup-form-card">
            <div className="step-indicator">
              <span className="step-number">4</span>
              <span className="step-title">Profile Pictures</span>
            </div>
            <h2>Add Your Photos</h2>
            <p>Make your profile stand out (optional)</p>
            
            <form className="signup-form">
              <div className="form-group">
                <label htmlFor="profilePic">Profile Picture</label>
                <input
                  type="file"
                  id="profilePic"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="banner">Banner Image</label>
                <input
                  type="file"
                  id="banner"
                  accept="image/*"
                  onChange={handleBannerChange}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="back-btn" onClick={handleBack}>
                  Back
                </button>
                <button type="button" className="next-btn" onClick={handleNext}>
                  Preview Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 5: Profile Preview
  return (
    <div className="profile-glass-root">
      <Header2 />
      <div className="profile-glass-banner-wrap taller">
        <img className="profile-glass-banner" src={formData.banner} alt="Profile Banner" />
        
        <div className="profile-glass-avatar-wrap overlap-half">
          <img className="profile-glass-avatar" src={formData.profilePic} alt="User Avatar" />
        </div>
      </div>
      
      <div className="profile-glass-info-card overlap-margin">
        <button className="profile-glass-edit" onClick={handleBack}>Back to Form</button>
        <h2 className="profile-glass-username">{formData.userName}</h2>
        <div className="profile-glass-badges-row">
          <span className="profile-glass-badge" style={{ background: "#4fd1c5" }} title="New User">
            🆕
          </span>
        </div>
        <p className="profile-glass-bio">{formData.bio || "No bio yet"}</p>
        <p className="profile-glass-location">{formData.location || "Location not set"}</p>
        <div className="profile-glass-stats">
          <div className="profile-glass-stat">
            <span className="stat-icon">📝</span>
            <span className="stat-value">0</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="profile-glass-stat">
            <span className="stat-icon">👥</span>
            <span className="stat-value">0</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="profile-glass-stat">
            <span className="stat-icon">➡️</span>
            <span className="stat-value">0</span>
            <span className="stat-label">Following</span>
          </div>
        </div>
      </div>
      
      <div className="profile-glass-tabs">
        <button 
          className={`profile-glass-tab${activeTab === "posts" ? " active" : ""}`} 
          onClick={() => setActiveTab("posts")}
        >
          Posts
        </button>
        <button 
          className={`profile-glass-tab${activeTab === "about" ? " active" : ""}`} 
          onClick={() => setActiveTab("about")}
        >
          About
        </button>
        <button 
          className={`profile-glass-tab${activeTab === "friends" ? " active" : ""}`} 
          onClick={() => setActiveTab("friends")}
        >
          Friends
        </button>
      </div>
      
      <div className="profile-glass-content">
        {activeTab === "posts" && (
          <div>
            <h3>Your Recent Posts</h3>
            <p>No posts yet. Start sharing your content!</p>
          </div>
        )}
        {activeTab === "about" && (
          <div>
            <h3>About You</h3>
            <p>{formData.about || "No about information yet."}</p>
          </div>
        )}
        {activeTab === "friends" && (
          <div>
            <h3>Your Friends</h3>
            <p>No friends yet. Start connecting with others!</p>
          </div>
        )}
      </div>
      
      <div className="signup-actions">
        <button className="back-btn" onClick={handleBack}>
          Back to Form
        </button>
        <button className="create-account-btn" onClick={handleSubmit}>
          Create Account
        </button>
      </div>
    </div>
  );
}

export default SignupPage;