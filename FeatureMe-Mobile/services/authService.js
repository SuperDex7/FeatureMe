import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (username, password) => {
  try {
    const response = await api.post('/user/auth/login', {
      username: username,
      password: password
    });
    
    if (response.status === 200) {
      // Store the JWT token in AsyncStorage
      // The token should be in response.data.token
      const token = response.data.token;
      
      if (token) {
        await AsyncStorage.setItem('authToken', token);
        
        // Create user object from response data
        const user = {
          userName: response.data.username,
          email: response.data.email,
          // Add other user fields as needed
        };
        
        return { success: true, user: user };
      } else {
        return { success: false, error: 'No token received from server' };
      }
    }
    
    return { success: false, error: 'Login failed' };
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle different types of errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return { success: false, error: 'Connection timeout. Please check your internet connection and try again.' };
    } else if (error.response?.status === 401) {
      return { success: false, error: 'Invalid username or password' };
    } else if (error.response?.status === 403) {
      return { success: false, error: 'Account is locked or disabled' };
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return { success: false, error: 'Cannot connect to server. Please check your internet connection.' };
    } else {
      return { success: false, error: `Login failed: ${error.message}` };
    }
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

export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return false;
    
    const response = await api.get('/user/me');
    return response.status === 200;
  } catch (error) {
    return false;
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
