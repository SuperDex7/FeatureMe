import React, { useState } from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import "../Styling/Profile.css";

function Profile() {
  const [activeTab, setActiveTab] = useState("posts");
  // Placeholder user data
  const user = {
    username: "SuperDex",
    bio: "FL Studio Producer | Musician | Content Creator",
    location: "Toronto, Canada",
    avatar: "dpp.jpg",
    banner: "pb.jpg",
    stats: { posts: 256, followers: "1.2k", following: 300 },
    badges: [
      { icon: "🌟", label: "Top Creator", color: "#ffd700" },
      { icon: "✔️", label: "Verified", color: "#4fd1c5" },
      { icon: "🎉", label: "Early Adopter", color: "#a259c6" },
      { icon: "💯", label: "100+ Posts", color: "#5f5fd9" }
    ]
  };
  return (
    <div className="profile-glass-root">
      <Header />
      <div className="profile-glass-banner-wrap taller">
        <img className="profile-glass-banner" src={user.banner} alt="Profile Banner" />
        
        <div className="profile-glass-avatar-wrap overlap-half">
          <img className="profile-glass-avatar" src={user.avatar} alt="User Avatar" />
        </div>
      </div>
      <div className="profile-glass-info-card overlap-margin">
        <button className="profile-glass-edit">Edit Profile</button>
        <h2 className="profile-glass-username">{user.username}</h2>
        <div className="profile-glass-badges-row">
          {user.badges.map((badge, i) => (
            <span
              key={i}
              className="profile-glass-badge"
              style={{ background: badge.color }}
              title={badge.label }
            >
              {badge.icon}
            </span>
          ))}
        </div>
        <p className="profile-glass-bio">{user.bio}</p>
        <p className="profile-glass-location">{user.location}</p>
        <div className="profile-glass-stats">
          <div className="profile-glass-stat"><span className="stat-icon">📝</span><span className="stat-value">{user.stats.posts}</span><span className="stat-label">Posts</span></div>
          <div className="profile-glass-stat"><span className="stat-icon">👥</span><span className="stat-value">{user.stats.followers}</span><span className="stat-label">Followers</span></div>
          <div className="profile-glass-stat"><span className="stat-icon">➡️</span><span className="stat-value">{user.stats.following}</span><span className="stat-label">Following</span></div>
        </div>
      </div>
      <div className="profile-glass-tabs">
        <button className={`profile-glass-tab${activeTab === "posts" ? " active" : ""}`} onClick={() => setActiveTab("posts")}>Posts</button>
        <button className={`profile-glass-tab${activeTab === "about" ? " active" : ""}`} onClick={() => setActiveTab("about")}>About</button>
        <button className={`profile-glass-tab${activeTab === "friends" ? " active" : ""}`} onClick={() => setActiveTab("friends")}>Friends</button>
      </div>
      <div className="profile-glass-content">
        {activeTab === "posts" && (
          <div>
            <h3>Your Recent Posts</h3>
            <p>List or grid of user posts goes here.</p>
          </div>
        )}
        {activeTab === "about" && (
          <div>
            <h3>About You</h3>
            <p>All the personal details, bio, interests, etc. go here.</p>
          </div>
        )}
        {activeTab === "friends" && (
          <div>
            <h3>Your Friends</h3>
            <p>List of friends or followers goes here.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Profile;
