import React, { useState, useEffect } from "react";
import Header from "../Components/Header";
import Sidebar from "../Components/Sidebar";
import Feedf from "../Components/Feedf";
import Footer from "../Components/Footer";
import "../Styling/FeedS.css"; 
import Spotlight from "../Components/Spotlight";
import LikedPosts from "../Components/LikedPosts";
import MyPosts from "../Components/MyPosts";

function Feed() {
  const [activeTab, setActiveTab] = useState('spotlight');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Listen for mobile menu toggle from Header
  useEffect(() => {
    const handleMobileMenuToggle = () => {
      setSidebarOpen(prev => !prev);
    };

    // Add event listener for mobile menu toggle
    window.addEventListener('mobileMenuToggle', handleMobileMenuToggle);
    
    return () => {
      window.removeEventListener('mobileMenuToggle', handleMobileMenuToggle);
    };
  }, []);
  

  return (
    <div>
      <div className="feed-page">
        <Header />
        
        <div className="feed-layout">
          <Sidebar isOpen={sidebarOpen} />
          
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
              <button 
                className={`feed-tab ${activeTab === 'liked' ? 'active' : ''}`}
                onClick={() => setActiveTab('liked')}
              >
                <span role="img" aria-label="liked">❤️</span>
                Liked Posts
              </button>
              <button 
                className={`feed-tab ${activeTab === 'myPosts' ? 'active' : ''}`}
                onClick={() => setActiveTab('myPosts')}
              >
                <span role="img" aria-label="my posts">📝</span>
                My Posts
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
              
              {activeTab === 'liked' && (
                <div className="liked-posts-tab">
                  <LikedPosts />
                </div>
              )}
              
              {activeTab === 'myPosts' && (
                <div className="my-posts-tab">
                  <MyPosts />
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
