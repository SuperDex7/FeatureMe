import React, { useEffect, useState } from "react";
import FeedItem from "./FeedItem";
import Spotlight from "./Spotlight";
import { listPosts } from "../services/PostsService";

function Feedf() {
 
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    listPosts().then((response) => {
      setPosts(response.data);
      console.log(response.data)
    }).catch(error => {
      console.error(error);
    })
  }, [])
  
  return (
    <main className="feed">
      <h2 id="spotName">Spotlight</h2>
      <Spotlight />
      <h2 id="feedName">Feed</h2>
      <div id="new-section">
      <h3 id="rec-title">New Releases: </h3>
      <h3 className="showmore">Show More</h3>
      </div>
      <div id="recentposts">
      {posts.map((item) => (
        <FeedItem key={item.id} {...item} />
      ))}
      </div>
    </main>
  );
}

export default Feedf;
