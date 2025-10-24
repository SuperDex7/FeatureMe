import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { isAuthenticated as checkAuthStatus } from '../services/authService';

export default function AuthGuard({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuth] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authStatus = await checkAuthStatus();
      setIsAuth(authStatus);
      
      if (!authStatus) {
        // Redirect to login if not authenticated
        router.replace('/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/login');
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7f53ac" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return children;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0b0f',
  },
  loadingText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
  },
});
