import React from "react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        
        
        <div className="footer__brand">
          <h2>FeatureMe</h2>
          <p>Hub for Musicians.</p>
        </div>

        {/* Quick Links */}
        <div className="footer__links">
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="/features">Features</a></li>
            <li><a href="/pricing">Pricing</a></li>
            <li><a href="/blog">Blog</a></li>
            <li>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Twitter
              </a>
            </li>
            <li>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Facebook
              </a>
            </li>
            <li>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>

 
      <div className="footer__bottom">
        <p>&copy; {new Date().getFullYear()} FeatureMe. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
