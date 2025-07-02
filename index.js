import 'react-native-gesture-handler';
import { ExpoRoot } from 'expo-router';
import { AppRegistry } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ExpoRoot context={ctx} />
    </GestureHandlerRootView>
  );
} 