import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Animated, { Layout, FadeInDown } from 'react-native-reanimated';

type TimeFilter = 'week' | 'month' | 'year' | 'all';

interface TimeFilterProps {
  timeFilter: TimeFilter;
  setTimeFilter: (filter: TimeFilter) => void;
}

const TimeFilterComponent: React.FC<TimeFilterProps> = ({ timeFilter, setTimeFilter }) => {
  const theme = useTheme();
  const filters: TimeFilter[] = ['week', 'month', 'year', 'all'];

  return (
    <Animated.View 
      style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.lg }]}
      layout={Layout.springify()}
      entering={FadeInDown.delay(100)}
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter}
          onPress={() => setTimeFilter(filter)}
          style={[
            styles.filterButton,
            timeFilter === filter && { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, ...theme.shadows.sm },
          ]}
        >
          <Text
            style={[
              styles.filterText,
              { color: timeFilter === filter ? theme.colors.backgroundPrimary : theme.colors.textSecondary },
            ]}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 4,
    marginVertical: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'capitalize',
  },
});

export default TimeFilterComponent; 