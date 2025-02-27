
import React from "react";
import Header from "../Components/Header";
import Sidebar from "../Components/Sidebar";
import Feedf from "../Components/Feedf";
import Footer from "../Components/Footer";
import "../Styling/FeedS.css"; 

function Feed() {
  return (
    <div>
    <div className="feed-page">
      <Header />
      <div className="feed-layout">
        <Sidebar />
        <Feedf />
        
      </div>
      
    </div>
    <Footer />
</div>
  );
}

export default Feed;
