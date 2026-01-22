import 'react-native-gesture-handler';
import { ExpoRoot } from 'expo-router';
import { AppRegistry } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';

// Suppress Victory components defaultProps deprecation warnings
const originalConsoleError = console.error;
console.error = (message, ...args) => {
  if (typeof message === 'string' && message.includes('defaultProps will be removed from function components')) {
    return;
  }
  originalConsoleError(message, ...args);
};

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ExpoRoot context={ctx} />
    </GestureHandlerRootView>
  );
} 