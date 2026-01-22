import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ListChecks } from 'phosphor-react-native';

interface EventCompletion {
  name: string;
  checkedIn: number;
  total: number;
}

interface EventCompletionBarsProps {
  events: EventCompletion[];
  title: string;
}

const ProgressBar: React.FC<{ event: EventCompletion }> = ({ event }) => {
  const theme = useTheme();
  const percentage = event.total > 0 ? (event.checkedIn / event.total) * 100 : 0;
  const animatedWidth = useSharedValue(0);

  React.useEffect(() => {
    animatedWidth.value = withTiming(percentage, { duration: 1000 });
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedWidth.value}%`,
    };
  });

  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressLabels}>
        <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>{event.name}</Text>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{Math.round(percentage)}%</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
        <Animated.View style={[styles.progressBar, { backgroundColor: theme.colors.primary }, animatedStyle]} />
      </View>
    </View>
  );
};

const EventCompletionBars: React.FC<EventCompletionBarsProps> = ({ events, title }) => {
  const theme = useTheme();

  if (!events || events.length === 0) {
    return (
      <Animated.View style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary, borderRadius: theme.borderRadius.lg, ...theme.shadows.md }]}>
        <View style={styles.emptyContainer}>
          <ListChecks size={48} color={theme.colors.textTertiary} weight="light" />
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>
            No event completion data available.
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary, borderRadius: theme.borderRadius.lg, ...theme.shadows.md }]}
      entering={FadeInDown.delay(300)}
    >
      <Text style={[theme.typography.heading2, styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
      {events.map((event, index) => (
        <ProgressBar key={index} event={event} />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 20,
  },
  title: {
    marginBottom: 16,
    fontSize: 18,
  },
  emptyContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
});

export default EventCompletionBars; 