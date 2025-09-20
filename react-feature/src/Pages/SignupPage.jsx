import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header2 from "../Components/Header2";
import Footer from "../Components/Footer";
import "../SignupComp/SignupPage.css";
import "../Styling/Profile.css";
import axios from 'axios';
import api from '../services/AuthService';
import { baseURL } from '../config/api';
import ValidationService from '../services/ValidationService';

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = email/password, 2 = verification, 3 = username, 4 = about, 5 = profile pics, 6 = preview
  const [activeTab, setActiveTab] = useState("demos");
  const [formData, setFormData] = useState({
    userName: "",
    password: "",
    confirmPassword: "",
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
  
  // Email verification state
  const [verificationCode, setVerificationCode] = useState("");
  const [encryptedCode, setEncryptedCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  
  // Password validation state
  const [passwordError, setPasswordError] = useState("");
  const PASSWORD_MIN = 6;
  const passwordCounterClass = (() => {
    const len = formData.password.length;
    if (len >= PASSWORD_MIN) return "";
    if (len >= Math.max(0, PASSWORD_MIN - 2)) return "password-counter--warn";
    return "password-counter--error";
  })();
  
  // File validation state
  const [profilePicError, setProfilePicError] = useState("");
  const [bannerError, setBannerError] = useState("");
  
  // Real-time validation state
  const [usernameValidation, setUsernameValidation] = useState({ 
    isValidating: false, 
    available: null, 
    error: null 
  });
  const [emailValidation, setEmailValidation] = useState({ 
    isValidating: false, 
    available: null, 
    error: null 
  });

  // Cleanup validation timeouts on unmount
  useEffect(() => {
    return () => {
      ValidationService.clearAllValidations();
    };
  }, []);

  // Check if step 1 form is valid
  const isStep1Valid = () => {
    return (
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      emailValidation.available === true &&
      !emailValidation.isValidating &&
      formData.password === formData.confirmPassword &&
      formData.password.length >= 6
    );
  };

  const handleInput = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Clear password error when user starts typing
    if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
      setPasswordError("");
    }
    
    // Real-time validation for username
    if (e.target.name === 'userName') {
      setUsernameValidation({ isValidating: true, available: null, error: null });
      ValidationService.checkUsernameAvailability(e.target.value, (result) => {
        setUsernameValidation({ 
          isValidating: false, 
          available: result.available, 
          error: result.error 
        });
      });
    }
    
    // Real-time validation for email
    if (e.target.name === 'email') {
      setEmailValidation({ isValidating: true, available: null, error: null });
      ValidationService.checkEmailAvailability(e.target.value, (result) => {
        setEmailValidation({ 
          isValidating: false, 
          available: result.available, 
          error: result.error 
        });
      });
    }
  };

  // File validation function
  const validateImageFile = (file) => {
    if (!file) return { isValid: true, error: "" };
    
    // Check file type - only JPEG, JPG, and PNG
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: "Please select a valid image file (JPEG, JPG, or PNG only)" 
      };
    }
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return { 
        isValid: false, 
        error: "File size must be less than 5MB" 
      };
    }
    
    return { isValid: true, error: "" };
  };

  // Decrypt verification code (simple Base64 decode)
  const decryptCode = (encryptedCode) => {
    try {
      return atob(encryptedCode);
    } catch (error) {
      console.error("Error decrypting code:", error);
      return null;
    }
  };

  // Handle verification code input
  const handleVerificationCodeChange = (e) => {
    setVerificationCode(e.target.value);
    setVerificationError("");
  };

  // Verify the entered code
  const handleVerifyCode = () => {
    if (!verificationCode.trim()) {
      setVerificationError("Please enter the verification code");
      return;
    }

    setIsVerifying(true);
    setVerificationError("");

    // Decrypt the stored encrypted code
    const decryptedCode = decryptCode(encryptedCode);
    
    if (decryptedCode && verificationCode.trim() === decryptedCode) {
      // Code matches, proceed to next step
      setStep(3); // Go to username step
    } else {
      setVerificationError("Invalid verification code. Please try again.");
    }
    
    setIsVerifying(false);
  };

  // Resend verification code
  const handleResendCode = async () => {
    // Ask for confirmation before resending
    const confirmed = window.confirm(
      "Are you sure you want to resend the verification code?\n\n" +
      "A new code will be sent to " + formData.email + " and any previous codes will become invalid.\n\n" +
      "Do you want to continue?"
    );
    
    if (!confirmed) {
      return; // User cancelled
    }
    
    try {
      setIsVerifying(true);
      setVerificationError("");
      
      const response = await axios.get(`${baseURL}/user/auth/email/${formData.email}`);
      setEncryptedCode(response.data);
      
      alert("Verification code sent! Check your email.");
    } catch (error) {
      console.error("Error resending code:", error);
      setVerificationError("Failed to resend code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate the file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        setProfilePicError(validation.error);
        // Clear the file input
        e.target.value = '';
        return;
      }
      
      // Clear any previous errors
      setProfilePicError("");
      
      const picUrl = URL.createObjectURL(file);
      setFormData({ ...formData, profilePic: picUrl });
      setProfilePicFile(file);
    } else {
      // Clear error when no file is selected
      setProfilePicError("");
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate the file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        setBannerError(validation.error);
        // Clear the file input
        e.target.value = '';
        return;
      }
      
      // Clear any previous errors
      setBannerError("");
      
      const bannerUrl = URL.createObjectURL(file);
      setFormData({ ...formData, banner: bannerUrl });
      setBannerFile(file);
    } else {
      // Clear error when no file is selected
      setBannerError("");
    }
  };



  const handleNext = async () => {
    if (step === 1) {
      // Early return if form is invalid (button should be disabled, but just in case)
      if (!isStep1Valid()) {
        return;
      }
      
      // Validate required fields
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        alert("Please fill in all required fields");
        return;
      }
      
      // Validate email availability
      if (emailValidation.available === false) {
        alert("Please choose a different email address");
        return;
      }
      
      // Wait for email validation to complete
      if (emailValidation.isValidating) {
        alert("Please wait while we check email availability");
        return;
      }
      
      // Validate password match
      if (formData.password !== formData.confirmPassword) {
        setPasswordError("Passwords do not match");
        return;
      }
      
      // Validate password strength (optional)
      if (formData.password.length < 6) {
        setPasswordError("Password must be at least 6 characters long");
        return;
      }
      
      // Send verification email and move to verification step
      try {
        const response = await axios.get(`${baseURL}/user/auth/email/${formData.email}`);
        console.log("Verification code sent:", response.data);
        setEncryptedCode(response.data);
        setStep(2); // Go to verification step
      } catch (error) {
        console.error("Error sending verification email:", error);
        alert("Failed to send verification email. Please try again.");
      }
      return;
    }
    
    if (step === 3) {
      // Validate username
      if (!formData.userName) {
        alert("Please enter a username");
        return;
      }
      
      // Validate username availability
      if (usernameValidation.available === false) {
        alert("Please choose a different username");
        return;
      }
      
      // Wait for username validation to complete
      if (usernameValidation.isValidating) {
        alert("Please wait while we check username availability");
        return;
      }
    }
    
    // For other steps, just move to next step
    if (step !== 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 6) {
      setStep(5); // Go back to last form step
    } else {
      setStep(step - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    
    // Create user data without confirmPassword
    const { confirmPassword, ...userData } = formData;
    
    const submitData = new FormData();
    submitData.append("user", new Blob([JSON.stringify(userData)], { type: "application/json" }));
    
    if (profilePicFile) {
      submitData.append("pp", profilePicFile);
    }
    if (bannerFile) {
      submitData.append("banner", bannerFile);
    }

    axios.post(`${baseURL}/user/auth/create`, submitData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    .then(res => {
      console.log(res);
      alert("Account created successfully! Redirecting to login...");
      // Redirect to login page after successful account creation
      navigate('/login');
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
                <div className="input-with-validation">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInput}
                    placeholder="Enter your email"
                    maxLength="100"
                    required
                    className={emailValidation.available === false ? 'error-input' : emailValidation.available === true ? 'success-input' : ''}
                  />
                  {emailValidation.isValidating && (
                    <div className="validation-indicator">
                      <span className="spinner">⏳</span> Checking...
                    </div>
                  )}
                  {emailValidation.available === true && !emailValidation.isValidating && (
                    <div className="validation-indicator success">
                      <span>✅</span> Available
                    </div>
                  )}
                  {emailValidation.available === false && !emailValidation.isValidating && (
                    <div className="validation-indicator error">
                      <span>❌</span> {emailValidation.error || 'Email is already taken'}
                    </div>
                  )}
                </div>
                <div className="char-counter">
                  {formData.email.length}/100 characters
                </div>
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
                  maxLength="50"
                  className={passwordError ? "error-input" : ""}
                  required
                />
                <div className={`char-counter password-counter ${passwordCounterClass}`}>
                  {formData.password.length}/50 characters
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInput}
                  placeholder="Confirm your password"
                  maxLength="50"
                  className={passwordError ? "error-input" : ""}
                  required
                />
                {passwordError && (
                  <div className="error-message">{passwordError}</div>
                )}
              </div>

              <button 
                type="button" 
                className={`next-btn ${!isStep1Valid() ? 'disabled' : ''}`}
                onClick={handleNext}
                disabled={!isStep1Valid()}
              >
                Next: Choose Username
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Email Verification
  if (step === 2) {
    return (
      <div className="signup-page">
        <Header2 />
        <div className="signup-container">
          <div className="signup-form-card">
            <div className="step-indicator">
              <span className="step-number">2</span>
              <span className="step-title">Verify Email</span>
            </div>
            <h2>Check Your Email</h2>
            <p>We've sent a verification code to <strong>{formData.email}</strong></p>
            
            <div className="verification-info">
              <div className="info-icon">📧</div>
              <div className="info-text">
                <strong>Didn't receive the email?</strong> Check your spam folder or click "Resend Code" below.
              </div>
            </div>
            
            <form className="signup-form">
              <div className="form-group">
                <label htmlFor="verificationCode">Verification Code *</label>
                <input
                  type="text"
                  id="verificationCode"
                  name="verificationCode"
                  value={verificationCode}
                  onChange={handleVerificationCodeChange}
                  placeholder="Enter the 8-digit code"
                  maxLength="8"
                  className={verificationError ? "error-input" : ""}
                  required
                />
                {verificationError && (
                  <div className="error-message">{verificationError}</div>
                )}
              </div>

              <div className="verification-actions">
                <button 
                  type="button" 
                  className="resend-btn" 
                  onClick={handleResendCode}
                  disabled={isVerifying}
                >
                  {isVerifying ? "Sending..." : "Resend Code"}
                </button>
              </div>

              <div className="form-actions">
                <button type="button" className="back-btn" onClick={handleBack}>
                  Back
                </button>
                <button 
                  type="button" 
                  className="next-btn" 
                  onClick={handleVerifyCode}
                  disabled={isVerifying || !verificationCode.trim()}
                >
                  {isVerifying ? "Verifying..." : "Verify & Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Username
  if (step === 3) {
    return (
      <div className="signup-page">
        <Header2 />
        <div className="signup-container">
          <div className="signup-form-card">
            <div className="step-indicator">
              <span className="step-number">3</span>
              <span className="step-title">Choose Username</span>
            </div>
            <h2>Pick Your Username</h2>
            <p>This is how others will see you on the platform</p>
            
            <div className="username-warning">
              <div className="warning-icon">⚠️</div>
              <div className="warning-text">
                <strong>Important:</strong> Your username cannot be changed after account creation until further notice. Choose carefully!
              </div>
            </div>
            
            <form className="signup-form">
              <div className="form-group">
                <label htmlFor="userName">Username *</label>
                <div className="input-with-validation">
                  <input
                    type="text"
                    id="userName"
                    name="userName"
                    value={formData.userName}
                    onChange={handleInput}
                    placeholder="Enter your username"
                    maxLength="30"
                    required
                    className={usernameValidation.available === false ? 'error-input' : usernameValidation.available === true ? 'success-input' : ''}
                  />
                  {usernameValidation.isValidating && (
                    <div className="validation-indicator">
                      <span className="spinner">⏳</span> Checking...
                    </div>
                  )}
                  {usernameValidation.available === true && !usernameValidation.isValidating && (
                    <div className="validation-indicator success">
                      <span>✅</span> Available
                    </div>
                  )}
                  {usernameValidation.available === false && !usernameValidation.isValidating && (
                    <div className="validation-indicator error">
                      <span>❌</span> {usernameValidation.error || 'Username is already taken'}
                    </div>
                  )}
                </div>
                <div className="char-counter">
                  {formData.userName.length}/30 characters
                </div>
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

  // Step 4: Bio and About
  if (step === 4) {
    return (
      <div className="signup-page">
        <Header2 />
        <div className="signup-container">
          <div className="signup-form-card">
            <div className="step-indicator">
              <span className="step-number">4</span>
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
                  maxLength="50"
                />
                <div className="char-counter">
                  {formData.bio.length}/50 characters
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInput}
                  placeholder="City, State?"
                  maxLength="20"
                />
                <div className="char-counter">
                  {formData.location.length}/50 characters
                </div>
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
                  maxLength="250"
                />
                <div className="char-counter">
                  {formData.about.length}/250 characters
                </div>
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

  // Step 5: Profile Pictures
  if (step === 5) {
    return (
      <div className="signup-page">
        <Header2 />
        <div className="signup-container">
          <div className="signup-form-card">
            <div className="step-indicator">
              <span className="step-number">5</span>
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
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleProfilePicChange}
                  className={profilePicError ? "error-input" : ""}
                />
                {profilePicError && (
                  <div className="error-message">{profilePicError}</div>
                )}
                <div className="file-info">
                  <small>Accepted formats: JPEG, JPG, PNG (max 5MB)</small>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="banner">Banner Image</label>
                <input
                  type="file"
                  id="banner"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleBannerChange}
                  className={bannerError ? "error-input" : ""}
                />
                {bannerError && (
                  <div className="error-message">{bannerError}</div>
                )}
                <div className="file-info">
                  <small>Accepted formats: JPEG, JPG, PNG (max 5MB)</small>
                </div>
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

  // Step 6: Profile Preview
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
        <h2 className="cprofile-glass-username">{formData.userName}</h2>
        
        <p className="profile-glass-bio">{formData.bio || "No bio yet"}</p>
        <p className="profile-glass-location">{formData.location || "Location not set"}</p>
        {/* About Section - Moved to top */}
        {formData.about && (
          <div className="profile-glass-about-section">
            <div className="about-preview">
              <h4 className="about-title">📋 About</h4>
              <p className="about-text">
                {formData.about && formData.about.length > 150 ? `${formData.about.substring(0, 150)}...` : formData.about || 'No about information available'}
              </p>
              {formData.about && formData.about.length > 150 && (
                <button 
                  className="read-more-btn"
                  onClick={() => alert('Full about: ' + formData.about)}
                >
                  Read More →
                </button>
              )}
            </div>
          </div>
        )}

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
          className={`profile-glass-tab${activeTab === "demos" ? " active" : ""}`} 
          onClick={() => setActiveTab("demos")}
        >
          Demos
        </button>
        <button 
          className={`profile-glass-tab${activeTab === "friends" ? " active" : ""}`} 
          onClick={() => setActiveTab("friends")}
        >
          Features
        </button>
      </div>
      
      <div className="profile-glass-content">
        {activeTab === "posts" && (
          <div>
            <h3>Your Recent Posts</h3>
            <p>No posts yet. Start sharing your content!</p>
          </div>
        )}
        {activeTab === "demos" && (
          <div>
            <h3>Your Demos</h3>
            <p>No demos yet. Start showcasing your work!</p>
          </div>
        )}
        {activeTab === "friends" && (
          <div>
            <h3>Featured On</h3>
            <p>No features yet. Collaborate with others to get featured!</p>
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
      <Footer />
    </div>
  );
}

export default SignupPage;