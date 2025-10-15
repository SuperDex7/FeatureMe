import React from "react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo-container">
              <img 
                src="/SVGs/Logo Gradient.svg" 
                alt="FeatureMe Logo" 
                className="footer-logo-symbol"
              />
              <h3 className="footer-logo">FeatureMe</h3>
            </div>
            <p className="footer-tagline">The ultimate platform for musicians to share, discover, and connect through music.</p>
            <h6 className="footer-copyright">Logos and Art: <a href="https://www.instagram.com/janeymitch2/" target="_blank"> janeymitch2</a> on Instagram</h6>
          </div>
          
          <div className="footer-links">
            <div className="footer-column">
              <h4 className="footer-column-title">Platform</h4>
              <ul className="footer-link-list">
                <li><a href="/feed" className="footer-link">Feed</a></li>
                <li><a href="/user-search" className="footer-link">Discover Users</a></li>
                <li><a href="/create-post" className="footer-link">Create Post</a></li>
                <li><a href="/messages" className="footer-link">Messages</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-column-title">Features</h4>
              <ul className="footer-link-list">
                <li><a href="/subscription" className="footer-link">Premium Plans</a></li>
                <li><a href="/pending-features" className="footer-link">Feature Requests</a></li>
                <li><span className="footer-link">Music Demos</span></li>
                <li><span className="footer-link">Analytics</span></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-column-title">Support</h4>
              <ul className="footer-link-list">
                <li><span className="footer-link">Help Center</span></li>
                <li><span className="footer-link">Community Guidelines</span></li>
                <li><span className="footer-link">Contact Us</span></li>
                <li><span className="footer-link">Report Issue</span></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-social">
            <a href="#" className="footer-social-link" aria-label="Twitter">
              <span className="footer-social-icon">🐦</span>
            </a>
            <a href="https://www.instagram.com/therealfeatureme/?utm_source=ig_web_button_share_sheet" target="_blank" className="footer-social-link" aria-label="Instagram">
              <span className="footer-social-icon">📷</span>
            </a>
            <a href="https://www.tiktok.com/@therealfeatureme" className="footer-social-link" target="_blank" aria-label="TikTok">
              <span className="footer-social-icon">📱</span>
            </a>
            <a href="https://youtube.com/@therealfeatureme?si=46iHSZOLEREThHzJ" className="footer-social-link" target="_blank" aria-label="YouTube">
              <span className="footer-social-icon">📺</span>
            </a>
          </div>
          <div className="footer-copyright">
            <p>© 2025 FeatureMe. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
