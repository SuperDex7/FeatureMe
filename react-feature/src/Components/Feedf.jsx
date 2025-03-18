import React from "react";
import FeedItem from "./FeedItem";
import Spotlight from "./Spotlight";


function Feedf() {
  // Dummy data for demonstration
  const feedData = [
    {
      id: 3,
      author: "Juice WRLD",
      content: "This song was for my dead dog",
      timestamp: "2 hours ago",
      songname: "Lucid Dreams",
      features: ["Trippie Redd", "Lil Uzi Vert"],
      comments:["This Trash dood", "Grow up kid!!", "Dookieeee"],
      genre: "Hiphop",
      likes:["ggwoah", "oopsieeeepie", "Graaaaa123"]
    },
    {
      id: 2,
      author: "XXXTentacion",
      content: "100$ to hop on this.",
      timestamp: "3 hours ago",
      songname: "SAD",
      features: [],
      comments:["FIREEEE!!"],
      genre: "RNB",
      likes:["doooeeaa23","boiwhattt23556","noudidnt665","getoutdood1","Icantbveliece1111"]
    },
    {
      id: 1,
      author: "oksurf",
      content: "This my song hmu for feats",
      timestamp: "4 hours ago",
      songname: "Surf",
      features: ["SuperDex", "RezzyPhil"],
      comments:[],
      genre: "Punk",
      likes:[]
    },
    {
      id: 4,
      author: "DaddyDex",
      content: "Listen to this track",
      timestamp: "15 hours ago",
      songname: "Gungnam Style",
      features: ["Guru"],
      comments:["This Trash dood", "Grow up kid!!", "Dookieeee"],
      genre: "Soul",
      likes:["ggwoah", "oopsieeeepie", "Graaaaa123"]
    },
  ];

  return (
    <main className="feed">
      <h2 id="spotName">Spotlight</h2>
      <Spotlight />
      <h2 id="feedName">Feed</h2>
      {feedData.map((item) => (
        <FeedItem key={item.id} {...item} />
      ))}
    </main>
  );
}

export default Feedf;
