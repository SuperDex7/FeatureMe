
import React from "react";
import Header from "../Components/Header";
import Sidebar from "../Components/Sidebar";
import Feedf from "../Components/Feedf";
import "../Styling/FeedS.css"; 

function Feed() {
  return (
    <div className="feed-page">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="feed-layout">
        {/* Feed Container */}
        <Feedf />
        
        {/* Sidebar (Optional) */}
        <Sidebar />
      </div>
    </div>
  );
}

export default Feed;
