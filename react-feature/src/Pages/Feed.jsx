import { useState } from "react";
import Header from "../Components/Header";
import Feed2 from "../Components/Feed2";
import Footer from "../Components/Footer";
import LikedPosts from "../Components/LikedPosts";
import MyPosts from "../Components/MyPosts";
import Icon from "../Components/ui/Icon";
import "../Styling/FeedPage.css";
// Old stylesheet: no longer used by this page's markup, but Profile.jsx and
// ViewsAnalyticsCard still rely on its .posts-grid rule (all CSS is global).
// Remove when those are redesigned.
import "../Styling/Feeds2.css";

const TABS = [
  { id: "feed", label: "Feed", title: "Your feed", subtitle: "New tracks and feature requests from the community." },
  { id: "liked", label: "Liked", title: "Liked posts", subtitle: "Tracks you've liked." },
  { id: "myPosts", label: "My posts", title: "Your posts", subtitle: "Everything you've shared." },
];

function initialTab() {
  const requested = new URLSearchParams(window.location.search).get("tab");
  // Spotlight moved to the Trending page
  if (requested === "spotlight") window.location.replace("/trending");
  return TABS.some((tab) => tab.id === requested) ? requested : "feed";
}

function Feed() {
  const [activeTab, setActiveTab] = useState(initialTab);
  const current = TABS.find((tab) => tab.id === activeTab) || TABS[0];

  const selectTab = (id) => {
    setActiveTab(id);
    // Keep the tab in the URL so refresh and back/forward return to it
    const url = new URL(window.location.href);
    if (id === "feed") url.searchParams.delete("tab");
    else url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "liked":
        return <LikedPosts />;
      case "myPosts":
        return <MyPosts />;
      default:
        return <Feed2 />;
    }
  };

  return (
    <div className="fm-page">
      <Header />

      <main className="fm-page__main">
        <div className="fm-feed-page">
          <div className="fm-feed-page__content">
            <div className="fm-feed-page__intro">
              <div>
                <h1 className="fm-feed-page__title">{current.title}</h1>
                <p className="fm-feed-page__subtitle">{current.subtitle}</p>
              </div>
              <div className="fm-segmented" role="tablist" aria-label="Feed sections">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`fm-feed-tab-${tab.id}`}
                    aria-selected={activeTab === tab.id}
                    aria-controls="fm-feed-panel"
                    className={`fm-segment${activeTab === tab.id ? " is-active" : ""}`}
                    onClick={() => selectTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div id="fm-feed-panel" role="tabpanel" aria-labelledby={`fm-feed-tab-${activeTab}`}>
              {renderContent()}
            </div>
          </div>

          <aside className="fm-feed-page__rail" aria-label="Shortcuts">
            <section className="fm-card">
              <h2 className="fm-feed-page__rail-title">Share something new</h2>
              <p className="fm-feed-page__rail-text">Upload a track, beat or demo and request features from other artists.</p>
              <a href="/create-post" className="fm-btn fm-btn--primary fm-feed-page__rail-btn">
                <Icon name="plus" size={18} strokeWidth={2} />
                Upload a track
              </a>
            </section>

            <a href="/trending" className="fm-card fm-feed-page__teaser">
              <span>
                <span className="fm-feed-page__rail-title">Trending</span>
                <span className="fm-feed-page__rail-text">Top tracks, Plus creators and artists to know</span>
              </span>
              <Icon name="chevronRight" />
            </a>

            <a href="/pending-features" className="fm-card fm-feed-page__teaser">
              <span>
                <span className="fm-feed-page__rail-title">Feature requests</span>
                <span className="fm-feed-page__rail-text">Review requests to feature on other artists&apos; tracks</span>
              </span>
              <Icon name="chevronRight" />
            </a>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Feed;
