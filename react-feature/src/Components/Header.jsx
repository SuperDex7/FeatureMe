import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Notifications from "./Notifications";
import Icon from "./ui/Icon";
import "./Header.css";
import { logout, getCurrentUserSafe, peekCurrentUser } from "../services/AuthService";
import useNotifications from "../hooks/useNotifications";

const NAV_LINKS = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/feed", label: "Feed", icon: "feed" },
  { href: "/trending", label: "Trending", icon: "trending" },
  { href: "/messages", label: "Messages", icon: "message" },
  { href: "/pending-features", label: "Requests", icon: "music" },
];

// Main app header for logged-in pages.
// Responsive: full search + labelled Create above 1100px; icon buttons below;
// nav links move into a menu below 760px (see Header.css).
function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  // Only one menu open at a time: "noti" | "user" | "nav" | null
  const [openMenu, setOpenMenu] = useState(null);
  // Known right away when moving between pages; otherwise checked below
  const [currentUser, setCurrentUser] = useState(() => peekCurrentUser() ?? null);
  const [userChecked, setUserChecked] = useState(() => peekCurrentUser() !== undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const headerRef = useRef(null);

  const toggleMenu = (name) => setOpenMenu((current) => (current === name ? null : name));
  const closeMenus = () => setOpenMenu(null);

  const handleLogout = async () => {
    await logout();
  };


  const handleSearch = (event) => {
    event.preventDefault();
    const term = searchTerm.trim();
    closeMenus();
    navigate(term ? `/user-search?q=${encodeURIComponent(term)}` : "/user-search");
  };

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUserSafe();
      setCurrentUser(user);
      setUserChecked(true);
    };
    fetchUser();
  }, []);

  // Shared with the home dashboard; loads once the user is known
  const notifications = useNotifications(Boolean(currentUser?.userName));

  // Close menus on outside click or Escape
  useEffect(() => {
    if (!openMenu) return undefined;
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        closeMenus();
      }
    };
    const handleKey = (event) => {
      if (event.key === "Escape") closeMenus();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [openMenu]);

  // Close menus after navigating
  useEffect(() => {
    closeMenus();
  }, [location.pathname]);

  const isActive = (href) => location.pathname === href || location.pathname.startsWith(`${href}/`);
  const notiCount = notifications.total;
  const userName = currentUser?.userName || "";
  const avatar = currentUser?.profilePic || "/dpp.jpg";

  // Still finding out who you are: just the logo, so neither the logged-in
  // links nor the Log in / Sign up buttons flash up and then disappear
  if (!userChecked) {
    return (
      <header className="fm-header" ref={headerRef}>
        <div className="fm-header__bar">
          <a href="/" className="fm-header__logo">
            <img src="/SVGs/Logo Lockup Gradient.svg" alt="FeatureMe" />
          </a>
        </div>
      </header>
    );
  }

  // Logged-out visitors (public pages like a shared post) get a minimal bar
  if (!currentUser) {
    return (
      <header className="fm-header" ref={headerRef}>
        <div className="fm-header__bar">
          <a href="/" className="fm-header__logo">
            <img src="/SVGs/Logo Lockup Gradient.svg" alt="FeatureMe" />
          </a>
          <div className="fm-header__actions fm-header__guest">
            <a href="/login" className="fm-btn fm-btn--secondary">Log in</a>
            <a href="/signup" className="fm-btn fm-btn--primary">Sign up</a>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fm-header" ref={headerRef}>
      <div className="fm-header__bar">
        <a href="/home" className="fm-header__logo">
          <img src="/SVGs/Logo Lockup Gradient.svg" alt="FeatureMe home" />
        </a>

        <nav className="fm-header__nav" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`fm-header__link${isActive(link.href) ? " is-active" : ""}`}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="fm-header__actions">
          <form className="fm-header__search" role="search" onSubmit={handleSearch}>
            <Icon name="search" size={18} />
            <label className="fm-visually-hidden" htmlFor="fm-header-search">Search artists</label>
            <input
              id="fm-header-search"
              type="search"
              placeholder="Search artists"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>

          <a href="/user-search" className="fm-header__icon-btn fm-header__search-btn" aria-label="Search artists">
            <Icon name="search" />
          </a>

          <div className="fm-header__menu-anchor">
            <button
              type="button"
              className="fm-header__icon-btn"
              onClick={() => toggleMenu("noti")}
              aria-label={notiCount > 0 ? `Notifications, ${notiCount} new` : "Notifications"}
              aria-expanded={openMenu === "noti"}
              aria-haspopup="true"
            >
              <Icon name="bell" />
              {notiCount > 0 && (
                <span className="fm-header__badge" aria-hidden="true">{notiCount > 9 ? "9+" : notiCount}</span>
              )}
            </button>

            {openMenu === "noti" && (
              <div className="fm-header__panel fm-header__panel--noti">
                <div className="fm-header__panel-head">
                  <h2>Notifications</h2>
                  {notiCount > 0 && (
                    <button type="button" className="fm-header__text-btn" onClick={notifications.clearAll}>
                      Clear all
                    </button>
                  )}
                </div>
                <div className="fm-header__noti-body">
                  {notiCount > 0 ? (
                    <>
                      <Notifications notifications={notifications.items} className="fm-header__noti-list" onDelete={notifications.remove} />
                      {notifications.hasMore && (
                        <div className="notifications-more">
                          <button type="button" className="fm-btn fm-btn--secondary" onClick={notifications.loadMore} disabled={notifications.status === "loadingMore"}>
                            {notifications.status === "loadingMore" ? "Loading…" : "Load more"}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="fm-header__empty">No notifications yet</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <a href="/create-post" className="fm-header__create" aria-label="Create post">
            <Icon name="plus" size={18} strokeWidth={2} />
            <span className="fm-header__create-label">Create post</span>
          </a>

          <div className="fm-header__menu-anchor">
            <button
              type="button"
              className="fm-header__avatar-btn"
              onClick={() => toggleMenu("user")}
              aria-label="Account menu"
              aria-expanded={openMenu === "user"}
              aria-haspopup="true"
            >
              <img src={avatar} alt="" />
            </button>

            {openMenu === "user" && (
              <div className="fm-header__panel fm-header__panel--user">
                <div className="fm-header__account">
                  <img src={avatar} alt="" />
                  <div>
                    <div className="fm-header__account-name">{userName || "Your account"}</div>
                    <div className="fm-header__account-plan">
                      {currentUser?.role === "USERPLUS" ? "Plus member" : "Free plan"}
                    </div>
                  </div>
                </div>
                <ul className="fm-header__menu-list">
                  <li><a href={`/profile/${userName}`}><Icon name="user" size={18} />View profile</a></li>
                  <li><a href="/create-post"><Icon name="plus" size={18} />Create post</a></li>
                  <li><a href="/messages"><Icon name="message" size={18} />Messages</a></li>
                  <li><a href="/pending-features"><Icon name="music" size={18} />Feature requests</a></li>
                  <li>
                    <a href="/subscription">
                      <Icon name="star" size={18} />
                      {currentUser?.role === "USER" ? "Upgrade plan" : "Your plan"}
                    </a>
                  </li>
                </ul>
                <div className="fm-header__menu-footer">
                  <button type="button" className="fm-header__logout" onClick={handleLogout}>
                    <Icon name="logout" size={18} />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="fm-header__icon-btn fm-header__nav-toggle"
            onClick={() => toggleMenu("nav")}
            aria-label={openMenu === "nav" ? "Close menu" : "Open menu"}
            aria-expanded={openMenu === "nav"}
            aria-controls="fm-header-mobile-nav"
          >
            <Icon name={openMenu === "nav" ? "close" : "menu"} />
          </button>
        </div>
      </div>

      {openMenu === "nav" && (
        <nav id="fm-header-mobile-nav" className="fm-header__mobile-nav" aria-label="Main">
          <form className="fm-header__mobile-search" role="search" onSubmit={handleSearch}>
            <Icon name="search" size={18} />
            <label className="fm-visually-hidden" htmlFor="fm-header-mobile-search">Search artists</label>
            <input
              id="fm-header-mobile-search"
              type="search"
              placeholder="Search artists"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`fm-header__mobile-link${isActive(link.href) ? " is-active" : ""}`}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              <Icon name={link.icon} />
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

export default Header;
