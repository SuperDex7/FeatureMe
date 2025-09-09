import React, { useState, useEffect, useRef } from "react";
import Notifications from "./Notifications";
import "./Header.css";
import api, { logout, getCurrentUser } from "../services/AuthService";

function Header() {
  const [displayNoti, setDisplayNoti] = useState(false);
  const [displayUserMenu, setDisplayUserMenu] = useState(false);
  const [noti, setNoti] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const userMenuRef = useRef(null);
  const showNoti = () => setDisplayNoti((v) => !v);
  const toggleUserMenu = () => setDisplayUserMenu((v) => !v);
  
  const handleLogout = async () => {
    await logout();
  };

  
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
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
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setDisplayUserMenu(false);
      }
    };
    
    if (displayUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [displayUserMenu]);
  
  return (
    <header className="main-header">
      <div className="header-inner">
        <div className="header-logo">
          <a href="/home" className="gradient-logo">
            <span className="gradient-logo-base">FeatureMe</span>
            <span className="gradient-logo-hover">FeatureMe</span>
          </a>
        </div>
        <nav className="header-nav">
          <a href="/feed" className="nav-link">Feed</a>
        </nav>
        <div className="header-actions">
          <button className="noti-btn" onClick={showNoti} aria-label="Show notifications">
            <span className="noti-icon">🔔</span>
            <span className="noti-label">Notifications</span>
          </button>
          
          <div className="user-menu-container" ref={userMenuRef}>
            <button className="user-menu-btn" onClick={toggleUserMenu} aria-label="User menu">
              <img 
                src={currentUser?.profilePic || '/default-avatar.png'} 
                alt={currentUser?.userName || 'User'} 
                className="user-avatar"
              />
              <span className="user-name">{currentUser?.userName || 'User'}</span>
              <span className={`dropdown-arrow ${displayUserMenu ? 'open' : ''}`}>▼</span>
            </button>
            
            {displayUserMenu && (
              <div className="user-dropdown">
                <a href={`/profile/${currentUser?.userName || ''}`} className="user-dropdown-item">
                  <span className="dropdown-icon">👤</span>
                  <span className="dropdown-label">View Profile</span>
                </a>
                <a href="/pending-features" className="user-dropdown-item">
                  <span className="dropdown-icon">⏳</span>
                  <span className="dropdown-label">Feature Requests</span>
                </a>
                <a href="/create-post" className="user-dropdown-item"  > 
                  <span className="dropdown-icon">✍️</span>
                  <span className="dropdown-label">
                    Create Post
                  </span>
                </a>
                <a href="/messages" className="user-dropdown-item">
                  <span className="dropdown-icon">💬</span>
                  <span className="dropdown-label">Messaging</span>
                </a>
                <a href="/subscription" className="user-dropdown-item">
                  <span className="dropdown-icon">⭐</span>
                  <span className="dropdown-label">{currentUser?.role === 'USER' ? 'Upgrade Plan' : 'Your Plan'}</span>
                </a>
                <div className="dropdown-divider"></div>
                <button className="user-dropdown-item logout-item" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  <span className="dropdown-label">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
        {displayNoti && (
          <div className="noti-dropdown">
            <div className="noti-dropdown-title">Notifications</div>
            {noti && Array.isArray(noti) && noti.length > 0 ? (
              <div>
                <Notifications notifications={noti} className="activity-modal-list"/>
                <button className="see-all-btn">See All</button>
              </div>
            ) : (
              "No Notifications Yet"
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
