import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { TrendUp, Clock, UserMinus, CalendarCheck } from 'phosphor-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Attendee } from '@/models/Attendee';
import { format, parseISO, differenceInMinutes } from 'date-fns';

interface PeakCheckInInsightsProps {
  attendees: Attendee[];
  eventDate: string;
  eventTime: string;
}

export default function PeakCheckInInsights({ attendees, eventDate, eventTime }: PeakCheckInInsightsProps) {
  const theme = useTheme();

  const insights = useMemo(() => {
    const checkedInAttendees = attendees.filter(a => a.checked_in && a.check_in_time);
    const totalAttendees = attendees.length;
    const noShowCount = attendees.filter(a => !a.checked_in).length;
    const noShowRate = totalAttendees > 0 ? ((noShowCount / totalAttendees) * 100).toFixed(1) : '0';

    if (checkedInAttendees.length === 0) {
      return {
        peakHour: 'N/A',
        peakCount: 0,
        lateArrivals: 0,
        lateArrivalRate: '0',
        noShowRate,
        avgCheckInTime: 'N/A',
      };
    }

    // Calculate peak hour
    const hourlyBuckets: { [key: string]: number } = {};
    checkedInAttendees.forEach(attendee => {
      if (attendee.check_in_time) {
        try {
          const checkInDate = parseISO(attendee.check_in_time);
          const hour = format(checkInDate, 'h a');
          hourlyBuckets[hour] = (hourlyBuckets[hour] || 0) + 1;
        } catch (error) {
          console.error('Error parsing check-in time:', error);
        }
      }
    });

    const peakEntry = Object.entries(hourlyBuckets).sort((a, b) => b[1] - a[1])[0];
    const peakHour = peakEntry ? peakEntry[0] : 'N/A';
    const peakCount = peakEntry ? peakEntry[1] : 0;

    // Calculate late arrivals (checked in after event start time)
    const [hours, minutes] = eventTime.split(':').map(Number);
    const eventDateTime = new Date(eventDate);
    eventDateTime.setHours(hours, minutes, 0);

    const lateArrivals = checkedInAttendees.filter(attendee => {
      if (!attendee.check_in_time) return false;
      try {
        const checkInDate = parseISO(attendee.check_in_time);
        return checkInDate > eventDateTime;
      } catch (error) {
        return false;
      }
    }).length;

    const lateArrivalRate = checkedInAttendees.length > 0 
      ? ((lateArrivals / checkedInAttendees.length) * 100).toFixed(1)
      : '0';

    // Calculate average check-in time relative to event start
    const avgMinutesFromStart = checkedInAttendees.reduce((sum, attendee) => {
      if (!attendee.check_in_time) return sum;
      try {
        const checkInDate = parseISO(attendee.check_in_time);
        const diff = differenceInMinutes(checkInDate, eventDateTime);
        return sum + diff;
      } catch (error) {
        return sum;
      }
    }, 0) / checkedInAttendees.length;

    const avgCheckInTime = avgMinutesFromStart < 0 
      ? `${Math.abs(Math.round(avgMinutesFromStart))} min early`
      : `${Math.round(avgMinutesFromStart)} min late`;

    return {
      peakHour,
      peakCount,
      lateArrivals,
      lateArrivalRate,
      noShowRate,
      avgCheckInTime,
    };
  }, [attendees, eventDate, eventTime]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        Check-in Insights
      </Text>

      <View style={styles.insightsGrid}>
        {/* Peak Hour */}
        <View style={[styles.insightCard, { backgroundColor: `${theme.colors.primary}10` }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
            <TrendUp size={20} color="white" weight="bold" />
          </View>
          <Text style={[styles.insightValue, { color: theme.colors.textPrimary }]}>
            {insights.peakHour}
          </Text>
          <Text style={[styles.insightLabel, { color: theme.colors.textSecondary }]}>
            Peak Hour ({insights.peakCount} check-ins)
          </Text>
        </View>

        {/* Average Check-in Time */}
        <View style={[styles.insightCard, { backgroundColor: `${theme.colors.accent}10` }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.accent }]}>
            <Clock size={20} color="white" weight="bold" />
          </View>
          <Text style={[styles.insightValue, { color: theme.colors.textPrimary }]}>
            {insights.avgCheckInTime}
          </Text>
          <Text style={[styles.insightLabel, { color: theme.colors.textSecondary }]}>
            Avg Check-in Time
          </Text>
        </View>

        {/* Late Arrivals */}
        <View style={[styles.insightCard, { backgroundColor: '#FFA50020' }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#FFA500' }]}>
            <CalendarCheck size={20} color="white" weight="bold" />
          </View>
          <Text style={[styles.insightValue, { color: theme.colors.textPrimary }]}>
            {insights.lateArrivals}
          </Text>
          <Text style={[styles.insightLabel, { color: theme.colors.textSecondary }]}>
            Late Arrivals ({insights.lateArrivalRate}%)
          </Text>
        </View>

        {/* No-Show Rate */}
        <View style={[styles.insightCard, { backgroundColor: `${theme.colors.error}10` }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.error }]}>
            <UserMinus size={20} color="white" weight="bold" />
          </View>
          <Text style={[styles.insightValue, { color: theme.colors.textPrimary }]}>
            {insights.noShowRate}%
          </Text>
          <Text style={[styles.insightLabel, { color: theme.colors.textSecondary }]}>
            No-Show Rate
          </Text>
        </View>
      </View>
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
    marginBottom: 16,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  insightCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  insightLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
});
