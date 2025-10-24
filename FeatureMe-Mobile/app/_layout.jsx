import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{headerShown: false}} />
          <Stack.Screen name="signup" options={{headerShown: false}} />
          <Stack.Screen name="homepage" options={{headerShown: false}} />
          <Stack.Screen name="post" options={{ headerShown: false }} />
          <Stack.Screen name="feed" options={{ headerShown: false }} />
          <Stack.Screen name="spotlight" options={{ headerShown: false }} />
          <Stack.Screen name="my-posts" options={{ headerShown: false }} />
          <Stack.Screen name="liked-posts" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
