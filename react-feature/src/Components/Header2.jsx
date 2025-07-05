import React from 'react';
import './Header.css';
function Header2(){

    return (
       <header className="main-header">
      <div className="header-inner">
        <div className="header-logo">
          <a href="/home" className="gradient-logo">FeatureMe</a>
        </div>
        <nav className="header-nav">
          
        </nav>
        <div className="header-actions">
          <button className="noti-btn"  aria-label="Show notifications">
            
            <a href='/login' className="noti-label">Log In</a>
          </button>
          <a href="/signup" className="profile-link">Signup</a>
        </div>
        
      </div>
    </header>
      );
    }
    
    export default Header2;
    
