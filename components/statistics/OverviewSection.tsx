import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ArrowUp, ArrowDown, Calendar, Users, CheckCircle } from 'phosphor-react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

interface OverviewSectionProps {
  stats: {
    totalEvents: number;
    totalAttendees: number;
    checkInRate: string;
    eventsGrowth: string;
    eventsGrowthPositive: boolean;
    activeEvents: number;
  };
}

const OverviewSection: React.FC<OverviewSectionProps> = ({ stats }) => {
  const theme = useTheme();

  return (
    <Animated.View 
      style={[
        styles.summaryCard, 
        { 
          backgroundColor: theme.colors.backgroundPrimary,
          borderRadius: theme.borderRadius.lg,
          ...theme.shadows.md
        }
      ]}
      entering={FadeInDown.delay(150).springify()}
      layout={Layout.springify()}
    >
      <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary, marginBottom: theme.spacing.md }]}>
        Overview
      </Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
            <Calendar size={24} color={theme.colors.primary} weight="bold" />
          </View>
          <Text style={[theme.typography.heading1, { color: theme.colors.primary }]}>
            {stats.totalEvents}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            Events
          </Text>
          {Number(stats.eventsGrowth) !== 0 && (
            <View 
              style={[
                styles.growthBadge, 
                { 
                  backgroundColor: stats.eventsGrowthPositive 
                    ? `${theme.colors.success}15` 
                    : `${theme.colors.error}15` 
                }
              ]}
            >
              {stats.eventsGrowthPositive 
                ? <ArrowUp size={12} color={theme.colors.success} /> 
                : <ArrowDown size={12} color={theme.colors.error} />
              }
              <Text 
                style={[
                  styles.growthText, 
                  { 
                    color: stats.eventsGrowthPositive 
                      ? theme.colors.success 
                      : theme.colors.error
                  }
                ]}
              >
                {stats.eventsGrowth}%
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
            <Users size={24} color={theme.colors.primary} weight="bold" />
          </View>
          <Text style={[theme.typography.heading1, { color: theme.colors.primary }]}>
            {stats.totalAttendees}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            Attendees
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
            <CheckCircle size={24} color={theme.colors.primary} weight="bold" />
          </View>
          <Text style={[theme.typography.heading1, { color: theme.colors.primary }]}>
            {stats.checkInRate}%
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            Check-in Rate
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <View style={[styles.summaryIconContainer, { backgroundColor: `${theme.colors.accent}15` }]}>
            <Calendar size={24} color={theme.colors.accent} weight="bold" />
          </View>
          <Text style={[theme.typography.heading1, { color: theme.colors.accent }]}>
            {stats.activeEvents}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            Active
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    padding: 15,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  growthText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
});

export default OverviewSection; 