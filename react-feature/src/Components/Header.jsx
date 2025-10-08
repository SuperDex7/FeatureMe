import React, { useState, useEffect, useRef } from "react";
import Notifications from "./Notifications";
import "./Header.css";
import api, { logout, getCurrentUserSafe } from "../services/AuthService";
import { clearMyNotifications } from "../services/UserService";

function Header() {
  const [displayNoti, setDisplayNoti] = useState(false);
  const [displayUserMenu, setDisplayUserMenu] = useState(false);
  const [displayMobileMenu, setDisplayMobileMenu] = useState(false);
  const [noti, setNoti] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const notiRef = useRef(null);

  const showNoti = () => setDisplayNoti((v) => !v);
  const toggleUserMenu = () => setDisplayUserMenu((v) => !v);
  const toggleMobileMenu = () => {
    setDisplayMobileMenu((v) => !v);
    window.dispatchEvent(new CustomEvent('mobileMenuToggle'));
  };
  
  const handleLogout = async () => {
    await logout();
  };

  const handleClearNotifications = async () => {
    try {
      await clearMyNotifications();
      setNoti([]);
    } catch (e) {
      console.error("Failed to clear notifications", e);
    }
  };


  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUserSafe();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);
  
  useEffect(() => {
    if (currentUser && currentUser.userName) {
      api.get(`user/get/notifications/${currentUser.userName}`).then(res => {
        setNoti(res.data);
      }).catch(err => {
        console.error('Error fetching notifications:', err);
      });
    }
  }, [currentUser]);
  
  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setDisplayUserMenu(false);
      }
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setDisplayNoti(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setDisplayMobileMenu(false);
      }
    };
    
    if (displayUserMenu || displayMobileMenu || displayNoti) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [displayUserMenu, displayMobileMenu, displayNoti]);

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo Section */}
        <div className="header-logo">
          <a href="/home" className="header-logo-link">
            <div className="header-logo-icon">🎵</div>
            <span className="header-logo-text">FeatureMe</span>
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="header-mobile-toggle" 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span className={`header-hamburger ${displayMobileMenu ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* Navigation */}
        <nav className={`header-nav ${displayMobileMenu ? 'active' : ''}`}>
          <a href="/feed" className="header-nav-link" onClick={() => setDisplayMobileMenu(false)}>
            <span className="header-nav-icon">📱</span>
            <span className="header-nav-text">Feed</span>
          </a>
          <a href="/user-search" className="header-nav-link" onClick={() => setDisplayMobileMenu(false)}>
            <span className="header-nav-icon">🔍</span>
            <span className="header-nav-text">Search</span>
          </a>
          <a href="/create-post" className="header-nav-link header-nav-cta" onClick={() => setDisplayMobileMenu(false)}>
            <span className="header-nav-icon">➕</span>
            <span className="header-nav-text">Create</span>
          </a>
        </nav>

        {/* Actions Section */}
        <div className="header-actions">

          {/* Notifications */}
          <div className="header-notifications" ref={notiRef}>
            <button 
              className="header-action-btn header-noti-btn" 
              onClick={showNoti}
              aria-label="Notifications"
            >
              <span className="header-action-icon">🔔</span>
              {noti && Array.isArray(noti) && noti.length > 0 && (
                <span className="header-noti-badge">{noti.length}</span>
              )}
            </button>
            
            {displayNoti && (
              <div className="header-noti-dropdown">
                <div className="header-noti-header">
                  <h3 className="header-noti-title">Notifications</h3>
                  {noti && Array.isArray(noti) && noti.length > 0 && (
                    <button className="header-noti-clear" onClick={handleClearNotifications}>
                      Clear All
                    </button>
                  )}
                </div>
                <div className="header-noti-content">
                  {noti && Array.isArray(noti) && noti.length > 0 ? (
                    <Notifications notifications={noti} className="header-noti-list"/>
                  ) : (
                    <div className="header-noti-empty">
                      <span className="header-noti-empty-icon">🔔</span>
                      <p className="header-noti-empty-text">No notifications yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="header-user-menu" ref={userMenuRef}>
            <button 
              className="header-user-btn" 
              onClick={toggleUserMenu}
              aria-label="User menu"
            >
              <img 
                src={currentUser?.profilePic || '/dpp.jpg'} 
                alt={currentUser?.userName || 'User'} 
                className="header-user-avatar"
              />
              <span className="header-user-name">{currentUser?.userName || 'User'}</span>
              <span className={`header-user-arrow ${displayUserMenu ? 'active' : ''}`}>▼</span>
            </button>
            
            {displayUserMenu && (
              <div className="header-user-dropdown">
                <div className="header-user-info">
                  <img 
                    src={currentUser?.profilePic || '/dpp.jpg'} 
                    alt={currentUser?.userName || 'User'} 
                    className="header-dropdown-avatar"
                  />
                  <div className="header-dropdown-info">
                    <span className="header-dropdown-name">{currentUser?.userName || 'User'}</span>
                    <span className="header-dropdown-role">{currentUser?.role || 'USER'}</span>
                  </div>
                </div>
                
                <div className="header-dropdown-divider"></div>
                
                <div className="header-dropdown-menu">
                  <a 
                    href={`/profile/${currentUser?.userName || ''}`} 
                    className="header-dropdown-item" 
                    onClick={() => setDisplayUserMenu(false)}
                  >
                    <span className="header-dropdown-icon">👤</span>
                    <span className="header-dropdown-label">View Profile</span>
                  </a>
                  
                  <a 
                    href="/pending-features" 
                    className="header-dropdown-item" 
                    onClick={() => setDisplayUserMenu(false)}
                  >
                    <span className="header-dropdown-icon">⏳</span>
                    <span className="header-dropdown-label">Feature Requests</span>
                  </a>
                  
                  <a 
                    href="/create-post" 
                    className="header-dropdown-item" 
                    onClick={() => setDisplayUserMenu(false)}
                  > 
                    <span className="header-dropdown-icon">✍️</span>
                    <span className="header-dropdown-label">Create Post</span>
                  </a>
                  
                  <a 
                    href="/messages" 
                    className="header-dropdown-item" 
                    onClick={() => setDisplayUserMenu(false)}
                  >
                    <span className="header-dropdown-icon">💬</span>
                    <span className="header-dropdown-label">Messaging</span>
                  </a>
                  
                  <a 
                    href="/subscription" 
                    className="header-dropdown-item" 
                    onClick={() => setDisplayUserMenu(false)}
                  >
                    <span className="header-dropdown-icon">⭐</span>
                    <span className="header-dropdown-label">
                      {currentUser?.role === 'USER' ? 'Upgrade Plan' : 'Your Plan'}
                    </span>
                  </a>
                </div>
                
                <div className="header-dropdown-divider"></div>
                
                <button 
                  className="header-dropdown-item header-dropdown-logout" 
                  onClick={handleLogout}
                >
                  <span className="header-dropdown-icon">🚪</span>
                  <span className="header-dropdown-label">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
