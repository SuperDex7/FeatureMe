import React, { useState } from "react";
import Header from "../Components/Header";
import Sidebar from "../Components/Sidebar";
import Feedf from "../Components/Feedf";
import Footer from "../Components/Footer";
import "../Styling/FeedS.css"; 
import Spotlight from "../Components/Spotlight";

function Feed() {
  const [activeTab, setActiveTab] = useState('spotlight');
  

  return (
    <div>
      <div className="feed-page">
        <Header />
        
        <div className="feed-layout">
          <Sidebar />
          
          <div className="feed-main-content">
            {/* Tab Navigation */}
            <div className="feed-tabs">
              <button 
                className={`feed-tab ${activeTab === 'spotlight' ? 'active' : ''}`}
                onClick={() => setActiveTab('spotlight')}
              >
                <span role="img" aria-label="spotlight">⭐</span>
                Spotlight
              </button>
              <button 
                className={`feed-tab ${activeTab === 'feed' ? 'active' : ''}`}
                onClick={() => setActiveTab('feed')}
              >
                <span role="img" aria-label="feed">📰</span>
                Feed
              </button>
            </div>

            {/* Tab Content */}
            <div className="feed-tab-content">
              {activeTab === 'spotlight' && (
                <div className="spotlight-tab">
                  <Spotlight />
                </div>
              )}
              
              {activeTab === 'feed' && (
                <div className="feed-tab">
                  <Feedf />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Feed;
