import React, { useState, useEffect } from "react";
import Notifications from "./Notifications";
import "./Header.css";
import api, { logout, getCurrentUser } from "../services/AuthService";

function Header() {
  const [displayNoti, setDisplayNoti] = useState(false);
  const [noti, setNoti] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const showNoti = () => setDisplayNoti((v) => !v);
  
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
          <a href={`/profile/${currentUser?.userName || ''}`} className="profile-link">Profile</a>
          <button className="logout-btn" onClick={handleLogout} aria-label="Logout">
            <span className="logout-icon">🚪</span>
            <span className="logout-label">Logout</span>
          </button>
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
