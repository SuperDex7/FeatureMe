import React from "react";
import FeedItem from "./FeedItem";


function Feedf() {
  // Dummy data for demonstration
  const feedData = [
    {
      id: 1,
      author: "John Doe",
      content: "Just tried out this new feed layout. Loving it!",
      timestamp: "2 hours ago",
    },
    {
      id: 2,
      author: "Jane Smith",
      content: "React makes building UIs so simple.",
      timestamp: "3 hours ago",
    },
    {
      id: 3,
      author: "Alice Johnson",
      content: "CSS styling is fun but can get tricky sometimes.",
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
