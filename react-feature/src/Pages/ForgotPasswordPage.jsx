import React, { useState } from 'react';
import '../Styling/ForgotPasswordPage.css';
import Header2 from "../Components/Header2";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { baseURL } from '../config/api';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = email, 2 = code verification, 3 = new password
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

  const handleSendCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await axios.post(`${baseURL}/user/auth/forgot-password`, {
        email: formData.email
      });

      if (response.status === 200) {
        setSuccessMessage('Password reset code sent to your email!');
        setStep(2);
      }
    } catch (error) {
      console.error('Error sending reset code:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage('Failed to send reset code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post(`${baseURL}/user/auth/verify-reset-code`, {
        email: formData.email,
        code: formData.code
      });

      if (response.status === 200) {
        setSuccessMessage('Code verified successfully!');
        setStep(3);
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage('Invalid or expired code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (formData.newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${baseURL}/user/auth/reset-password`, {
        email: formData.email,
        code: formData.code,
        newPassword: formData.newPassword
      });

      if (response.status === 200) {
        setSuccessMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage('Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (window.confirm('Are you sure you want to resend the verification code? This will invalidate any previous codes.')) {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await axios.post(`${baseURL}/user/auth/forgot-password`, {
          email: formData.email
        });

        if (response.status === 200) {
          setSuccessMessage('New verification code sent to your email!');
        }
      } catch (error) {
        console.error('Error resending code:', error);
        if (error.response && error.response.data && error.response.data.error) {
          setErrorMessage(error.response.data.error);
        } else {
          setErrorMessage('Failed to resend code. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="forgot-password-page">
      <Header2 />
      <div className="forgot-password-container">
        <div className="forgot-password-form-card">
          <div className="forgot-password-header">
            <h1 className="forgot-password-title">Reset Password</h1>
            <p className="forgot-password-subtitle">
              {step === 1 && "Enter your email address to receive a reset code"}
              {step === 2 && "Enter the verification code sent to your email"}
              {step === 3 && "Enter your new password"}
            </p>
          </div>

          {errorMessage && (
            <div className="error-message">
              <span>⚠️</span> {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="success-message">
              <span>✅</span> {successMessage}
            </div>
          )}

          {/* Step 1: Email Input */}
          {step === 1 && (
            <form className="forgot-password-form" onSubmit={handleSendCode}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-container">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="forgot-password-input"
                    placeholder="Enter your email address"
                    required
                  />
                  <div className="input-icon">📧</div>
                </div>
              </div>

              <button
                type="submit"
                className="forgot-password-btn"
                disabled={isLoading || !formData.email}
              >
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </button>

              <div className="forgot-password-footer">
                <p>Remember your password? <a href="/login" className="login-link">Sign in</a></p>
              </div>
            </form>
          )}

          {/* Step 2: Code Verification */}
          {step === 2 && (
            <form className="forgot-password-form" onSubmit={handleVerifyCode}>
              <div className="form-group">
                <label htmlFor="code">Verification Code</label>
                <div className="input-container">
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="forgot-password-input"
                    placeholder="Enter 8-digit code"
                    maxLength="8"
                    required
                  />
                  <div className="input-icon">🔐</div>
                </div>
                <p className="code-help-text">
                  Check your email for the verification code. It expires in 15 minutes.
                </p>
              </div>

              <button
                type="submit"
                className="forgot-password-btn"
                disabled={isLoading || !formData.code}
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>

              <div className="forgot-password-footer">
                <button
                  type="button"
                  className="resend-btn"
                  onClick={handleResendCode}
                  disabled={isLoading}
                >
                  Resend Code
                </button>
                <p>Didn't receive the email? Check your spam folder.</p>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form className="forgot-password-form" onSubmit={handleResetPassword}>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="input-container">
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="forgot-password-input"
                    placeholder="Enter new password"
                    required
                  />
                  <div className="input-icon">🔒</div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="input-container">
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="forgot-password-input"
                    placeholder="Confirm new password"
                    required
                  />
                  <div className="input-icon">🔒</div>
                </div>
              </div>

              <button
                type="submit"
                className="forgot-password-btn"
                disabled={isLoading || !formData.newPassword || !formData.confirmPassword}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>

              <div className="forgot-password-footer">
                <p>Password must be at least 6 characters long.</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
