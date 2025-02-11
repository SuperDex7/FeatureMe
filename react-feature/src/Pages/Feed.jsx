
import React from "react";
import Header from "../Components/Header";
import Sidebar from "../Components/Sidebar";
import Feedf from "../Components/Feedf";
import "../Styling/FeedS.css"; 

function Feed() {
  return (
    <div className="feed-page">
      <Header />
      <div className="feed-layout">
        <Sidebar />
        <Feedf />
        
      </div>
    </div>
  );
}

export default Feed;
