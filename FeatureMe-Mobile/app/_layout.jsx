import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AudioProvider, useAudio } from '../contexts/AudioContext';
import CentralizedAudioPlayer from '../components/CentralizedAudioPlayer';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../services/api';

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

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AudioProvider>
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
