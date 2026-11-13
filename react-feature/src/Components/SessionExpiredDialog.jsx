import { useEffect, useState } from "react";
import Dialog from "./ui/Dialog";
import { onSessionExpired, consumeSessionExpired } from "../services/AuthService";

const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];
// The landing page already offers "Log in"
const onAuthPage = (pathname) => pathname === "/" || AUTH_PAGES.some((page) => pathname.startsWith(page));

// Shown when your login runs out while you're using the site. Lives outside
// the routes (see main.jsx), so it takes the router to navigate.
function SessionExpiredDialog({ router }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stopListening = onSessionExpired(() => {
      if (!onAuthPage(router.state.location.pathname)) setOpen(true);
    });
    // Close it if something else already took you to the login page
    const stopWatching = router.subscribe((state) => {
      if (onAuthPage(state.location.pathname)) setOpen(false);
    });
    return () => {
      stopListening();
      stopWatching();
    };
  }, [router]);

  const close = () => {
    consumeSessionExpired();
    setOpen(false);
  };

  const logIn = () => {
    const { pathname, search } = router.state.location;
    close();
    router.navigate("/login", { state: { from: { pathname: pathname + search } } });
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Your session expired"
      size="sm"
      footer={
        <>
          <button type="button" className="fm-btn fm-btn--secondary" onClick={close}>Not now</button>
          <button type="button" className="fm-btn fm-btn--primary" onClick={logIn} data-autofocus>Log in</button>
        </>
      }
    >
      <p>You&apos;ve been logged out. Log in again to pick up where you left off.</p>
    </Dialog>
  );
}

export default SessionExpiredDialog;
