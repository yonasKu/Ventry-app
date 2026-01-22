import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryVoronoiContainer, VictoryTooltip } from 'victory-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChartLine } from 'phosphor-react-native';

const { width } = Dimensions.get('window');

interface CheckinRateTrendChartProps {
  data: Array<{
    x: number; // Time in minutes from start
    y: number; // Check-in rate percentage
  }>;
  title: string;
}

const CheckinRateTrendChart: React.FC<CheckinRateTrendChartProps> = ({ data, title }) => {
  const theme = useTheme();

  if (!data || data.length < 2) {
    return (
      <Animated.View style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary, borderRadius: theme.borderRadius.lg, ...theme.shadows.md }]}>
        <Text style={[theme.typography.heading2, styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
        <View style={styles.emptyContainer}>
          <ChartLine size={48} color={theme.colors.textTertiary} weight="light" />
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>
            Not enough data to show trend.
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary, borderRadius: theme.borderRadius.lg, ...theme.shadows.md }]}
      entering={FadeInDown.delay(100)}
    >
      <Text style={[theme.typography.heading2, styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
      <VictoryChart
        width={width - 80}
        height={250}
        padding={{ top: 20, bottom: 50, left: 50, right: 30 }}
        containerComponent={
          <VictoryVoronoiContainer
            voronoiDimension="x"
            labels={({ datum }) => `Rate: ${Math.round(datum.y)}%\nTime: ${datum.x} min`}
            labelComponent={
              <VictoryTooltip
                cornerRadius={5}
                flyoutStyle={{ fill: theme.colors.backgroundSecondary, stroke: theme.colors.border }}
                style={{ fill: theme.colors.textPrimary, fontSize: 12 }}
              />
            }
          />
        }
      >
        <VictoryAxis
          label="Time from start (min)"
          style={{
            axisLabel: { padding: 30, fill: theme.colors.textSecondary },
            tickLabels: { fill: theme.colors.textSecondary, fontSize: 10, padding: 5 },
            grid: { stroke: theme.colors.border, strokeDasharray: '4, 4' },
          }}
        />
        <VictoryAxis
          dependentAxis
          label="Check-in Rate (%)"
          style={{
            axisLabel: { padding: 35, fill: theme.colors.textSecondary },
            tickLabels: { fill: theme.colors.textSecondary, fontSize: 10, padding: 5 },
            grid: { stroke: theme.colors.border, strokeDasharray: '4, 4' },
          }}
        />
        <VictoryLine
          data={data}
          style={{ data: { stroke: theme.colors.accent, strokeWidth: 3 } }}
          animate={{ duration: 1000 }}
        />
      </VictoryChart>
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
    textAlign: 'center',
    fontSize: 18,
  },
  emptyContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CheckinRateTrendChart; 