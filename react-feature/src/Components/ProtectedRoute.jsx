import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, startTokenValidation } from '../services/AuthService';

const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);
      setIsLoading(false);
      
      // Start periodic token validation if authenticated
      if (authenticated) {
        startTokenValidation();
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    // Redirect to login page with the current location as state
    // This allows the login page to redirect back after successful login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
