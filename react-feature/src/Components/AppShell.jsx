import { Fragment, useEffect, useLayoutEffect } from "react";
import { Outlet, useLocation, useNavigate, useNavigationType } from "react-router-dom";

// Pages that update their own address (search box, opening a chat) and
// expect to stay as they are while it changes
const KEEP_ON_QUERY_CHANGE = ["/messages", "/user-search"];

/**
 * Wraps every page (see main.jsx):
 * - Same-site links switch pages inside the app instead of reloading the
 *   whole site. New-tab clicks, target=_blank, downloads, other sites and
 *   links marked data-reload keep the browser's normal behavior.
 * - Each page starts fresh when its address changes (/profile/a -> /profile/b,
 *   /feed?genre=x), like it did when every link reloaded the site.
 * - Scroll goes to the top on new pages and is restored on Back/Forward.
 */

// Scroll position per history entry
const scrollPositions = new Map();

/**
 * Pages load their content after they appear, so on Back the page is often
 * too short to scroll to where you were yet. Keep trying for a moment while
 * it fills in, and stop as soon as you scroll yourself.
 */
function restoreScroll(y) {
  let frame;
  const started = performance.now();
  const stop = () => {
    cancelAnimationFrame(frame);
    ["wheel", "touchstart", "keydown", "mousedown"].forEach((type) => window.removeEventListener(type, stop));
  };
  ["wheel", "touchstart", "keydown", "mousedown"].forEach((type) => window.addEventListener(type, stop, { passive: true }));
  const attempt = () => {
    window.scrollTo(0, y);
    if (Math.abs(window.scrollY - y) <= 2 || performance.now() - started > 2000) stop();
    else frame = requestAnimationFrame(attempt);
  };
  attempt();
  return stop;
}

function useScrollRestoration(location) {
  const navigationType = useNavigationType();

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);

  // Remember where you are on each entry. Read the entry from history at the
  // moment of scrolling: the browser also scrolls while one page replaces
  // another, and that must not overwrite the page you just left.
  useEffect(() => {
    let frame = 0;
    const save = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        scrollPositions.set(window.history.state?.key ?? "default", window.scrollY);
      });
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", save);
    };
  }, []);

  useLayoutEffect(() => {
    if (navigationType === "POP" && scrollPositions.has(location.key)) {
      return restoreScroll(scrollPositions.get(location.key));
    }
    if (location.hash) {
      document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
      return undefined;
    }
    // Replacing the address in place (search box, tab in the URL) keeps your spot
    if (navigationType !== "REPLACE") window.scrollTo(0, 0);
    return undefined;
  }, [location.key, location.hash, navigationType]);
}
function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  useScrollRestoration(location);

  useEffect(() => {
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.("a[href]");
      if (!link) return;
      if ((link.target && link.target !== "_self") || link.hasAttribute("download") || "reload" in link.dataset) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // A jump to a spot on the same page
      if (url.hash && url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      navigate(url.pathname + url.search + url.hash);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate]);

  const pageKey = KEEP_ON_QUERY_CHANGE.includes(location.pathname)
    ? location.pathname
    : location.pathname + location.search;

  return (
    <>
      <Fragment key={pageKey}>
        <Outlet />
      </Fragment>
    </>
  );
}

export default AppShell;
