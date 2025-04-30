import React from 'react';
import { Link, Tabs } from 'expo-router';
import { Pressable, Text, StyleSheet } from 'react-native';
import { House, CalendarBlank, CloudArrowDown, User } from 'phosphor-react-native';

import { useTheme } from '../../context/ThemeContext';

/**
 * TabBarIcon component using Phosphor icons
 */
function TabBarIcon(props: {
  icon: React.ReactNode;
}) {
  return (
    <React.Fragment>
      {props.icon}
    </React.Fragment>
  );
}

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.backgroundPrimary,
        },
        headerTitleStyle: {
          color: theme.colors.textPrimary,
          fontSize: theme.typography.heading2.fontSize,
          fontWeight: '600', // Using literal value instead of theme.typography.heading2.fontWeight
        },
        tabBarStyle: {
          backgroundColor: theme.colors.backgroundPrimary,
          borderTopColor: theme.colors.border,
        },
        headerRight: () => (
          <Text style={styles.offlineIndicator}>[OFFLINE]</Text>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ventry',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <TabBarIcon 
              icon={<House size={24} color={color} weight="regular" />} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => (
            <TabBarIcon 
              icon={<CalendarBlank size={24} color={color} weight="regular" />} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="backup"
        options={{
          title: 'Backup',
          tabBarIcon: ({ color }) => (
            <TabBarIcon 
              icon={<CloudArrowDown size={24} color={color} weight="regular" />} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => (
            <TabBarIcon 
              icon={<User size={24} color={color} weight="regular" />} 
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  offlineIndicator: {
    marginRight: 15,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
