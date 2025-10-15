import axios from 'axios';
import { apiConfig } from '../config/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout, // Increased to 60 seconds for file uploads
  withCredentials: true, // Enable cookies for all requests
});

// Request interceptor - no need to manually add JWT token since it's in cookies
api.interceptors.request.use(
  (config) => {
    // Cookies are automatically sent with requests when withCredentials: true
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
  /* 
  (error) => {
    if (error.response) {
      // Don't redirect to login for public endpoints or when checking authentication
      const url = error.config?.url || '';
      const isPublicEndpoint = url.includes('/posts/get/') || 
                              url.includes('/posts/view/') || 
                              url.includes('/posts/download/') ||
                              url.includes('/posts/views/') ||
                              url.includes('/posts/downloads/') ||
                              url.includes('/posts/comments/') ||
                              url.includes('/posts/likes/');
      
      const isAuthCheck = url.includes('/user/me');
      
      // Handle 401 Unauthorized (JWT expired or invalid)
      if (error.response.status === 401 && !isPublicEndpoint && !isAuthCheck) {
        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      // Handle 403 Forbidden
      if (error.response.status === 403 && !isPublicEndpoint && !isAuthCheck) {
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
        ) && !isPublicEndpoint && !isAuthCheck) {
          
          // Redirect to login page
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
    }
    
    return Promise.reject(error);
  }
  */
);

// Helper functions
export const isAuthenticated = async () => {
  try {
    // Make a request to /me endpoint to check if user is authenticated
    const response = await api.get('/user/me');
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

export const logout = async () => {
  try {
    // Call logout endpoint to clear server-side cookies
    await api.post('/user/auth/logout');
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    // Redirect to login page
    window.location.href = '/login';
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/user/me');
    return response.data;
  } catch (error) {
    // Don't log errors for anonymous users - this is expected behavior
    return null;
  }
};

// Safe version that never redirects to login
export const getCurrentUserSafe = async () => {
  try {
    const response = await api.get('/user/me');
    return response.data;
  } catch (error) {
    // Silently return null for anonymous users
    return null;
  }
};

export default api;
