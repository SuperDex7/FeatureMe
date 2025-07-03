import React, { useState } from "react";
import Notifications from "./Notifications";
import "./Header.css";

function Header() {
  const [displayNoti, setDisplayNoti] = useState(false);
  const showNoti = () => setDisplayNoti((v) => !v);

  return (
    <header className="main-header">
      <div className="header-inner">
        <div className="header-logo">
          <a href="/home" className="gradient-logo">FeatureMe</a>
        </div>
        <nav className="header-nav">
          <a href="/feed" className="nav-link">Feed</a>
        </nav>
        <div className="header-actions">
          <button className="noti-btn" onClick={showNoti} aria-label="Show notifications">
            <span className="noti-icon">🔔</span>
            <span className="noti-label">Notifications</span>
          </button>
          <a href="/profile" className="profile-link">Profile</a>
        </div>
        {displayNoti && (
          <div className="noti-dropdown">
            <div className="noti-dropdown-title">Notifications</div>
            <Notifications />
            <button className="see-all-btn">See All</button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
