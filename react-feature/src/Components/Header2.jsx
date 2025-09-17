import React from 'react';
import './Header.css';
function Header2(){

    return (
       <header className="main-header">
      <div className="header-inner">
        <div className="header-logo">
          <a href="/" className="gradient-logo">FeatureMe</a>
        </div>
        <nav className="header-nav">
          
        </nav>
        <div className="header-actions">
          <button className="noti-btn">
            
            <a href='/login' className="login-text">Log In</a>
          </button>
          <a href="/signup" className="profile-link">Signup</a>
        </div>
        
      </div>
    </header>
      );
    }
    
    export default Header2;
    
