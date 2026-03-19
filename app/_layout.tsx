import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { useColorScheme } from "@/components/useColorScheme";
import { ThemeProvider } from "@/context/ThemeContext";
import { EventProvider } from "@/context/EventContext";
import { initDatabase } from "../services/DatabaseService";
import NotificationService from "../services/NotificationService";
import '../i18n/config'; // Initialize i18n
import { Toaster } from 'sonner-native';

// Initialize the database on app startup
try {
  console.log("Starting database initialization...");
  initDatabase();
  console.log("Database initialized successfully on app start.");
} catch (error) {
  console.error("CRITICAL: Failed to initialize database on app start:", error);
  // Depending on your app's needs, you might want to show an error message
  // or prevent the app from fully loading if the DB is essential.
}

// Initialize notification service
try {
  console.log("Initializing notification service...");
  NotificationService.initialize();
  console.log("Notification service initialized successfully.");
} catch (error) {
  console.error("Failed to initialize notification service:", error);
}

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  console.log("Rendering RootLayout component");
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });
  console.log("Fonts loaded:", loaded, "Font error:", error ? error.message : 'none');

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      console.log("Fonts loaded, hiding splash screen");
      SplashScreen.hideAsync().catch(e => console.log("Error hiding splash screen:", e));
    }
  }, [loaded]);

  if (!loaded) {
    console.log("Fonts not loaded yet, returning null");
    return null;
  }
  console.log("Fonts loaded, proceeding to render RootLayoutNav");

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  console.log("Rendering RootLayoutNav component");
  const colorScheme = useColorScheme();
  console.log("Color scheme:", colorScheme);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <EventProvider>
            <BottomSheetModalProvider>
              <NavigationThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                  <Stack.Screen
                    name="create-event"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen name="event" options={{ headerShown: false }} />
                </Stack>
                <Toaster />
              </NavigationThemeProvider>
            </BottomSheetModalProvider>
          </EventProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
