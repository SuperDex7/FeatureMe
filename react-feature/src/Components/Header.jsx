import React, { useState, useEffect } from "react";
import Notifications from "./Notifications";
import "./Header.css";
import api from "../services/AuthService";
import { logout } from "../services/AuthService";

function Header() {
  const [displayNoti, setDisplayNoti] = useState(false);
  const [noti, setNoti] = useState(null)
  const showNoti = () => setDisplayNoti((v) => !v);
  const userString = localStorage.getItem('user');
  const userrr = JSON.parse(userString);
  
  const handleLogout = () => {
    logout();
  };
  useEffect(()=>{
    api.get(`user/get/notifications/${userrr.username}`).then(res =>{
      setNoti(res.data)
      //console.log(res)
    })
  },[])
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
          <a href={`/profile/${userrr.username}`} className="profile-link">Profile</a>
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
