import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryLabel } from 'victory-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { Calendar } from 'phosphor-react-native';

const { width } = Dimensions.get('window');

interface EventsBarChartProps {
  data: Array<{
    x: string;
    y: number;
    checkedIn: number;
    checkInRate: string;
  }>;
  customTheme: any;
}

const EventsBarChart: React.FC<EventsBarChartProps> = ({ data, customTheme }) => {
  const theme = useTheme();
  
  if (data.length === 0) {
    return (
      <Animated.View 
        style={[
          styles.chartCard, 
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
          Recent Events
        </Text>
        <View style={styles.emptyChartContainer}>
          <Calendar size={48} color={theme.colors.textTertiary} weight="light" />
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>
            No events in this period
          </Text>
        </View>
      </Animated.View>
    );
  }
  
  return (
    <Animated.View 
      style={[
        styles.chartCard, 
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
        Recent Events
      </Text>
      
      <View style={{ height: 320 }}>
        <VictoryChart
          width={width - 64}
          height={320}
          domainPadding={{ x: [20, 20] }}
          padding={{ left: 50, right: 50, bottom: 50, top: 30 }}
          theme={customTheme}
        >
          <VictoryAxis
            tickFormat={(t) => t}
            style={{
              tickLabels: { angle: -45, textAnchor: 'end', fontSize: 8, padding: 5 }
            }}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(tick) => tick}
            style={{
              grid: { stroke: theme.colors.border, strokeDasharray: '5,5' }
            }}
          />
          <VictoryBar
            data={data}
            x="x"
            y="y"
            cornerRadius={{ topLeft: 4, topRight: 4 }}
            barWidth={20}
            labels={({ datum }) => `${datum.checkedIn}/${datum.y}\n${datum.checkInRate}%`}
            style={{
              data: { fill: ({ datum }) => {
                // Use linear gradient for bars
                return `url(#${datum.x.replace(/\s+/g, '')})`;
              }},
              labels: { fill: theme.colors.textPrimary, fontSize: 10 }
            }}
            labelComponent={
              <VictoryLabel
                dy={-10}
                backgroundStyle={{ fill: theme.colors.backgroundPrimary, opacity: 0.7 }}
                backgroundPadding={{ top: 2, bottom: 2, left: 4, right: 4 }}
              />
            }
          />
        </VictoryChart>

        {data.map((item) => (
          <LinearGradient
            key={item.x}
            id={item.x.replace(/\s+/g, '')}
            colors={[theme.colors.primary, theme.colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        ))}
      </View>
      
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.legendColor}
          />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
            Total Attendees
          </Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
            (Checked In/Total • Rate%)
          </Text>
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
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
});

export default EventsBarChart; 