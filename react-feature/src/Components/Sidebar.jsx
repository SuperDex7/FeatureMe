import React from "react";
import "./Sidebar.css";

const playlists = [
  { name: "Liked Songs", icon: "💜" },
  { name: "Chill Vibes", icon: "🎧" },
  { name: "Top 100 Yearly", icon: "🔥" },
  { name: "Indie", icon: "🌈" },
  { name: "Workout", icon: "💪" },
  { name: "Focus", icon: "🧠" },
  { name: "Party", icon: "🎉" },
  { name: "Jazz", icon: "🎷" },
  { name: "Discover Weekly", icon: "✨" },
];

function Sidebar() {
  const userString = localStorage.getItem('user');
  const userrr = JSON.parse(userString);
  return (
    <aside className="sidebar sidebar-dark">
      <div className="sidebar__logo">
        <a href="/home" className="sidebar__logo-link">FeatureMe</a>
        <div className="sidebar__username"><a href={`/profile/${userrr.username}`}>{userrr.username}</a></div>
      </div>
      <nav className="sidebar__nav">
        <ul>
          <li><a href="/home">Home</a></li>
          <li><a href={`/profile/${userrr.username}`}>Profile</a></li>
          <li><a href="/messages">Messages</a></li>
          <li><a href="/notifications">Notifications</a></li>
        </ul>
      </nav>
      <div className="sidebar__library">
        <div className="sidebar__library-title">Your Library</div>
        <div className="sidebar__playlists-scroll">
          <ul className="sidebar__playlists">
            {playlists.map((pl, idx) => (
              <li key={idx} className="sidebar__playlist-item">
                <span className="sidebar__playlist-icon">{pl.icon}</span>
                <span className="sidebar__playlist-name">{pl.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="sidebar__create-container">
        <a href="/create-post" className="button type--A">
          <div className="button__line"></div>
          <div className="button__line"></div>
          <span className="button__text">Create Post</span>
          <div className="button__drow1"></div>
          <div className="button__drow2"></div>
        </a>
      </div>
    </aside>
  );
}

export default Sidebar;
