import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration for React Native
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.0.200:8080/api'  // Development - Your computer's IP
  : 'https://FeatureMe.com/api';  // Production

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout for faster fallback to demo mode
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token from AsyncStorage
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
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
  async (error) => {
    if (error.response) {
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
        // Clear stored token and redirect to login
        await AsyncStorage.removeItem('authToken');
        // You can dispatch a navigation action here if using Redux/Context
        return Promise.reject(error);
      }
      
      // Handle 403 Forbidden
      if (error.response.status === 403 && !isPublicEndpoint && !isAuthCheck) {
        await AsyncStorage.removeItem('authToken');
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
          await AsyncStorage.removeItem('authToken');
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
    const response = await api.get('/user/me');
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

export const logout = async () => {
  try {
    await api.post('/user/auth/logout');
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    await AsyncStorage.removeItem('authToken');
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/user/me');
    return response.data;
  } catch (error) {
    return null;
  }
};

// Safe version that never redirects to login
export const getCurrentUserSafe = async () => {
  try {
    const response = await api.get('/user/me');
    return response.data;
  } catch (error) {
    return null;
  }
};

export default api;
