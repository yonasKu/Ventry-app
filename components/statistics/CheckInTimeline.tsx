import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { useTheme } from '@/context/ThemeContext';
import { Attendee } from '@/models/Attendee';
import { format, parseISO } from 'date-fns';

interface CheckInTimelineProps {
  attendees: Attendee[];
  eventDate: string;
}

export default function CheckInTimeline({ attendees, eventDate }: CheckInTimelineProps) {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;

  // Group check-ins by hour
  const hourlyData = useMemo(() => {
    const checkedInAttendees = attendees.filter(a => a.checked_in && a.check_in_time);
    
    if (checkedInAttendees.length === 0) {
      return [];
    }

    // Create hourly buckets
    const hourlyBuckets: { [key: string]: number } = {};
    
    checkedInAttendees.forEach(attendee => {
      if (attendee.check_in_time) {
        try {
          const checkInDate = parseISO(attendee.check_in_time);
          const hour = format(checkInDate, 'HH:00');
          hourlyBuckets[hour] = (hourlyBuckets[hour] || 0) + 1;
        } catch (error) {
          console.error('Error parsing check-in time:', error);
        }
      }
    });

    // Convert to array format for Victory
    return Object.entries(hourlyBuckets)
      .map(([hour, count]) => ({
        x: hour,
        y: count,
      }))
      .sort((a, b) => a.x.localeCompare(b.x));
  }, [attendees]);

  if (hourlyData.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Check-in Timeline
        </Text>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No check-in data available yet
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        Check-in Timeline
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Hourly breakdown of check-ins
      </Text>
      
      <VictoryChart
        width={screenWidth - 64}
        height={220}
        theme={VictoryTheme.material}
        domainPadding={{ x: 20 }}
      >
        <VictoryAxis
          style={{
            axis: { stroke: theme.colors.border },
            tickLabels: { 
              fill: theme.colors.textSecondary, 
              fontSize: 10,
              angle: -45,
              textAnchor: 'end',
            },
            grid: { stroke: 'transparent' },
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: theme.colors.border },
            tickLabels: { fill: theme.colors.textSecondary, fontSize: 10 },
            grid: { stroke: theme.colors.border, strokeDasharray: '4,4', opacity: 0.3 },
          }}
        />
        <VictoryBar
          data={hourlyData}
          style={{
            data: { 
              fill: theme.colors.primary,
              width: 20,
            },
          }}
          cornerRadius={{ top: 4 }}
        />
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  emptyContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
