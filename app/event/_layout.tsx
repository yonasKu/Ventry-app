import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';

export default function EventLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen 
        name="[id]" 
        options={{
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
      <Stack.Screen 
        name="add-attendee/[id]" 
        options={{
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
      <Stack.Screen 
        name="attendee-details/[id]" 
        options={{
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
      <Stack.Screen 
        name="attendee-qr/[id]" 
        options={{
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
      <Stack.Screen 
        name="attendees/[id]" 
        options={{
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
      <Stack.Screen 
        name="check-in/[id]" 
        options={{
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
      <Stack.Screen 
        name="custom-fields/[id]" 
        options={{
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
      <Stack.Screen 
        name="custom-fields/add/[id]" 
        options={{
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
      <Stack.Screen 
        name="custom-fields/templates/[id]" 
        options={{
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
      <Stack.Screen 
        name="edit/[id]" 
        options={{
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
      <Stack.Screen 
        name="export/[id]" 
        options={{
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
      <Stack.Screen 
        name="import-attendees/[id]" 
        options={{
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
      <Stack.Screen 
        name="qr/[id]" 
        options={{
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
      <Stack.Screen 
        name="scan-qr/[id]" 
        options={{
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
    </Stack>
  );
}