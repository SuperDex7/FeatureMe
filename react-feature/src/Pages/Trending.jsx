import { useEffect, useState } from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import FeedItem from "../Components/FeedItem";
import AudioPlayer2 from "../Components/AudioPlayer2";
import Icon from "../Components/ui/Icon";
import PlusBadge from "../Components/ui/PlusBadge";
import api, { getCurrentUser } from "../services/AuthService";
import { MUSIC_GENRES } from "../constants/genres";
import { bannerStyle } from "../utils/banner";
import { recordView } from "../utils/views";
import "../Styling/TrendingPage.css";

const DEFAULT_AVATAR = "/dpp.jpg";
const TOP_COUNT = 10;
const SPOTLIGHT_COUNT = 6;

// The discovery page: the louder sibling of the feed. Rankings use all-time
// likes, because the backend doesn't track weekly plays yet.
function Trending() {
  const [topPosts, setTopPosts] = useState([]);
  const [spotlightPosts, setSpotlightPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [nowPlaying, setNowPlaying] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      api.get(`/posts/get/likesdesc?page=0&size=${TOP_COUNT}`),
      api.get(`/posts/get/likesdesc/role/USERPLUS?page=0&size=${SPOTLIGHT_COUNT}`),
      getCurrentUser(),
    ]).then(([top, spotlight, user]) => {
      if (cancelled) return;
      if (top.status === "fulfilled") setTopPosts(top.value.data.content || []);
      if (spotlight.status === "fulfilled") setSpotlightPosts(spotlight.value.data.content || []);
      if (user.status === "fulfilled") setCurrentUser(user.value || null);
      setStatus(top.status === "fulfilled" ? "ready" : "error");
    });
    return () => { cancelled = true; };
  }, []);

  const play = (post) => {
    setNowPlaying(post);
    recordView(post.id, currentUser);
  };

  const [featured, ...ranked] = topPosts;

  return (
    <div className="fm-page">
      <Header />

      <main className={`fm-page__main${nowPlaying ? " fm-trending--playing" : ""}`}>
        <div className="fm-trending">
          <div className="fm-trending__intro">
            <h1 className="fm-trending__title">Trending</h1>
            <p className="fm-trending__subtitle">The most liked tracks and the artists behind them.</p>
          </div>

          {status === "loading" && (
            <div className="fm-state" role="status">
              <div className="fm-spinner" />
              <p>Loading what&apos;s hot…</p>
            </div>
          )}

          {status === "error" && (
            <div className="fm-state" role="alert">
              <h3>Couldn&apos;t load trending tracks</h3>
              <p>Check your connection and try again.</p>
              <button type="button" className="fm-btn fm-btn--secondary" onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {status === "ready" && !featured && (
            <div className="fm-state">
              <h3>Nothing trending yet</h3>
              <p>Be the first to share a track.</p>
              <a href="/create-post" className="fm-btn fm-btn--primary">Upload a track</a>
            </div>
          )}

          {featured && (
            <>
              <FeaturedTrack post={featured} isPlaying={nowPlaying?.id === featured.id} onPlay={() => play(featured)} />

              {ranked.length > 0 && (
                <section className="fm-trending__section" aria-labelledby="fm-trending-top">
                  <SectionHead id="fm-trending-top" title="Top tracks" text="Ranked by likes." />
                  <ol className="fm-chart" start={2}>
                    {ranked.map((post, index) => (
                      <ChartRow
                        key={post.id}
                        post={post}
                        rank={index + 2}
                        isPlaying={nowPlaying?.id === post.id}
                        onPlay={() => play(post)}
                      />
                    ))}
                  </ol>
                </section>
              )}

              {spotlightPosts.length > 0 && (
                <section className="fm-trending__section" aria-labelledby="fm-trending-spotlight">
                  <SectionHead
                    id="fm-trending-spotlight"
                    title={<>Spotlight <PlusBadge size={24} /></>}
                    text="The most liked tracks from Plus creators."
                  />
                  <div className="fm-trending__grid">
                    {spotlightPosts.map((post) => (
                      <FeedItem key={post.id} {...post} currentUser={currentUser} />
                    ))}
                  </div>
                </section>
              )}

              <ArtistsToKnow posts={[...topPosts, ...spotlightPosts]} />
              <GenreTiles posts={topPosts} />
            </>
          )}
        </div>
      </main>

      {nowPlaying && (
        <div className="fm-now-playing" role="region" aria-label="Now playing">
          <div className="fm-now-playing__inner">
            <div className="fm-now-playing__track">
              <span className="fm-now-playing__cover" style={bannerStyle(nowPlaying.author)} aria-hidden="true" />
              <span className="fm-now-playing__text">
                <span className="fm-now-playing__label">Now playing</span>
                <a href={`/profile/${nowPlaying.author?.userName}`} className="fm-now-playing__artist">
                  {nowPlaying.author?.userName}
                </a>
              </span>
            </div>
            <div className="fm-now-playing__player">
              <AudioPlayer2
                key={nowPlaying.id}
                src={nowPlaying.music}
                title={nowPlaying.title}
                postId={nowPlaying.id}
                freeDownload={nowPlaying.freeDownload}
                onClose={() => setNowPlaying(null)}
              />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function SectionHead({ id, title, text }) {
  return (
    <div className="fm-trending__section-head">
      <h2 id={id} className="fm-trending__section-title">{title}</h2>
      {text && <p className="fm-trending__section-text">{text}</p>}
    </div>
  );
}

function FeaturedTrack({ post, isPlaying, onPlay }) {
  const { author = {} } = post;
  const genres = Array.isArray(post.genre) ? post.genre : [];
  return (
    <section className="fm-featured" aria-labelledby="fm-featured-title">
      <div className="fm-featured__text">
        <span className="fm-featured__eyebrow">
          <Icon name="trending" size={16} strokeWidth={2.2} />
          #1 most liked
        </span>
        <h2 id="fm-featured-title" className="fm-featured__title">{post.title}</h2>
        <a href={`/profile/${author.userName}`} className="fm-featured__artist">
          <img src={author.profilePic || DEFAULT_AVATAR} alt="" />
          {author.userName}
          {author.role === "USERPLUS" && <PlusBadge size={20} />}
        </a>
        {genres.length > 0 && (
          <div className="fm-featured__tags">
            {genres.slice(0, 3).map((genre) => <span key={genre} className="fm-featured__tag">{genre}</span>)}
          </div>
        )}
        <div className="fm-featured__foot">
          <button type="button" className="fm-btn fm-featured__play" onClick={onPlay} disabled={isPlaying}>
            <Icon name={isPlaying ? "volume" : "play"} size={18} />
            {isPlaying ? "Playing" : "Play"}
          </button>
          <span className="fm-featured__stat"><Icon name="heart" size={18} />{post.likes?.length || 0}</span>
          <span className="fm-featured__stat"><Icon name="eye" size={18} />{post.totalViews || 0}</span>
        </div>
      </div>
      <div className="fm-featured__cover" style={bannerStyle(author)} aria-hidden="true">
        <span>1</span>
      </div>
    </section>
  );
}

function ChartRow({ post, rank, isPlaying, onPlay }) {
  const { author = {} } = post;
  const genres = Array.isArray(post.genre) ? post.genre : [];
  return (
    <li className={`fm-chart__row${isPlaying ? " is-playing" : ""}`}>
      <span className="fm-chart__rank" aria-label={`Rank ${rank}`}>{rank}</span>
      <button type="button" className="fm-chart__cover" style={bannerStyle(author)} onClick={onPlay} aria-label={`Play ${post.title}`}>
        <Icon name={isPlaying ? "volume" : "play"} size={18} />
      </button>
      <span className="fm-chart__meta">
        <a href={`/post/${post.id}`} className="fm-chart__title">{post.title}</a>
        <a href={`/profile/${author.userName}`} className="fm-chart__artist">
          {author.userName}
          {author.role === "USERPLUS" && <PlusBadge size={14} />}
        </a>
      </span>
      {genres[0] && <span className="fm-tag fm-chart__genre">{genres[0]}</span>}
      <span className="fm-chart__likes" aria-label={`${post.likes?.length || 0} likes`}>
        <Icon name="heart" size={16} />
        {post.likes?.length || 0}
      </span>
    </li>
  );
}

// Artists behind the trending tracks, ordered by how many of those tracks they have
function ArtistsToKnow({ posts }) {
  const byName = new Map();
  for (const post of posts) {
    const author = post.author;
    if (!author?.userName) continue;
    const entry = byName.get(author.userName) || { author, ids: new Set() };
    entry.ids.add(post.id);
    byName.set(author.userName, entry);
  }
  const artists = [...byName.values()].sort((a, b) => b.ids.size - a.ids.size).slice(0, 8);
  if (artists.length === 0) return null;

  return (
    <section className="fm-trending__section" aria-labelledby="fm-trending-artists">
      <SectionHead id="fm-trending-artists" title="Artists to know" text="The people behind the top tracks." />
      <ul className="fm-artists">
        {artists.map(({ author, ids }) => (
          <li key={author.userName}>
            <a href={`/profile/${author.userName}`} className="fm-artist">
              <span className="fm-artist__ring">
                <img src={author.profilePic || DEFAULT_AVATAR} alt="" />
              </span>
              <span className="fm-artist__name">
                {author.userName}
                {author.role === "USERPLUS" && <PlusBadge size={16} />}
              </span>
              <span className="fm-artist__meta">{ids.size} trending {ids.size === 1 ? "track" : "tracks"}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

const GENRE_GRADIENTS = [
  "linear-gradient(135deg, #974d9e, #5491cd)",
  "linear-gradient(135deg, #e0884f, #974d9e)",
  "linear-gradient(135deg, #3fb8a6, #5491cd)",
  "linear-gradient(135deg, #6a5fb4, #e06f9a)",
  "linear-gradient(135deg, #3f4a8a, #8f7ef5)",
  "linear-gradient(135deg, #5491cd, #3fb8a6)",
];

// Genres that show up among the top tracks come first; the rest follow in the usual order
function GenreTiles({ posts }) {
  const counts = new Map();
  for (const post of posts) {
    for (const genre of Array.isArray(post.genre) ? post.genre : []) {
      if (MUSIC_GENRES.includes(genre)) counts.set(genre, (counts.get(genre) || 0) + 1);
    }
  }
  const genres = [...MUSIC_GENRES]
    .sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0))
    .slice(0, 12);

  return (
    <section className="fm-trending__section" aria-labelledby="fm-trending-genres">
      <SectionHead id="fm-trending-genres" title="Browse by genre" />
      <ul className="fm-genres">
        {genres.map((genre, index) => (
          <li key={genre}>
            <a
              href={`/feed?genre=${encodeURIComponent(genre)}`}
              className="fm-genre"
              style={{ backgroundImage: GENRE_GRADIENTS[index % GENRE_GRADIENTS.length] }}
            >
              <span className="fm-genre__name">{genre}</span>
              {counts.get(genre) > 0 && (
                <span className="fm-genre__meta">{counts.get(genre)} in top tracks</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Trending;
