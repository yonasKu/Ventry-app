import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

const StatsHeader = () => {
  const theme = useTheme();
  return (
    <View style={styles.headerContainer}>
      <Text style={[theme.typography.display, { color: theme.colors.textPrimary }]}>
        Statistics
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.xs }]}>
        Event data and insights
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 16,
    paddingHorizontal: 24,
  },
});

export default StatsHeader; 