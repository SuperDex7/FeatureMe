import { useCallback, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { checkLogin, consumeSessionExpired, knownLoggedIn } from '../services/AuthService';

const ProtectedRoute = ({ children }) => {
  // Moving between pages in the app: skip the loading screen when we already know
  const [status, setStatus] = useState(() => (knownLoggedIn() ? 'in' : 'loading')); // loading | in | out | error
  const [notice, setNotice] = useState();
  const location = useLocation();

  const check = useCallback(async () => {
    const result = await checkLogin();
    if (result === 'out' && consumeSessionExpired()) {
      setNotice("Your session expired. Log in again to continue.");
    }
    setStatus(result);
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  if (status === 'loading') {
    return (
      <div className="fm-page fm-route-loading">
        <div className="fm-state" role="status">
          <div className="fm-spinner" />
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    // Server down or no connection: not a reason to log you out
    return (
      <div className="fm-page fm-route-loading">
        <div className="fm-state" role="alert">
          <h3>Can&apos;t reach FeatureMe</h3>
          <p>Check your connection and try again.</p>
          <button type="button" className="fm-btn fm-btn--primary" onClick={() => { setStatus('loading'); check(); }}>Try again</button>
        </div>
      </div>
    );
  }

  if (status === 'out') {
    // Back to this page after logging in
    return <Navigate to="/login" state={{ from: location, notice }} replace />;
  }

  return children;
};

export default ProtectedRoute;
