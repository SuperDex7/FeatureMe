import React from "react";
import "./Sidebar.css";

function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="sidebar__title">Sidebar</h2>
      <ul className="sidebar__list">
        <li><a href="/">Home</a></li>
        <li><a href="/profile">Profile</a></li>
        <li>Messages</li>
        <li>Notifications</li>
      </ul>
    </aside>
  );
}

export default Sidebar;
