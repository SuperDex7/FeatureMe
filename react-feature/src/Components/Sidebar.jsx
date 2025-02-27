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
    </aside>
  );
}

export default Sidebar;
