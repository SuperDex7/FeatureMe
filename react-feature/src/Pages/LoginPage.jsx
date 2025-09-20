import React, { useState } from 'react';
import '../Styling/LoginPage.css';
import Header2 from "../Components/Header2"
import { useNavigate, useLocation } from 'react-router-dom';
import { redirect, redirectDocument } from 'react-router-dom';
import api from '../services/AuthService';
import axios from 'axios';
import { baseURL } from '../config/api';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Get the page user was trying to access before being redirected to login
  const from = location.state?.from?.pathname || '/home';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage('');
    }
  };
 // const loginGithub = () =>{
  
  // window.location.href = "http://localhost:8080/login/oauth2/code/github"
  
 // }
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(''); // Clear any previous error messages
    
    try {
      // Create base64 encoded credentials for basic auth
      const credentials = btoa(`${formData.email}:${formData.password}`);
      
      const response = await axios.post(`${baseURL}/user/auth/login`, {
        username: formData.email,
        password: formData.password
      }, {
        withCredentials: true // Enable cookies
      });
      
      if (response.status === 200) {
        const data = response.data;
        
        // Redirect to the page user was trying to access, or home if none
        navigate(from, { replace: true });
      } else if (response.status === 401) {
        setErrorMessage('Invalid email/username or password. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Extract error message from response
      if (error.response) {
        // Server responded with error status
        const errorData = error.response.data;
        
        // Display the response data if available
        if (errorData && typeof errorData === 'string') {
          setErrorMessage(errorData);
        } else if (errorData && errorData.message) {
          setErrorMessage(errorData.message);
        } else if (errorData && errorData.error) {
          setErrorMessage(errorData.error);
        } else if (error.response.status === 401) {
          setErrorMessage('Invalid email/username or password. Please try again.');
        } else if (error.response.status === 403) {
          setErrorMessage('Account is disabled or access denied.');
        } else if (error.response.status === 404) {
          setErrorMessage('User not found. Please check your credentials.');
        } else {
          setErrorMessage(`Login failed: ${error.response.status} ${error.response.statusText}`);
        }
      } else if (error.request) {
        // Network error
        setErrorMessage('Network error. Please check your connection and try again.');
      } else {
        // Other error
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Header2 />
      <div className="login-container">
        <div className="login-form-card">
          <div className="login-header">
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to continue your music journey</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email or Username</label>
              <div className="input-container">
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="login-input"
                  placeholder="Enter your email or username"
                  required
                />
                <div className="input-icon">📧</div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="login-input"
                  placeholder="Enter your password"
                  required
                />
                <div className="input-icon">🔒</div>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
              <a href="#" className="forgot-password" onClick={(e) => e.preventDefault()}>Forgot Password?</a>
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <div className="error-message-container">
                <div className="error-icon">⚠️</div>
                <div className="error-text">{errorMessage}</div>
              </div>
            )}

            <button 
              type="submit" 
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="signup-link">
              Don't have an account? <a href="/signup">Sign up</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage; 