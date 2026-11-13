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

// Response interceptor to handle JWT expiration and banned users
api.interceptors.response.use(
  (response) => {
    // Check if user is banned - logout silently if so
    if (response.config?.url?.includes('/user/me') && response.data?.role === 'BANNED') {
      window.location.href = '/login';
      return Promise.reject(new Error('User banned'));
    }
    return response;
  },
  
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
  
);

// Helper functions
export const isAuthenticated = async () => {
  try {
    // Shares the /user/me request with getCurrentUser (see fetchMe)
    await fetchMe();
    return true;
  } catch {
    return false;
  }
};

export const logout = async () => {
  try {
    meCache = null;
    // Call logout endpoint to clear server-side cookies
    await api.post('/user/auth/logout');
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    // Redirect to login page
    window.location.href = '/login';
  }
};

// /user/me is asked for by the header, the page and several components at
// once. Share one request (and reuse the answer for a few seconds) instead of
// sending the same call 3-6 times per page.
const ME_MAX_AGE = 10 * 1000;
let meCache = null; // { data, at }
let meRequest = null;

function fetchMe() {
  if (meCache && Date.now() - meCache.at < ME_MAX_AGE) return Promise.resolve(meCache.data);
  if (meRequest) return meRequest;
  meRequest = api.get('/user/me')
    .then((response) => {
      meCache = { data: response.data, at: Date.now() };
      return response.data;
    })
    .finally(() => { meRequest = null; });
  return meRequest;
}

/** Forget the cached current user (after changing your own profile, plan, etc.) */
export const forgetCurrentUser = () => {
  meCache = null;
};

async function currentUserOrNull() {
  try {
    const data = await fetchMe();
    // Check if user is banned - logout silently if so
    if (data?.role === 'BANNED') {
      window.location.href = '/login';
      return null;
    }
    // Each caller gets its own copy, so one can't change another's
    return data ? structuredClone(data) : data;
  } catch {
    // Not logged in (or offline): expected for visitors
    return null;
  }
}

export const getCurrentUser = () => currentUserOrNull();

// Same as getCurrentUser; never redirects to login
export const getCurrentUserSafe = () => currentUserOrNull();

export default api;
