import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryVoronoiContainer, VictoryTooltip } from 'victory-native';
import { format } from 'date-fns';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { ChartLineUp } from 'phosphor-react-native';

const { width } = Dimensions.get('window');

interface AttendanceTrendChartProps {
  data: Array<{
    x: Date;
    y: number;
  }>;
}

const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({ data }) => {
  const theme = useTheme();

  if (data.length < 2) {
    return (
      <Animated.View 
        style={[styles.chartCard, { backgroundColor: theme.colors.backgroundPrimary, borderRadius: theme.borderRadius.lg, ...theme.shadows.md }]}
        entering={FadeInDown.delay(200).springify()}
        layout={Layout.springify()}
      >
        <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary }]}>
          Attendance Trends
        </Text>
        <View style={styles.emptyChartContainer}>
          <ChartLineUp size={48} color={theme.colors.textTertiary} weight="light" />
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>
            Not enough data to show trends
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[styles.chartCard, { backgroundColor: theme.colors.backgroundPrimary, borderRadius: theme.borderRadius.lg, ...theme.shadows.md }]}
      entering={FadeInDown.delay(200).springify()}
      layout={Layout.springify()}
    >
      <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary, marginBottom: theme.spacing.md }]}>
        Attendance Trends
      </Text>
      <VictoryChart
        width={width - 64}
        height={250}
        padding={{ top: 20, bottom: 50, left: 50, right: 30 }}
        containerComponent={
          <VictoryVoronoiContainer
            voronoiDimension="x"
            labels={({ datum }) => `Attendees: ${datum.y}\nDate: ${format(datum.x, 'MMM d, yy')}`}
            labelComponent={
              <VictoryTooltip
                cornerRadius={5}
                flyoutStyle={{
                  fill: theme.colors.backgroundSecondary,
                  stroke: theme.colors.border,
                  strokeWidth: 1,
                }}
                style={{ fill: theme.colors.textPrimary, fontSize: 12 }}
              />
            }
          />
        }
      >
        <VictoryAxis
          tickFormat={(date) => format(date, 'MMM yy')}
          style={{
            axis: { stroke: 'transparent' },
            tickLabels: { fill: theme.colors.textSecondary, fontSize: 10, padding: 5 },
            grid: { stroke: theme.colors.border, strokeDasharray: '4, 4' },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(tick) => `${tick}`}
          style={{
            axis: { stroke: 'transparent' },
            tickLabels: { fill: theme.colors.textSecondary, fontSize: 10, padding: 5 },
            grid: { stroke: theme.colors.border, strokeDasharray: '4, 4' },
          }}
        />
        <VictoryLine
          data={data}
          style={{
            data: { stroke: theme.colors.primary, strokeWidth: 3 },
          }}
          animate={{
            duration: 1000,
            onLoad: { duration: 500 },
          }}
        />
      </VictoryChart>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    padding: 20,
    marginBottom: 20,
  },
  emptyChartContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AttendanceTrendChart; 