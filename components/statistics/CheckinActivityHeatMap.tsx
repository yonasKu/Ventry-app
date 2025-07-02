import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Flame } from 'phosphor-react-native';

interface CheckinActivityHeatMapProps {
  data: number[][]; // 7 days (rows) x 24 hours (cols)
}

const CheckinActivityHeatMap: React.FC<CheckinActivityHeatMapProps> = ({ data }) => {
  const theme = useTheme();

  if (!data || data.length !== 7) {
    return (
      <Animated.View 
        style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary, borderRadius: theme.borderRadius.lg, ...theme.shadows.md }]}
        entering={FadeInDown.delay(100)}
      >
        <View style={styles.emptyContainer}>
          <Flame size={48} color={theme.colors.textTertiary} weight="light" />
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>
            Not enough check-in data available.
          </Text>
        </View>
      </Animated.View>
    );
  }

  const maxValue = Math.max(...data.flat(), 1);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = ['12a', '4a', '8a', '12p', '4p', '8p'];

  return (
    <Animated.View
      style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary, borderRadius: theme.borderRadius.lg, ...theme.shadows.md }]}
      entering={FadeInDown.delay(100)}
    >
      <View style={styles.container}>
        <View style={styles.dayLabels}>
          {days.map(day => <Text key={day} style={[styles.dayLabel, { color: theme.colors.textSecondary }]}>{day}</Text>)}
        </View>
        <View style={styles.gridContainer}>
          {data[0].map((_, colIndex) => {
            if (colIndex % 2 !== 0) return null; // Render every other column to make it more compact
            return (
              <View key={colIndex} style={styles.column}>
                {data.map((dayData, dayIndex) => (
                  <View
                    key={`${dayIndex}-${colIndex}`}
                    style={[
                      styles.cell,
                      { 
                        backgroundColor: theme.colors.primary,
                        opacity: dayData[colIndex] > 0 ? 0.1 + (dayData[colIndex] / maxValue) * 0.9 : 0.05,
                      }
                    ]}
                  />
                ))}
              </View>
            )
          })}
        </View>
      </View>
      <View style={styles.hourLabels}>
        {hours.map((hour, index) => <Text key={index} style={[styles.hourLabel, { color: theme.colors.textSecondary }]}>{hour}</Text>)}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  container: {
    flexDirection: 'row',
  },
  dayLabels: {
    justifyContent: 'space-around',
    paddingRight: 10,
  },
  dayLabel: {
    fontSize: 10,
    height: 12, // Set fixed height
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    justifyContent: 'space-around',
  },
  cell: {
    width: 12,  // More compact cell size
    height: 12, // More compact cell size
    borderRadius: 2,
  },
  hourLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 22, // Adjust alignment with grid
    paddingRight: 5,
    marginTop: 5,
  },
  hourLabel: {
    fontSize: 10,
  },
  emptyContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CheckinActivityHeatMap; 