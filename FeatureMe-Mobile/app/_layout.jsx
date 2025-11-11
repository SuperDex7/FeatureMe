import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AudioProvider, useAudio } from '../contexts/AudioContext';
import CentralizedAudioPlayer from '../components/CentralizedAudioPlayer';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const unstable_settings = {
  anchor: '(tabs)',
};

function GlobalAudioPlayer() {
  const { 
    currentTrack, 
    isPlaying, 
    isPlayerVisible,
    position, 
    duration, 
    hidePlayer,
    togglePlayPause, 
    seekTo, 
    setVolumeLevel 
  } = useAudio();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        // User not logged in
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  return (
    <CentralizedAudioPlayer
      isVisible={isPlayerVisible}
      currentTrack={currentTrack}
      onClose={hidePlayer}
      onPlayPause={togglePlayPause}
      isPlaying={isPlaying}
      position={position}
      duration={duration}
      volume={1}
      onVolumeChange={setVolumeLevel}
      onSeek={seekTo}
      currentUser={currentUser}
    />
  );
}

function UniversalLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    // Handle initial URL when app opens from a link
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    // Handle URLs when app is already running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    handleInitialURL();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url) => {
    try {
      // Parse the URL
      const parsedUrl = Linking.parse(url);
      const { hostname, path } = parsedUrl;

      // Only handle featureme.co links
      if (hostname === 'featureme.co' || hostname === 'www.featureme.co') {
        const pathSegments = path?.split('/').filter(Boolean) || [];

        if (pathSegments.length === 0) {
          // Root path - navigate to index
          router.replace('/');
          return;
        }

        const [firstSegment, ...rest] = pathSegments;

        switch (firstSegment) {
          case 'login':
            router.replace('/login');
            break;
          case 'signup':
            router.replace('/signup');
            break;
          case 'post':
            // /post/:id
            if (rest.length > 0) {
              router.replace(`/post/${rest[0]}`);
            }
            break;
          case 'profile':
            // /profile/:username
            if (rest.length > 0) {
              router.replace(`/profile/${rest[0]}`);
            }
            break;
          default:
            // Unknown path - navigate to index
            router.replace('/');
        }
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  };

  return null;
}

function TokenValidator() {
  const router = useRouter();
  
  useEffect(() => {
    const validateTokenOnStartup = async () => {
      try {
        // Check if token exists
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          // No token, user is not logged in - this is fine
          return;
        }
        
        // Token exists, validate it by calling /user/me
        try {
          const response = await api.get('/user/me');
          // If we get here, token is valid
          return;
        } catch (error) {
          // Token is invalid (401, 403, or other auth errors)
          if (error.response?.status === 401 || error.response?.status === 403) {
            // Clear invalid token and redirect to login
            await AsyncStorage.removeItem('authToken');
            delete api.defaults.headers.common['Authorization'];
            router.replace('/login');
          } else if (error.response?.status === 500) {
            const errorMessage = error.response.data || '';
            if (typeof errorMessage === 'string' && (
              errorMessage.includes('JWT expired') || 
              errorMessage.includes('JWT token expired') ||
              errorMessage.includes('ExpiredJwtException') ||
              errorMessage.includes('Invalid JWT token') ||
              errorMessage.includes('JWT authentication failed')
            )) {
              // Clear invalid token and redirect to login
              await AsyncStorage.removeItem('authToken');
              delete api.defaults.headers.common['Authorization'];
              router.replace('/login');
            }
          }
        }
      } catch (error) {
        console.error('Token validation error:', error);
        // On any error, clear token to be safe
        await AsyncStorage.removeItem('authToken');
        delete api.defaults.headers.common['Authorization'];
      }
    };
    
    validateTokenOnStartup();
  }, [router]);
  
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AudioProvider>
          <TokenValidator />
          <UniversalLinkHandler />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{headerShown: false}} />
            <Stack.Screen name="signup" options={{headerShown: false}} />
            <Stack.Screen name="main-app" options={{headerShown: false}} />
            <Stack.Screen name="homepage" options={{headerShown: false}} />
            <Stack.Screen name="post" options={{ headerShown: false }} />
            <Stack.Screen name="feed" options={{ headerShown: false }} />
            <Stack.Screen name="spotlight" options={{ headerShown: false }} />
            <Stack.Screen name="my-posts" options={{ headerShown: false }} />
            <Stack.Screen name="liked-posts" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="profile/[username]" options={{ headerShown: false }} />
            <Stack.Screen name="post/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="create-post" options={{ headerShown: false }} />
            <Stack.Screen name="user-search" options={{ headerShown: false }} />
            <Stack.Screen name="messages" options={{ headerShown: false }} />
            <Stack.Screen name="subscription" options={{ headerShown: false }} />
            <Stack.Screen name="pending-features" options={{ headerShown: false }} />
          </Stack>
          <GlobalAudioPlayer />
          <StatusBar style="auto" />
        </AudioProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
