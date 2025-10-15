import React, { useState } from 'react';
import './Header2.css';

function Header2() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="header2">
      <div className="header2-container">
        {/* Logo Section */}
        <div className="header2-logo">
          <a href="/" className="header2-logo-link">
            <img 
              src="/SVGs/Logo Lockup Gradient.svg" 
              alt="FeatureMe Logo" 
              className="header2-logo-icon"
            />
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="header2-mobile-toggle" 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span className={`header2-hamburger ${isMenuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* Navigation */}
        <nav className={`header2-nav ${isMenuOpen ? 'active' : ''}`}>
          {/* TODO: Add navigation links when pages are ready */}
          {/* <a href="/#features" className="header2-nav-link">
            <span className="header2-nav-text">Features</span>
          </a>
          <a href="/#about" className="header2-nav-link">
            <span className="header2-nav-text">About</span>
          </a>
          <a href="/#pricing" className="header2-nav-link">
            <span className="header2-nav-text">Pricing</span>
          </a> */}
        </nav>

        {/* Auth Actions */}
        <div className="header2-actions">
          <a href="/login" className="header2-login-btn">
            <span className="header2-login-text">Log In</span>
          </a>
          <a href="/signup" className="header2-signup-btn">
            <span className="header2-signup-text">Get Started</span>
          </a>
        </div>
      </div>
    </header>
  );
}

export default Header2;
    
