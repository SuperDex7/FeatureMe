import "./Footer.css";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "/feed", label: "Feed" },
      { href: "/trending", label: "Trending" },
      { href: "/user-search", label: "Find artists" },
    ],
  },
  {
    title: "Create",
    links: [
      { href: "/create-post", label: "New post" },
      { href: "/pending-features", label: "Feature requests" },
      { href: "/messages", label: "Messages" },
    ],
  },
  {
    title: "FeatureMe",
    links: [
      { href: "/subscription", label: "FeatureMe Plus" },
      { href: "/privacy-policy", label: "Privacy policy" },
    ],
  },
];

const SOCIAL = [
  { href: "https://www.instagram.com/therealfeatureme/", label: "Instagram" },
  { href: "https://www.tiktok.com/@therealfeatureme", label: "TikTok" },
  { href: "https://youtube.com/@therealfeatureme", label: "YouTube" },
];

function Footer() {
  return (
    <footer className="fm-footer">
      <div className="fm-footer__inner">
        <div className="fm-footer__brand">
          <a href="/" className="fm-footer__logo">
            <img src="/SVGs/Logo Lockup Gradient.svg" alt="FeatureMe home" />
          </a>
          <p className="fm-footer__tagline">Share music, find collaborators and feature on each other&apos;s tracks.</p>
          <ul className="fm-footer__social" aria-label="FeatureMe on social media">
            {SOCIAL.map((item) => (
              <li key={item.label}>
                <a href={item.href} target="_blank" rel="noopener noreferrer">{item.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <nav className="fm-footer__nav" aria-label="Footer">
          {COLUMNS.map((column) => (
            <div key={column.title} className="fm-footer__column">
              <h2 className="fm-footer__title">{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.href}><a href={link.href}>{link.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="fm-footer__bottom">
        <p>© {new Date().getFullYear()} FeatureMe</p>
        <p>
          Logo and art by{" "}
          <a href="https://www.instagram.com/janeymitch2/" target="_blank" rel="noopener noreferrer">janeymitch2</a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
