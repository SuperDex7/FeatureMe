import React from 'react';
import './Styling/App.css';
import Footer from './Components/Footer';
import Header2 from './Components/Header2';

function App() {
  // Placeholder record label logos (use urled divs for now)
  const recordLabels = [
    {url: 'https://www.universalmusic.com/wp-content/uploads/2015/09/universal-music-group-logo.png', },
   {url: 'https://store.warnermusic.com/on/demandware.static/-/Sites-Warner_US_Gold-Library/default/dw945c5b4c/images/WarnerMusicStore%28US%29/Warner-music-store/new-atlantic-banner-megastore-new.jpg' },
    {url: 'https://www.sony.com/en/SonyInfo/CorporateInfo/History/company/img/history_1988_01.png' },
    {url: 'https://variety.com/wp-content/uploads/2020/02/defjam-og.jpg?w=1000&h=562&crop=1' },
    {url: 'https://97beck4gumgp-u3975.pressidiumcdn.com/wp-content/uploads/2022/09/naxos-logo.png' },
    {url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Interscope-Geffen-A%26M.svg/1200px-Interscope-Geffen-A%26M.svg.png' },
    {url: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Republic_Record%27s_former.png' },
    {url: 'https://bassline.net/wp-content/uploads/2022/04/bassline-LOGO-2017-B7-x-Transp-ws.png' },
    {url: 'https://visualnatives.com/wp-content/uploads/2017/01/epic-header-1920x800.jpg' },
    {url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Empire_Distribution_%28Logo%29.png/1200px-Empire_Distribution_%28Logo%29.png' },
  ];

  return (
    <div className="starter-root">
      <Header2 />
      {/* Hero Section */}
      <header className="starter-hero">
        <div className="starter-hero-content">
          <h1 className="starter-title">FeatureMe</h1>
          <p className="starter-subtitle">Where Musicians Connect, Create, and Get Discovered</p>
          <a href="/signup" className="starter-signup-btn">Sign Up</a>
        </div>
        <img className="starter-hero-img" src="background.jpg" alt="Studio" />
      </header>

      {/* Goals Section */}
      <section className="starter-goals">
        <div className="starter-goal-card">
          <span role="img" aria-label="upload" className="starter-goal-icon">🎵</span>
          <h3>Upload Your Music</h3>
          <p>Share beats, songs, and loops with a global community of artists and listeners.</p>
        </div>
        <div className="starter-goal-card">
          <span role="img" aria-label="collaborate" className="starter-goal-icon">🤝</span>
          <h3>Collaborate & Connect</h3>
          <p>Find collaborators, join projects, and grow your network in the music industry.</p>
        </div>
        <div className="starter-goal-card">
          <span role="img" aria-label="discover" className="starter-goal-icon">🌟</span>
          <h3>Get Discovered</h3>
          <p>Attract attention from record labels and fans. Your next big break starts here.</p>
        </div>
      </section>

      {/* Infinite Scroll Record Labels */}
      <section className="starter-labels-scroll-section">
        <h2 className="starter-labels-title">Featured Record Labels</h2>
        <div className="starter-labels-scroll">
          <div className="starter-labels-track">
            {recordLabels.concat(recordLabels).map((label, idx) => (
              <div
                className="starter-label-logo"
                key={idx}
                style={{ backgroundImage: `url(${label.url})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
              >
             
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Vertical Timeline Section */}
      <section className="starter-howitworks-vertical">
        <h2 className="starter-howitworks-title">How It Works</h2>
        <div className="starter-howitworks-vtimeline">
          <div className="starter-howitworks-vline"></div>
          <div className="starter-howitworks-vsteps">
            <div className="starter-howitworks-vstep">
              <div className="starter-howitworks-vicon">📢</div>
              <div className="starter-howitworks-vcontent">
                <div className="starter-howitworks-vtitle">Post Your Project</div>
                <div className="starter-howitworks-vdesc">Share your music, beats, or ideas to attract collaborators.</div>
              </div>
            </div>
            <div className="starter-howitworks-vstep">
              <div className="starter-howitworks-vicon">💬</div>
              <div className="starter-howitworks-vcontent">
                <div className="starter-howitworks-vtitle">Message Creators</div>
                <div className="starter-howitworks-vdesc">Reach out to other artists and producers to start a conversation or propose a collaboration.</div>
              </div>
            </div>
            <div className="starter-howitworks-vstep">
              <div className="starter-howitworks-vicon">🤝</div>
              <div className="starter-howitworks-vcontent">
                <div className="starter-howitworks-vtitle">Collaborate & Create</div>
                <div className="starter-howitworks-vdesc">Work together, share files, and build something amazing.</div>
              </div>
            </div>
            <div className="starter-howitworks-vstep">
              <div className="starter-howitworks-vicon">🌟</div>
              <div className="starter-howitworks-vcontent">
                <div className="starter-howitworks-vtitle">Get Discovered</div>
                <div className="starter-howitworks-vdesc">Publish your work and get noticed by record labels and fans.</div>
              </div>
            </div>
          </div>
        </div>
        <h1>Get Started Now</h1> <a href="/signup" className="starter-signup-btn">Sign Up</a>
      </section>
            
      <Footer />
    </div>
  );
}

export default App;
