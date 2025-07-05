import React from "react";
import "./Footer.css";

function Footer() {
  return (
    <div className="footer">
        <div><strong>FeatureMe</strong> &mdash; Hub for Musicians.</div>
        <div style={{marginTop: '0.7rem', fontSize: '1rem'}}>
          About &nbsp;|&nbsp; Features &nbsp;|&nbsp; Pricing &nbsp;|&nbsp; Blog &nbsp;|&nbsp; Twitter &nbsp;|&nbsp; Facebook &nbsp;|&nbsp; Instagram
        </div>
        <div style={{marginTop: '1.2rem', fontSize: '0.95rem', color: '#888'}}>© 2025 FeatureMe. All rights reserved.</div>
      </div>
    
  );
}

export default Footer;
