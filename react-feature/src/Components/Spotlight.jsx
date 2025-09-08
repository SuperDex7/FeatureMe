import "./Spotlight.css";
import { useState, useEffect } from "react";
import SpotlightItem from "./SpotlightItem";
import { listPostsDesc } from "../services/PostsService";
import api from "../services/AuthService";

// Genre to icon mapping
const GENRE_ICONS = {
  Rock: "🎸",
  Pop: "🎤",
  Jazz: "🎷",
  HipHop: "🎧",
  Electronic: "🎹",
  Indie: "🌈",
  Classical: "🎻",
  Country: "🤠",
  Blues: "🎺",
  Default: "🎵"
};

function Spotlight() {
  const [spotlightPosts, setSpotlightPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [size, setSize] = useState(6)
  const [totalPages, setTotalPages] = useState()
  const [page, setPage] = useState(0)

  useEffect(() => {
    fetchPosts();
  }, [size, page]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Fetch posts filtered by USERPLUS role for spotlight
      const response = await api.get(`/posts/get/likesdesc/role/USERPLUS?page=${page}&size=${size}`)
      const posts = response.data.content || [];
      setSpotlightPosts(posts);
      setTotalPages(response.data.page.totalPages -1)
    } catch (error) {
      console.error('Error fetching spotlight posts:', error);
      // Fallback to regular posts if role filtering fails
      try {
        const fallbackResponse = await api.get(`/posts/get/likesdesc?page=${page}&size=${size}`)
        const fallbackPosts = fallbackResponse.data.content || [];
        setSpotlightPosts(fallbackPosts);
        setTotalPages(fallbackResponse.data.page.totalPages -1)
      } catch (fallbackError) {
        console.error('Error fetching fallback posts:', fallbackError);
      }
    }
    setLoading(false);
  };

  const nextPage = () =>{
    setPage(page+1)
  }
  const prevPage = () =>{
    setPage(page-1)
  }

  // Group posts by genre and get top liked posts for each
  const getPostsByGenre = () => {
    const genreGroups = {};
    
    spotlightPosts.forEach(post => {
      const genres = Array.isArray(post.genre) ? post.genre : [post.genre];
      genres.forEach(genre => {
        if (genre && genre.trim()) {
          if (!genreGroups[genre]) {
            genreGroups[genre] = [];
          }
          genreGroups[genre].push(post);
        }
      });
    });

    // Sort posts by likes count within each genre
    Object.keys(genreGroups).forEach(genre => {
      genreGroups[genre].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    });

    return genreGroups;
  };

  const genreGroups = getPostsByGenre();
  const availableGenres = Object.keys(genreGroups);

  const getTopPostsForGenre = (genre, count = 6) => {
    return genreGroups[genre]?.slice(0, count) || [];
  };

  const getTopPostsOverall = (count = 6) => {
    return spotlightPosts
      .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
      .slice(0, count);
  };

  if (loading) {
    return (
      <div className="spotlight-container">
        <div className="spotlight-loading">Loading Spotlight...</div>
      </div>
    );
  }

  return (
    <div className="spotlight-container">
      {/* Genre Filter Tabs */}
      <div className="spotlight-genre-tabs">
        <button 
          className={`spotlight-genre-tab ${selectedGenre === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedGenre('all')}
        >
          <span role="img" aria-label="all">⭐</span>
          Plus Creators
        </button>
        {availableGenres.map(genre => (
          <button 
            key={genre}
            className={`spotlight-genre-tab ${selectedGenre === genre ? 'active' : ''}`}
            onClick={() => setSelectedGenre(genre)}
          >
            <span role="img" aria-label={genre}>{GENRE_ICONS[genre] || GENRE_ICONS.Default}</span>
            {genre}
          </button>
        ))}
      </div>

      {/* Spotlight Content */}
      <div className="spotlight-content">
        {selectedGenre === 'all' ? (
          <div className="spotlight-section">
            <div className="spotlight-section-header">
              <h2 className="spotlight-section-title">
                <span role="img" aria-label="star">⭐</span>
                Plus Creator Spotlight
              </h2>
              <p className="spotlight-section-subtitle">Top posts from Plus subscribers</p>
            </div>
            <div className="spotlight-cards-grid">
              {getTopPostsOverall().map((item) => (
                <SpotlightItem key={item.id + '-' + item.title} {...item} />
              ))}
            </div>
            <div id="pageButtons">
        <button className="section-more-btn" onClick={prevPage} disabled={page == 0? true: false}>Previous Page</button>
        <button className="section-more-btn" onClick={nextPage } disabled={page == totalPages? true: false}>Next Page</button>
        </div>
          </div>
        ) : (
          <div className="spotlight-section">
            <div className="spotlight-section-header">
              <h2 className="spotlight-section-title">
                <span role="img" aria-label={selectedGenre}>{GENRE_ICONS[selectedGenre] || GENRE_ICONS.Default}</span>
                Top {selectedGenre}
              </h2>
              <p className="spotlight-section-subtitle">Most popular {selectedGenre.toLowerCase()} posts</p>
            </div>
            <div className="spotlight-cards-grid">
              {getTopPostsForGenre(selectedGenre).map((item) => (
                <SpotlightItem key={item.id + '-' + item.title} {...item} />
              ))}
            </div>
          </div>
          
        )}
      </div>
    </div>
  );
}

export default Spotlight;