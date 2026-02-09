import React from 'react';
import { Slot } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import CustomBottomNavigation from '../../components/CustomBottomNavigation';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.backgroundPrimary }} edges={['top']}>
      {/* Header */}
      {/* <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <Text 
          style={[styles.headerTitle, { 
            color: theme.colors.textPrimary,
            fontSize: theme.typography.heading2.fontSize,
            fontWeight: '600',
          }]}
        >
          Ventry
        </Text>
        <Text style={styles.offlineIndicator}>[OFFLINE]</Text>
      </View> */}
      
      {/* Main content with bottom padding for navigation */}
      <View style={styles.contentContainer}>
        <Slot />
      </View>
      
      {/* Custom bottom navigation */}
      <CustomBottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingBottom: 80, // Increased padding to prevent content from being hidden behind the navigation bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  offlineIndicator: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
