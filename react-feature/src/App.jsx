import { useEffect, useState } from "react";
import Header from "./Components/Header";
import Footer from "./Components/Footer";
import Icon from "./Components/ui/Icon";
import { getCurrentUserSafe } from "./services/AuthService";
import "./Styling/LandingPage.css";

const STEPS = [
  { icon: "music", title: "Post a track", text: "Upload a song, beat, loop or acapella and tag it so the right people find it." },
  { icon: "userPlus", title: "Ask for features", text: "Tag the artists you want on it. They get a request and the post goes live once they accept." },
  { icon: "message", title: "Work it out together", text: "Message collaborators, swap files and keep everything in one place." },
];

const FEATURES = [
  { icon: "trending", title: "Trending", text: "The most liked tracks and the artists behind them, updated as people listen." },
  { icon: "search", title: "Find artists", text: "Search by name, follow people and play their demos straight from the results." },
  { icon: "download", title: "Free downloads", text: "Let people download your beats and loops when you want them out there." },
  { icon: "chart", title: "Analytics with Plus", text: "See who's listening, liking and downloading, plus WAV uploads up to 90 MB." },
];

// Public landing page at "/". The header shows Log in / Sign up to visitors
// and the normal navigation to people who are already logged in.
function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    getCurrentUserSafe().then((user) => setLoggedIn(Boolean(user)));
  }, []);

  const ctas = loggedIn ? (
    <a href="/home" className="fm-btn fm-btn--primary fm-landing__cta">
      Go to your dashboard
      <Icon name="chevronRight" size={18} />
    </a>
  ) : (
    <>
      <a href="/signup" className="fm-btn fm-btn--primary fm-landing__cta">
        Create a free account
        <Icon name="chevronRight" size={18} />
      </a>
      <a href="/login" className="fm-btn fm-btn--secondary fm-landing__cta">Log in</a>
    </>
  );

  return (
    <div className="fm-page">
      <Header />

      <main className="fm-page__main fm-landing">
        {/* Hero */}
        <section className="fm-landing__hero" aria-labelledby="fm-landing-title">
          <div className="fm-landing__hero-text">
            <span className="fm-landing__eyebrow">For musicians</span>
            <h1 id="fm-landing-title" className="fm-landing__title">
              Make music with <span>artists who want in.</span>
            </h1>
            <p className="fm-landing__lede">
              Post your tracks, ask other artists to feature on them, and release them together. FeatureMe is free to join.
            </p>
            <div className="fm-landing__actions">{ctas}</div>
          </div>

          <div className="fm-landing__visual">
            <img src="/Jpgs/Asset 13.jpg" alt="" className="fm-landing__photo" />
            <div className="fm-landing__float fm-landing__float--request" aria-hidden="true">
              <span className="fm-landing__float-icon"><Icon name="userPlus" size={18} /></span>
              <span>
                <strong>New feature request</strong>
                <span>Join &ldquo;Late Night Drive&rdquo;?</span>
              </span>
            </div>
            <div className="fm-landing__float fm-landing__float--track" aria-hidden="true">
              <span className="fm-landing__float-play"><Icon name="play" size={16} /></span>
              <span>
                <strong>Late Night Drive</strong>
                <span>R&amp;B · feat. 2 artists</span>
              </span>
              <span className="fm-landing__float-likes"><Icon name="heart" size={14} />128</span>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="fm-landing__section" aria-labelledby="fm-landing-how">
          <div className="fm-landing__section-head">
            <h2 id="fm-landing-how" className="fm-landing__h2">How it works</h2>
            <p className="fm-landing__muted">Collaboration built around one idea: the feature request.</p>
          </div>
          <ol className="fm-landing__steps">
            {STEPS.map((step, index) => (
              <li key={step.title} className="fm-landing__step">
                <span className="fm-landing__step-num">{index + 1}</span>
                <span className="fm-landing__step-icon"><Icon name={step.icon} size={22} /></span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Features */}
        <section className="fm-landing__section fm-landing__features" aria-labelledby="fm-landing-features">
          <div className="fm-landing__features-photo">
            <img src="/Jpgs/Asset 14.jpg" alt="" />
          </div>
          <div className="fm-landing__features-body">
            <h2 id="fm-landing-features" className="fm-landing__h2">Everything in one place</h2>
            <ul className="fm-landing__feature-list">
              {FEATURES.map((feature) => (
                <li key={feature.title}>
                  <span className="fm-landing__feature-icon"><Icon name={feature.icon} size={20} /></span>
                  <span>
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="fm-landing__band" aria-labelledby="fm-landing-join">
          <img src="/SVGs/Logo White.svg" alt="" width={44} height={44} />
          <h2 id="fm-landing-join" className="fm-landing__band-title">Your next feature is one request away.</h2>
          <p>Free to join. Upgrade to Plus whenever you want more.</p>
          <div className="fm-landing__actions fm-landing__actions--center">
            {loggedIn ? (
              <a href="/home" className="fm-btn fm-landing__band-btn">Go to your dashboard</a>
            ) : (
              <>
                <a href="/signup" className="fm-btn fm-landing__band-btn">Create a free account</a>
                <a href="/login" className="fm-btn fm-landing__band-link">I already have an account</a>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
