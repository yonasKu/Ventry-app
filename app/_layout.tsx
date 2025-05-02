import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { ThemeProvider } from '@/context/ThemeContext';
import { EventProvider } from '@/context/EventContext';
import { initDatabase } from '../services/DatabaseService';

// Initialize the database on app startup
try {
  initDatabase();
  console.log("Database initialized successfully on app start.");
} catch (error) {
  console.error("CRITICAL: Failed to initialize database on app start:", error);
  // Depending on your app's needs, you might want to show an error message
  // or prevent the app from fully loading if the DB is essential.
}

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider>
      <EventProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            <Stack.Screen name="create-event" options={{ headerShown: false }} />
            <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="event/edit/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="event/check-in/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="event/attendees/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="event/qr/[id]" options={{ headerShown: false }} />
          </Stack>
        </NavigationThemeProvider>
      </EventProvider>
    </ThemeProvider>
  );
}
