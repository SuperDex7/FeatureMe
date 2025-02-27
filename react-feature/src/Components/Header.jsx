import React from "react";
import { useState } from "react";
import Notifications from "./Notifications";
import "./Header.css";


function Header() {
const [displayNoti, setDisplayNoti] = useState(false);
  const showNoti = () => {
    setDisplayNoti(!displayNoti);
  }
  return (
    <nav id="nav" >
        <ul id="head">
          <h1 id="title"><a href="/home">FeatureMe</a></h1>
            <li className="click"><a href="/feed">Feed</a></li>
            
            <li><button id="noti" onClick={showNoti}>Notifications</button></li> 
          
       <li><a href="/profile">Profile</a></li> 
       
          
          <li></li>
          
        </ul>
        {displayNoti && 
            <div id="notiTab">
              <h2 id="notiTitle">Notifications</h2>
              <Notifications />
              
              <button id="seeAll">See All</button>
            </div>
          
          }
          
      </nav>
    
  );
}

export default Header;
