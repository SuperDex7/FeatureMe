import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// API Configuration for React Native
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.0.200:8080/api'  // Development - Your computer's IP
  : 'https://featureme.co/api';  // Production

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds timeout for slower networks and heavy queries
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token from AsyncStorage
api.interceptors.request.use(
  async (config) => {
    try {
      // If using FormData, delete Content-Type to let React Native set the boundary
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      
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

// Response interceptor to handle JWT expiration and banned users
api.interceptors.response.use(
  async (response) => {
    // Check if user is banned - logout silently if so
    if (response.config?.url?.includes('/user/me') && response.data?.role === 'BANNED') {
      await AsyncStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];
      // Use setTimeout to navigate after clearing storage (silent logout)
      setTimeout(async () => {
        try {
          const { router } = await import('expo-router');
          router.replace('/login');
        } catch (e) {
          // If router import fails, the auth guard will handle redirect
        }
      }, 0);
      return Promise.reject(new Error('User banned'));
    }
    return response;
  },
   
  async (error) => {
    // 401 on a request that carried a token = the server no longer accepts it
    // (expired, or the account is gone). Every other error (403 "not allowed",
    // 404, 500, no connection) belongs to the screen that made the request
    // and must not log anyone out.
    const url = error.config?.url || '';
    const sentToken = Boolean(error.config?.headers?.Authorization);
    // (/user/me at startup is handled by TokenValidator in app/_layout.jsx)
    if (error.response?.status === 401 && sentToken && !url.includes('/user/auth/') && !url.includes('/user/me')) {
      await endSession();
    }
    return Promise.reject(error);
  }
);

// Several requests can fail at once when a session ends; react once
let endingSession = false;
async function endSession() {
  if (endingSession) return;
  endingSession = true;
  try {
    await AsyncStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
    Alert.alert('Your session expired', 'Log in again to pick up where you left off.', [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Log in',
        onPress: async () => {
          try {
            const { router } = await import('expo-router');
            router.push('/login');
          } catch (e) {
            // The auth guard will send them to login
          }
        },
      },
    ]);
  } finally {
    // Allow the prompt again after the next login
    setTimeout(() => { endingSession = false; }, 5000);
  }
}

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
    // Try to call logout endpoint
    await api.post('/user/auth/logout');
  } catch (error) {
    console.error('Error during logout API call:', error);
    // Continue with local cleanup even if API call fails
  } finally {
    // Always clear local storage regardless of API success/failure
    await AsyncStorage.removeItem('authToken');
    // Clear axios auth header
    delete api.defaults.headers.common['Authorization'];
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/user/me');
    // Check if user is banned - logout silently if so
    if (response.data?.role === 'BANNED') {
      await AsyncStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];
      // Use setTimeout to navigate after clearing storage (silent logout)
      setTimeout(async () => {
        try {
          const { router } = await import('expo-router');
          router.replace('/login');
        } catch (e) {
          // If router import fails, the auth guard will handle redirect
        }
      }, 0);
      return null;
    }
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
