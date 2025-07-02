import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { TrendUp, Trophy, Clock } from 'phosphor-react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { format, parseISO } from 'date-fns';

interface EventInsightsProps {
  stats: {
    avgAttendeesPerEvent: number;
    mostPopularEvent?: {
      title: string;
      attendees_count?: number;
    };
    mostRecentEvent?: {
      title: string;
      date: string;
    };
  };
}

const EventInsights: React.FC<EventInsightsProps> = ({ stats }) => {
  const theme = useTheme();

  return (
    <Animated.View 
      style={[
        styles.insightsCard, 
        { 
          backgroundColor: theme.colors.backgroundPrimary,
          borderRadius: theme.borderRadius.lg,
          ...theme.shadows.md 
        }
      ]}
      entering={FadeInDown.delay(200).springify()}
      layout={Layout.springify()}
    >
      <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary }]}>
        Event Insights
      </Text>
      <View style={styles.insightRow}>
        <View style={[styles.insightIconContainer, { backgroundColor: `${theme.colors.accent}15` }]}>
          <TrendUp size={20} color={theme.colors.accent} weight="bold" />
        </View>
        <View style={styles.insightTextContainer}>
          <Text style={[theme.typography.body, { color: theme.colors.textPrimary, fontWeight: '600' }]}>
            Average Attendance
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            {stats.avgAttendeesPerEvent} attendees per event
          </Text>
        </View>
      </View>
      {stats.mostPopularEvent && (
        <View style={[styles.insightRow, { marginTop: theme.spacing.md }]}>
          <View style={[styles.insightIconContainer, { backgroundColor: `${theme.colors.accent}15` }]}>
            <Trophy size={20} color={theme.colors.accent} weight="bold" />
          </View>
          <View style={styles.insightTextContainer}>
            <Text style={[theme.typography.body, { color: theme.colors.textPrimary, fontWeight: '600' }]}>
              Most Popular Event
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              {stats.mostPopularEvent.title} ({stats.mostPopularEvent.attendees_count || 0} attendees)
            </Text>
          </View>
        </View>
      )}
      {stats.mostRecentEvent && (
        <View style={[styles.insightRow, { marginTop: theme.spacing.md }]}>
          <View style={[styles.insightIconContainer, { backgroundColor: `${theme.colors.accent}15` }]}>
            <Clock size={20} color={theme.colors.accent} weight="bold" />
          </View>
          <View style={styles.insightTextContainer}>
            <Text style={[theme.typography.body, { color: theme.colors.textPrimary, fontWeight: '600' }]}>
              Most Recent Event
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              {stats.mostRecentEvent.title} ({format(parseISO(stats.mostRecentEvent.date), 'MMM d, yyyy')})
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  insightsCard: {
    padding: 20,
    marginBottom: 20,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  insightIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
});

export default EventInsights; 