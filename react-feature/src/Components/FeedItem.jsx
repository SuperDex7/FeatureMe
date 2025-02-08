import React from "react";


function FeedItem({ author, content, timestamp }) {
  return (
    <div className="feed-item">
      <div className="feed-item__header">
        <span className="feed-item__author">{author}</span>
        <span className="feed-item__timestamp">{timestamp}</span>
      </div>
      <div className="feed-item__content">{content}</div>
    </div>
  );
}

export default FeedItem;
