import { useState } from 'react';
import ProgressBar from '../HomepageF/ProgressBar';
import Header from '../Components/Header';
import Notifications from '../Components/Notifications';
import Footer from '../Components/Footer';
import "../App.css"
import Spotlight from '../Components/Spotlight';
import ProfileTabs from '../ProfileComp/ProfileTabs';

function Homepage() {
  const [progress, setProgress] = useState(40);
  const [progCheck, setProgCheck] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [tabTransition, setTabTransition] = useState(false);

  const simulateProgress = () => {
    setProgress((prev) => Math.min(prev + 20, 100));
    if (progress >= 80) setProgCheck(false);
  };

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setTabTransition(true);
      setTimeout(() => {
        setActiveTab(tab);
        setTabTransition(false);
      }, 250); // match CSS transition duration
    }
  };

  return (
    <div id="home-body">
      <Header />
      <div className="tabbed-profile-card">
        <div className="tabbed-profile-tabs">
          <button
            className={`tab ${activeTab === "profile" ? "tab-active" : ""}`}
            onClick={() => handleTabChange("profile")}
          >
            Profile
          </button>
          <button
            className={`tab ${activeTab === "upload" ? "tab-active" : ""}`}
            onClick={() => handleTabChange("upload")}
          >
            Upload
          </button>
        </div>
        <div className={`tabbed-profile-content${tabTransition ? " tab-transition" : ""}`}
          style={{ minHeight: 340, maxWidth: 700, width: '100%', position: 'relative' }}>
          {activeTab === 'profile' && !tabTransition && (
            <div className="profile-tab-panel">
              <button className="profile-edit-btn">Edit Profile</button>
              <img className="profile-avatar" src="dpp.jpg" alt="Profile" />
              <div className="profile-info">
                <div className="profile-name">SuperDex</div>
                <div className="profile-stats">
                  <span className="profile-stat">Followers: 0</span>
                  <span className="profile-stat">Following: 0</span>
                </div>
              </div>
              <div className="profile-progress">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{fontWeight: 500}}>Profile Completion</span>
                  <span style={{fontSize: '0.95rem', color: '#bfc9d1'}}>{progress}%</span>
                </div>
                <ProgressBar value={progress} max={100} />
                {progCheck && (
                  <button className="increase-progress-btn" onClick={simulateProgress}>Increase Progress</button>
                )}
              </div>
            </div>
          )}
          {activeTab === 'upload' && !tabTransition && (
            <div className="upload-tab-panel">
              <div className="upload-title">Upload</div>
              <div className="upload-buttons">
                <button className="upload-btn">Song</button>
                <button className="upload-btn">Beat</button>
                <button className="upload-btn">Loop</button>
                <button className="upload-btn">Instrument</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="widgets-grid">
        <div className="widget-card">
          <div className="widget-title">Recent Activity</div>
          <Notifications />
        </div>
        <div className="widget-card">
          <div className="widget-title">Latest Post</div>
          {/* Add latest post content here */}
        </div>
        <div className="widget-card">
          <div className="widget-title">Spotlight</div>
          <Spotlight />
        </div>
      </div>
      <div className="footer">
        <div><strong>FeatureMe</strong> &mdash; Hub for Musicians.</div>
        <div style={{marginTop: '0.7rem', fontSize: '1rem'}}>
          About &nbsp;|&nbsp; Features &nbsp;|&nbsp; Pricing &nbsp;|&nbsp; Blog &nbsp;|&nbsp; Twitter &nbsp;|&nbsp; Facebook &nbsp;|&nbsp; Instagram
        </div>
        <div style={{marginTop: '1.2rem', fontSize: '0.95rem', color: '#888'}}>© 2025 FeatureMe. All rights reserved.</div>
      </div>
    </div>
  );
}

export default Homepage;