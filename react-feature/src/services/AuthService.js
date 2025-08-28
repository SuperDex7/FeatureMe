import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 60000, // Increased to 60 seconds for file uploads
});

// Request interceptor to add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle JWT expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized (JWT expired or invalid)
      if (error.response.status === 401) {
        console.log('JWT token expired or invalid, redirecting to login...');
        
        // Clear the expired token
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('user');
        
        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      // Handle 403 Forbidden
      if (error.response.status === 403) {
        console.log('Access forbidden, redirecting to login...');
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      // Handle 500 Internal Server Error that might be JWT-related
      if (error.response.status === 500) {
        const errorMessage = error.response.data || '';
        if (typeof errorMessage === 'string' && (
          errorMessage.includes('JWT expired') || 
          errorMessage.includes('JWT token expired') ||
          errorMessage.includes('ExpiredJwtException') ||
          errorMessage.includes('Invalid JWT token') ||
          errorMessage.includes('JWT authentication failed')
        )) {
          console.log('JWT-related 500 error detected, redirecting to login...');
          
          // Clear the expired token
          localStorage.removeItem('jwtToken');
          localStorage.removeItem('user');
          
          // Redirect to login page
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper functions
export const isAuthenticated = () => {
  const token = localStorage.getItem('jwtToken');
  if (!token) return false;
  
  // Check if token is expired
  if (isTokenExpired(token)) {
    console.log('Token is expired, logging out...');
    logout();
    return false;
  }
  
  return true;
};

export const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return true; // Consider invalid tokens as expired
  }
};

// Start periodic token validation
export const startTokenValidation = () => {
  // Check token every 5 minutes
  setInterval(() => {
    const token = localStorage.getItem('jwtToken');
    if (token && isTokenExpired(token)) {
      console.log('Periodic check: Token expired, logging out...');
      logout();
    }
  }, 5 * 60 * 1000); // 5 minutes
};

export const logout = () => {
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const getToken = () => {
  return localStorage.getItem('jwtToken');
};

export default api;
