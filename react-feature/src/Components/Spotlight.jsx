import "./Spotlight.css";
import { useState, useEffect, useRef } from "react";
import SpotlightItem from "./SpotlightItem";
import { listPostsDesc } from "../services/PostsService";

function Spotlight() {
  const [spotlightPosts, setSpotlightPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef(null);
  const PAGE_SIZE = 6;
  const CARD_WIDTH = 300; // px, including gap

  useEffect(() => {
    fetchPosts(page);
    // eslint-disable-next-line
  }, [page]);

  useEffect(() => {
    updateArrowState();
    // eslint-disable-next-line
  }, [spotlightPosts]);

  const fetchPosts = async (pageNum) => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const response = await listPostsDesc(pageNum, PAGE_SIZE);
      const newPosts = response.data || [];
      setSpotlightPosts((prev) => [...prev, ...newPosts]);
      if (newPosts.length < PAGE_SIZE) setHasMore(false);
    } catch (error) {
      setHasMore(false);
    }
    setLoading(false);
  };

  const updateArrowState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  const handleArrow = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = dir === 'left' ? -CARD_WIDTH : CARD_WIDTH;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(() => {
      updateArrowState();
      // If scrolling right and near end, trigger load more
      if (dir === 'right' && el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 * CARD_WIDTH && hasMore && !loading) {
        setPage((prev) => prev + 1);
      }
    }, 350);
  };

  // Also update arrows on manual scroll (e.g., touchpad)
  const handleManualScroll = () => {
    updateArrowState();
    const el = scrollRef.current;
    if (el && el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 * CARD_WIDTH && hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="spotlight-arrow-container">
      {canScrollLeft && (
        <button className="spotlight-arrow left" onClick={() => handleArrow('left')} aria-label="Scroll left">&#8592;</button>
      )}
      <div
        id="spotlight-scroll-container"
        ref={scrollRef}
        onScroll={handleManualScroll}
      >
        <div id="spotlight" style={{ minWidth: 'fit-content' }}>
          {spotlightPosts.map((item) => (
            <SpotlightItem key={item.id + '-' + item.title} {...item} />
          ))}
          {loading && <div className="spotlight-loading">Loading...</div>}
        </div>
      </div>
      {canScrollRight && (
        <button className="spotlight-arrow right" onClick={() => handleArrow('right')} aria-label="Scroll right">&#8594;</button>
      )}
    </div>
  );
}
export default Spotlight;