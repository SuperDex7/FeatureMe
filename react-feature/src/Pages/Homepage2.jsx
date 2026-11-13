import { useCallback, useEffect, useState } from 'react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import FeedItem from '../Components/FeedItem';
import Notifications from '../Components/Notifications';
import ShowFollow from '../Components/ShowFollow';
import ViewsAnalyticsCard from '../Components/ViewsAnalyticsCard';
import FriendSuggestions from '../Components/FriendSuggestions';
import Dialog from '../Components/ui/Dialog';
import Icon from '../Components/ui/Icon';
import PlusBadge from '../Components/ui/PlusBadge';
import useNotifications from '../hooks/useNotifications';
import api from '../services/AuthService';
import { bannerStyle } from '../utils/banner';
import '../Styling/HomeDashboard.css';

const DEFAULT_AVATAR = '/dpp.jpg';
const LATEST_COUNT = 2;
const ACTIVITY_PREVIEW = 5;
const TRENDING_PREVIEW = 3;

// The logged-in dashboard: your numbers, your newest posts, what's happening
// around you, and a peek at Trending.
function Homepage2() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [latestPosts, setLatestPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [followPopup, setFollowPopup] = useState(null); // 'followers' | 'following' | null
  const [activityOpen, setActivityOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  // Same list as the header bell (loaded once for both)
  const notifications = useNotifications(Boolean(user));

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data: me } = await api.get('/user/me');
        if (cancelled) return;
        setUser(me);
        setStatus('ready');

        // Post ids are appended as they're created, so the newest are at the end
        const recentIds = (me.posts || []).slice(-10);
        const [latest, top] = await Promise.allSettled([
          recentIds.length
            ? api.get(`/posts/get/all/id/${recentIds.join(',')}/sorted?page=0&size=${LATEST_COUNT}`)
            : Promise.resolve({ data: { content: [] } }),
          api.get(`/posts/get/likesdesc?page=0&size=${TRENDING_PREVIEW}`),
        ]);
        if (cancelled) return;
        if (latest.status === 'fulfilled') setLatestPosts(latest.value.data.content || []);
        if (top.status === 'fulfilled') setTrending(top.value.data.content || []);
      } catch (err) {
        console.error('Error loading home page:', err);
        if (!cancelled) setStatus('error');
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const closeActivity = useCallback(() => setActivityOpen(false), []);
  const closeAnalytics = useCallback(() => setAnalyticsOpen(false), []);

  if (status !== 'ready') {
    return (
      <div className="fm-page">
        <Header />
        <main className="fm-page__main">
          {status === 'loading' ? (
            <div className="fm-state" role="status">
              <div className="fm-spinner" />
              <p>Loading your dashboard…</p>
            </div>
          ) : (
            <div className="fm-state" role="alert">
              <h3>Couldn&apos;t load your dashboard</h3>
              <p>Check your connection and try again.</p>
              <button type="button" className="fm-btn fm-btn--secondary" onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  const isPlus = user.role === 'USERPLUS';

  return (
    <div className="fm-page">
      <Header />

      <main className="fm-page__main">
        <div className="fm-home">
          {/* Welcome */}
          <section className="fm-home__welcome" style={bannerStyle(user)}>
            <div className="fm-home__welcome-shade">
              <img className="fm-home__avatar" src={user.profilePic || DEFAULT_AVATAR} alt="" />
              <div className="fm-home__hello">
                <span className="fm-home__eyebrow">Welcome back</span>
                <h1 className="fm-home__name">
                  {user.userName}
                  {isPlus && <PlusBadge size={28} />}
                </h1>
              </div>
              <div className="fm-home__welcome-actions">
                <a href="/create-post" className="fm-btn fm-btn--primary">
                  <Icon name="plus" size={18} strokeWidth={2} />
                  Upload a track
                </a>
                <a href={`/profile/${user.userName}`} className="fm-btn fm-btn--secondary fm-home__on-media">
                  View profile
                </a>
              </div>
            </div>
          </section>

          {/* Stats */}
          <ul className="fm-home__stats" aria-label="Your stats">
            <li>
              <a href={`/profile/${user.userName}`} className="fm-home__stat">
                <Icon name="music" />
                <span className="fm-home__stat-value">{user.posts?.length || 0}</span>
                <span className="fm-home__stat-label">Posts</span>
              </a>
            </li>
            <li>
              <button type="button" className="fm-home__stat" onClick={() => setFollowPopup('followers')}>
                <Icon name="user" />
                <span className="fm-home__stat-value">{user.followersCount ?? 0}</span>
                <span className="fm-home__stat-label">Followers</span>
              </button>
            </li>
            <li>
              <button type="button" className="fm-home__stat" onClick={() => setFollowPopup('following')}>
                <Icon name="star" />
                <span className="fm-home__stat-value">{user.followingCount ?? 0}</span>
                <span className="fm-home__stat-label">Following</span>
              </button>
            </li>
            <li>
              <button type="button" className="fm-home__stat" onClick={() => setActivityOpen(true)}>
                <Icon name="bell" />
                <span className="fm-home__stat-value">{notifications.status === 'loading' && notifications.items.length === 0 ? '–' : notifications.total}</span>
                <span className="fm-home__stat-label">Notifications</span>
              </button>
            </li>
          </ul>

          <div className="fm-home__layout">
            <div className="fm-home__main">
              {/* Latest posts */}
              <section className="fm-home__section" aria-labelledby="fm-home-latest">
                <div className="fm-home__section-head">
                  <h2 id="fm-home-latest" className="fm-home__section-title">Your latest posts</h2>
                  {latestPosts.length > 0 && (
                    <a href={`/profile/${user.userName}`} className="fm-home__more">
                      See all <Icon name="chevronRight" size={16} />
                    </a>
                  )}
                </div>
                {latestPosts.length > 0 ? (
                  <div className="fm-home__grid">
                    {latestPosts.map((post) => (
                      <FeedItem key={post.id} {...post} currentUser={user} />
                    ))}
                  </div>
                ) : (
                  <div className="fm-card fm-state fm-home__empty">
                    <h3>No posts yet</h3>
                    <p>Share a track, beat or loop and ask other artists to feature on it.</p>
                    <a href="/create-post" className="fm-btn fm-btn--primary">Upload your first track</a>
                  </div>
                )}
              </section>

              {/* Activity */}
              <section className="fm-card fm-home__activity" aria-labelledby="fm-home-activity">
                <div className="fm-home__section-head">
                  <h2 id="fm-home-activity" className="fm-home__card-title">Recent activity</h2>
                  {notifications.total > ACTIVITY_PREVIEW && (
                    <button type="button" className="fm-home__more" onClick={() => setActivityOpen(true)}>
                      View all {notifications.total} <Icon name="chevronRight" size={16} />
                    </button>
                  )}
                </div>
                {notifications.items.length > 0 ? (
                  <Notifications notifications={notifications.items.slice(0, ACTIVITY_PREVIEW)} className="fm-noti-list" onDelete={notifications.remove} />
                ) : notifications.status === 'loading' ? (
                  <p className="fm-home__muted">Loading…</p>
                ) : (
                  <p className="fm-home__muted">No notifications yet. Likes, comments and feature requests will show up here.</p>
                )}
              </section>
            </div>

            <aside className="fm-home__rail" aria-label="More">
              {/* Analytics */}
              <section className="fm-card fm-home__analytics">
                <span className="fm-home__analytics-icon"><Icon name="chart" /></span>
                <h2 className="fm-home__card-title">Analytics</h2>
                <p className="fm-home__muted">See who&apos;s listening, liking and downloading your tracks.</p>
                {isPlus ? (
                  <button type="button" className="fm-btn fm-btn--secondary fm-home__rail-btn" onClick={() => setAnalyticsOpen(true)}>
                    Open analytics
                  </button>
                ) : (
                  <a href="/subscription" className="fm-btn fm-btn--secondary fm-home__rail-btn">
                    <PlusBadge size={18} />
                    Get Plus to unlock
                  </a>
                )}
              </section>

              {/* Trending preview */}
              {trending.length > 0 && (
                <section className="fm-card" aria-labelledby="fm-home-trending">
                  <div className="fm-home__section-head">
                    <h2 id="fm-home-trending" className="fm-home__card-title">Trending now</h2>
                    <a href="/trending" className="fm-home__more">
                      See all <Icon name="chevronRight" size={16} />
                    </a>
                  </div>
                  <ol className="fm-home__trending">
                    {trending.map((post, index) => (
                      <li key={post.id}>
                        <a href="/trending" className="fm-home__trend">
                          <span className="fm-home__trend-rank">{index + 1}</span>
                          <span className="fm-home__trend-cover" style={bannerStyle(post.author)} aria-hidden="true" />
                          <span className="fm-home__trend-meta">
                            <span className="fm-home__trend-title">{post.title}</span>
                            <span className="fm-home__trend-artist">{post.author?.userName}</span>
                          </span>
                          <span className="fm-home__trend-likes" aria-label={`${post.likes?.length || 0} likes`}>
                            <Icon name="heart" size={14} />
                            {post.likes?.length || 0}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <FriendSuggestions limit={5} />
            </aside>
          </div>
        </div>
      </main>

      <Footer />

      <ShowFollow
        userName={user.userName}
        isOpen={followPopup !== null}
        onClose={() => setFollowPopup(null)}
        type={followPopup || 'followers'}
      />

      <Dialog
        open={activityOpen}
        onClose={closeActivity}
        title="Notifications"
        size="sm"
        footer={notifications.total > 0 ? (
          <button type="button" className="fm-btn fm-btn--secondary" onClick={notifications.clearAll}>Clear all</button>
        ) : null}
      >
        {notifications.items.length > 0 ? (
          <>
            <Notifications notifications={notifications.items} className="fm-noti-list" onDelete={notifications.remove} />
            {notifications.hasMore && (
              <div className="notifications-more">
                <button type="button" className="fm-btn fm-btn--secondary" onClick={notifications.loadMore} disabled={notifications.status === 'loadingMore'}>
                  {notifications.status === 'loadingMore' ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        ) : (
          <p>No notifications yet.</p>
        )}
      </Dialog>

      {isPlus && (
        <Dialog open={analyticsOpen} onClose={closeAnalytics} title="Analytics" size="lg">
          <ViewsAnalyticsCard />
        </Dialog>
      )}
    </div>
  );
}

export default Homepage2;
