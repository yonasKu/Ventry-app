import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { VictoryPie, VictoryLabel } from 'victory-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { Users } from 'phosphor-react-native';

const { width } = Dimensions.get('window');

interface CheckInChartProps {
  data: Array<{
    x: string;
    y: number;
    color?: string;
  }>;
  stats: {
    totalAttendees: number;
    checkInRate: string;
  };
}

const CheckInChart: React.FC<CheckInChartProps> = ({ data, stats }) => {
  const theme = useTheme();
  
  if (stats.totalAttendees === 0) {
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
        entering={FadeInDown.delay(300).springify()}
        layout={Layout.springify()}
      >
        <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary }]}>
          Check-in Distribution
        </Text>
        <View style={styles.emptyChartContainer}>
          <Users size={48} color={theme.colors.textTertiary} weight="light" />
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>
            No attendee data in this period
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
      entering={FadeInDown.delay(300).springify()}
      layout={Layout.springify()}
    >
      <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary }]}>
        Check-in Distribution
      </Text>
      <View style={styles.pieContainer}>
        <VictoryPie
          data={data}
          colorScale={data.map(d => d.color || theme.colors.primary)}
          width={width - 64}
          height={220}
          innerRadius={70}
          labelRadius={100}
          style={{
            labels: {
              fill: theme.colors.textSecondary,
              fontSize: 12
            }
          }}
          labelComponent={
            <VictoryLabel
              style={{ fill: theme.colors.textSecondary, fontSize: 12 }}
              text={({ datum }) => `${datum.x}: ${Math.round((datum.y / stats.totalAttendees) * 100)}%`}
            />
          }
        />
        <View style={styles.centerLabel}>
          <Text style={[theme.typography.heading1, { color: theme.colors.primary }]}>
            {stats.checkInRate}%
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            Check-in Rate
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
  pieContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  centerLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 100,
    height: 100,
    marginLeft: -50,
    marginTop: -40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CheckInChart; 