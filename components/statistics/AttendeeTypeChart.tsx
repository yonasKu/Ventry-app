import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { VictoryChart, VictoryStack, VictoryBar, VictoryAxis } from 'victory-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { UserPlus } from 'phosphor-react-native';

const { width } = Dimensions.get('window');

interface AttendeeTypeChartProps {
  data: Array<{
    event: string;
    new: number;
    returning: number;
  }>;
}

const AttendeeTypeChart: React.FC<AttendeeTypeChartProps> = ({ data }) => {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Animated.View 
        style={[styles.chartCard, { backgroundColor: theme.colors.backgroundPrimary, borderRadius: theme.borderRadius.lg, ...theme.shadows.md }]}
        entering={FadeInDown.delay(200).springify()}
        layout={Layout.springify()}
      >
        <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary }]}>
          New vs. Returning Attendees
        </Text>
        <View style={styles.emptyChartContainer}>
          <UserPlus size={48} color={theme.colors.textTertiary} weight="light" />
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>
            Attendee type data is not available.
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
        New vs. Returning Attendees
      </Text>
      <VictoryChart
        width={width - theme.spacing.md * 2}
        height={300}
        domainPadding={{ x: 30 }}
        padding={{ top: 20, bottom: 70, left: 25, right: 50 }}
      >
        <VictoryAxis
          tickFormat={(x) => (x.length > 10 ? `${x.substring(0, 10)}...` : x)}
          style={{
            tickLabels: { angle: -45, textAnchor: 'end', fontSize: 10, padding: 5, fill: theme.colors.textSecondary },
            axis: { stroke: 'transparent' },
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
        <VictoryStack colorScale={[theme.colors.primary, theme.colors.accent]}>
          <VictoryBar
            data={data}
            x="event"
            y="new"
            barWidth={40}
          />
          <VictoryBar
            data={data}
            x="event"
            y="returning"
            barWidth={40}
          />
        </VictoryStack>
      </VictoryChart>
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.colors.primary }]} />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>New</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.colors.accent }]} />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Returning</Text>
        </View>
      </View>
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
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
});

export default AttendeeTypeChart; 