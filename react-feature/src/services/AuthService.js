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
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized (JWT expired or invalid)
      if (error.response.status === 401) {
        console.log('JWT token expired or invalid, redirecting to login...');
        
        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      // Handle 403 Forbidden
      if (error.response.status === 403) {
        console.log('Access forbidden, redirecting to login...');
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
    console.error('Error getting current user:', error);
    return null;
  }
};

export default api;
