import React from "react";
import FeedItem from "./FeedItem";


function Feedf() {
  // Dummy data for demonstration
  const feedData = [
    {
      id: 1,
      author: "Juice WRLD",
      content: "This song was for my dead dog,",
      timestamp: "2 hours ago",
    },
    {
      id: 2,
      author: "XXXTentacion",
      content: "100$ to hop on this.",
      timestamp: "3 hours ago",
    },
    {
      id: 3,
      author: "oksurf",
      content: "This my song hmu for feats",
      timestamp: "4 hours ago",
    },
  ];

  return (
    <main className="feed">
      {feedData.map((item) => (
        <FeedItem key={item.id} {...item} />
      ))}
    </main>
  );
}

export default Feedf;
