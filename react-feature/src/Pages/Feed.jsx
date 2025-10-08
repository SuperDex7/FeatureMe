import React, { useState, useEffect } from "react";
import Header3 from "../Components/Header";
import Feed2 from "../Components/Feed2";
import Footer from "../Components/Footer";
import "../Styling/Feeds2.css"; 
import Spotlight2 from "../Components/Spotlight";
import LikedPosts from "../Components/LikedPosts";
import MyPosts from "../Components/MyPosts";

function Feed() {
  const [activeTab, setActiveTab] = useState('spotlight');
  
  const navigationItems = [
    { 
      id: 'spotlight', 
      label: 'Spotlight', 
      icon: '⭐',
      title: 'Plus Creator Spotlight',
      subtitle: 'The Best of the Best'
    },
    { 
      id: 'feed', 
      label: 'Feed', 
      icon: '📰',
      title: 'Discover Amazing Music',
      subtitle: 'Find your next favorite track from talented creators worldwide'
    },
    { 
      id: 'liked', 
      label: 'Liked Posts', 
      icon: '❤️',
      title: 'Your Favorites',
      subtitle: 'Rediscover the tracks that captured your heart'
    },
    { 
      id: 'myPosts', 
      label: 'My Posts', 
      icon: '📝',
      title: 'Your Creations',
      subtitle: 'Showcase your musical journey and connect with your audience'
    }
  ];

  const currentNavItem = navigationItems.find(item => item.id === activeTab) || navigationItems[0];

  const renderContent = () => {
    switch(activeTab) {
      case 'spotlight':
        return <Spotlight2 />;
      case 'feed':
        return <Feed2 />;
      case 'liked':
        return <LikedPosts />;
      case 'myPosts':
        return <MyPosts />;
      default:
        return <Spotlight />;
    }
  };

  return (
    <div>
      <div className="feed-page">
        <Header3 />
        
        <main className="posts-main-container">
          {/* Hero Section with Integrated Navigation */}
          <div className="posts-hero-section">
            <div className="posts-hero-content">
              <h1 className="posts-hero-title">{currentNavItem.title}</h1>
              <p className="posts-hero-subtitle">{currentNavItem.subtitle}</p>
              
              {/* Integrated Tab Navigation */}
              <div className="posts-tab-container">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    className={`posts-tab ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <span className="posts-tab-icon" role="img" aria-label={item.label}>
                      {item.icon}
                    </span>
                    <span className="posts-tab-text">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="posts-tab-content">
            <div className="posts-tab-section">
              {renderContent()}
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}

export default Feed;
