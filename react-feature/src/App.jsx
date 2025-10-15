import React from 'react';
import './Styling/App.css';
import Footer from './Components/Footer';
import Header2 from './Components/Header2';

function App() {
  // Record label logos with names for better accessibility
  const recordLabels = [
    {url: 'https://www.universalmusic.com/wp-content/uploads/2015/09/universal-music-group-logo.png', name: 'Universal Music' },
    {url: 'https://store.warnermusic.com/on/demandware.static/-/Sites-Warner_US_Gold-Library/default/dw945c5b4c/images/WarnerMusicStore%28US%29/Warner-music-store/new-atlantic-banner-megastore-new.jpg', name: 'Warner Music' },
    {url: 'https://www.sony.com/en/SonyInfo/CorporateInfo/History/company/img/history_1988_01.png', name: 'Sony Music' },
    {url: 'https://variety.com/wp-content/uploads/2020/02/defjam-og.jpg?w=1000&h=562&crop=1', name: 'Def Jam' },
    {url: 'https://97beck4gumgp-u3975.pressidiumcdn.com/wp-content/uploads/2022/09/naxos-logo.png', name: 'Naxos' },
    {url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Interscope-Geffen-A%26M.svg/1200px-Interscope-Geffen-A%26M.svg.png', name: 'Interscope' },
    {url: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Republic_Record%27s_former.png', name: 'Republic Records' },
    {url: 'https://bassline.net/wp-content/uploads/2022/04/bassline-LOGO-2017-B7-x-Transp-ws.png', name: 'Bassline' },
    {url: 'https://visualnatives.com/wp-content/uploads/2017/01/epic-header-1920x800.jpg', name: 'Epic Records' },
    {url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Empire_Distribution_%28Logo%29.png/1200px-Empire_Distribution_%28Logo%29.png', name: 'Empire Distribution' },
  ];

  return (
    <div className="homepage-root">
      <Header2 />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-gradient-overlay"></div>
          <div className="hero-particles"></div>
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-logo-section">
              <img 
                src="/SVGs/Logo+Text Gradient.svg" 
                alt="FeatureMe Logo" 
                className="hero-logo"
              />
            </div>
            <div className="hero-badge">
              <span className="hero-badge-icon">🎵</span>
              <span>Join the Music Revolution</span>
            </div>
            <h1 className="hero-title">
              <span className="hero-title-main">FeatureMe</span>
              <span className="hero-title-sub">The Future of Music Collaboration</span>
            </h1>
            <p className="hero-description">
              The ultimate platform for musicians to connect, collaborate, and showcase their talent. 
              Join the next generation of music creators.
            </p>
            <div className="hero-actions">
              <a href="/signup" className="hero-cta-primary">
                <span>Start Creating</span>
                <svg className="hero-cta-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="/login" className="hero-cta-secondary">Sign In</a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-number">∞</span>
                <span className="hero-stat-label">Possibilities</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">24/7</span>
                <span className="hero-stat-label">Available</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">100%</span>
                <span className="hero-stat-label">Free</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-visual-background">
              <div className="hero-visual-overlay">
                <img src="/Jpgs/Asset 13.jpg" alt="Music Studio" className="hero-bg-image hero-bg-1" />
                <img src="/Jpgs/Asset 14.jpg" alt="Recording Session" className="hero-bg-image hero-bg-2" />
                <img src="/Jpgs/Asset 15.jpg" alt="Music Equipment" className="hero-bg-image hero-bg-3" />
              </div>
            </div>
            <div className="hero-card-stack">
              <div className="hero-card hero-card-1">
                <div className="hero-card-header">
                  <div className="hero-card-avatar" style={{backgroundImage: 'url(/Jpgs/Asset 12.jpg)'}}></div>
                  <div className="hero-card-info">
                    <div className="hero-card-name">Alex Chen</div>
                    <div className="hero-card-role">Producer</div>
                  </div>
                </div>
                <div className="hero-card-content">
                  <div className="hero-card-title">New Beat Drop</div>
                  <div className="hero-card-genre">Hip-Hop</div>
                </div>
                <div className="hero-card-actions">
                  <button className="hero-card-play">▶</button>
                  <span className="hero-card-likes">❤️ 234</span>
                </div>
              </div>
              <div className="hero-card hero-card-2">
                <div className="hero-card-header">
                  <div className="hero-card-avatar" style={{backgroundImage: 'url(/Jpgs/Asset 13.jpg)'}}></div>
                  <div className="hero-card-info">
                    <div className="hero-card-name">Maya Rodriguez</div>
                    <div className="hero-card-role">Vocalist</div>
                  </div>
                </div>
                <div className="hero-card-content">
                  <div className="hero-card-title">Looking for Producer</div>
                  <div className="hero-card-genre">R&B</div>
                </div>
                <div className="hero-card-actions">
                  <button className="hero-card-play">▶</button>
                  <span className="hero-card-likes">❤️ 89</span>
                </div>
              </div>
              <div className="hero-card hero-card-3">
                <div className="hero-card-header">
                  <div className="hero-card-avatar" style={{backgroundImage: 'url(/Jpgs/Asset 14.jpg)'}}></div>
                  <div className="hero-card-info">
                    <div className="hero-card-name">DJ Krypto</div>
                    <div className="hero-card-role">DJ</div>
                  </div>
                </div>
                <div className="hero-card-content">
                  <div className="hero-card-title">Festival Mix</div>
                  <div className="hero-card-genre">Electronic</div>
                </div>
                <div className="hero-card-actions">
                  <button className="hero-card-play">▶</button>
                  <span className="hero-card-likes">❤️ 567</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="features-header">
            <h2 className="features-title">Why Choose FeatureMe?</h2>
            <p className="features-subtitle">Everything you need to succeed in the music industry</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <span role="img" aria-label="upload">🎵</span>
              </div>
              <h3 className="feature-title">Upload & Share</h3>
              <p className="feature-description">Share your music, beats, and loops with a global community of artists and listeners. Get instant feedback and showcase your creativity.</p>
              <div className="feature-highlight">High-quality audio support</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span role="img" aria-label="collaborate">🤝</span>
              </div>
              <h3 className="feature-title">Collaborate & Connect</h3>
              <p className="feature-description">Find the perfect collaborators, join exciting projects, and grow your network in the music industry. Real-time messaging and file sharing.</p>
              <div className="feature-highlight">Real-time collaboration tools</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span role="img" aria-label="discover">🌟</span>
              </div>
              <h3 className="feature-title">Get Discovered</h3>
              <p className="feature-description">Showcase your talent to record labels, A&R representatives, and fans. Your next big break starts here with our discovery features.</p>
              <div className="feature-highlight">Smart discovery tools</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span role="img" aria-label="analytics">📊</span>
              </div>
              <h3 className="feature-title">Analytics & Insights</h3>
              <p className="feature-description">Track your performance with detailed analytics. See who's listening, and who's downloading, and optimize your strategy.</p>
              <div className="feature-highlight">Detailed performance metrics</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span role="img" aria-label="share">📤</span>
              </div>
              <h3 className="feature-title">Share Your Work</h3>
              <p className="feature-description">Upload and share your music, beats, and projects with the community. Get feedback, build your portfolio, and showcase your talent.</p>
              <div className="feature-highlight">Portfolio building</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <span role="img" aria-label="community">👥</span>
              </div>
              <h3 className="feature-title">Growing Community</h3>
              <p className="feature-description">Be part of a growing community of musicians, producers, and industry professionals. Learn, grow, and succeed together.</p>
              <div className="feature-highlight">Always expanding</div>
            </div>
          </div>
        </div>
      </section>

      {/* Discovery Section */}
      <section className="partners-section">
        <div className="partners-container">
          <div className="partners-header">
            <div className="partners-logo-section">
              <img 
                src="/SVGs/Logo Lockup Gradient.svg" 
                alt="FeatureMe" 
                className="partners-logo"
              />
            </div>
            <h2 className="partners-title">Get Noticed by Industry Leaders</h2>
            <p className="partners-subtitle">Showcase your talent to major record labels and industry professionals</p>
          </div>
          <div className="partners-scroll">
            <div className="partners-track">
              {recordLabels.concat(recordLabels).map((label, idx) => (
                <div
                  className="partner-logo"
                  key={idx}
                  style={{ backgroundImage: `url(${label.url})` }}
                  title={label.name}
                >
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="how-it-works-container">
          <div className="how-it-works-header">
            <h2 className="how-it-works-title">How It Works</h2>
            <p className="how-it-works-subtitle">Get started in just 4 simple steps</p>
          </div>
          <div className="steps-container">
            <div className="root-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <div className="step-icon">📢</div>
                <h3 className="step-title">Create Your Profile</h3>
                <p className="step-description">Set up your artist profile, upload your best work, and showcase your unique style to the community.</p>
              </div>
            </div>
            <div className="root-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <div className="step-icon">🔍</div>
                <h3 className="step-title">Discover & Connect</h3>
                <p className="step-description">Browse through artists, find collaborators that match your style, and start meaningful conversations.</p>
              </div>
            </div>
            <div className="root-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <div className="step-icon">🤝</div>
                <h3 className="step-title">Collaborate & Create</h3>
                <p className="step-description">Work together using our real-time collaboration tools, share files, and create amazing music together.</p>
              </div>
            </div>
            <div className="root-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <div className="step-icon">🌟</div>
                <h3 className="step-title">Get Discovered</h3>
                <p className="step-description">Publish your work, get noticed by record labels and fans, and take your music career to the next level.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <div className="cta-logo-section">
              <img 
                src="/SVGs/Logo+Text White.svg" 
                alt="FeatureMe" 
                className="cta-logo"
              />
            </div>
            <h2 className="cta-title">Ready to Start Your Music Journey?</h2>
            <p className="cta-description">Be among the first to experience the future of music collaboration. Start creating, connecting, and getting discovered today.</p>
            <div className="cta-actions">
              <a href="/signup" className="cta-button-primary">
                <span>Get Started Free</span>
                <svg className="cta-button-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="/login" className="cta-button-secondary">Already have an account? Sign In</a>
            </div>
            <div className="cta-guarantee">
              <span className="cta-guarantee-icon">✓</span>
              <span>Free forever • No credit card required • Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>
            
      <Footer />
    </div>
  );
}

export default App;
