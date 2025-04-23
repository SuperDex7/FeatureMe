import "./Spotlight.css";
import { useState, useEffect } from "react";
import SpotlightItem from "./SpotlightItem";
import { listPostsDesc } from "../services/PostsService";

function Spotlight() {
  const [spotlightPosts, setSpotlightPosts] = useState([]);
    useEffect(() => {
      listPostsDesc().then((response) => {
        setSpotlightPosts(response.data);
        console.log(response.data)
      }).catch(error => {
        console.error(error);
      })
    }, [])
  
  return (
    
    <div id="spotlight">
      {spotlightPosts.map((item) => (
              <SpotlightItem key={item.id} {...item} />
            ))}
    </div>
   
  );
}
export default Spotlight