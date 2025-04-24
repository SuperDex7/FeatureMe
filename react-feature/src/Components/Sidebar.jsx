import React from "react";
import "./Sidebar.css";

function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="sidebar__title"><a href="/profile">SuperDex</a></h2>
      <ul className="sidebar__list">
        <li><a href="/home">Home</a></li>
        <li><a href="/profile">Profile</a></li>
        <li>Messages</li>
        <li>Notifications</li>
      </ul>
      <div className="container">
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
