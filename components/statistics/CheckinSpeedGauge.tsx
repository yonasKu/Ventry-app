import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { VictoryPie, VictoryLabel } from 'victory-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Gauge } from 'phosphor-react-native';

interface CheckinSpeedGaugeProps {
  value: number;
  label: string;
  unit: string;
}

const CheckinSpeedGauge: React.FC<CheckinSpeedGaugeProps> = ({ value, label, unit }) => {
  const theme = useTheme();
  const maxValue = 100; // Assuming a max value for the gauge, e.g., 100 check-ins/min
  const percentage = Math.min((value / maxValue) * 100, 100);

  const data = [
    { x: 1, y: percentage },
    { x: 2, y: 100 - percentage },
  ];

  if (!value || value <= 0) {
    return (
      <Animated.View style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary, borderRadius: theme.borderRadius.lg, ...theme.shadows.md }]}>
        <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary, textAlign: 'center' }]}>{label}</Text>
        <View style={styles.emptyContainer}>
          <Gauge size={48} color={theme.colors.textTertiary} weight="light" />
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>No data</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary, borderRadius: theme.borderRadius.lg, ...theme.shadows.md }]}
      entering={FadeInDown.delay(200)}
    >
      <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary, textAlign: 'center' }]}>{label}</Text>
      <View style={styles.chartContainer}>
        <VictoryPie
          data={data}
          startAngle={-90}
          endAngle={90}
          innerRadius={70}
          cornerRadius={25}
          labels={() => null}
          style={{
            data: {
              fill: ({ datum }) => (datum.x === 1 ? theme.colors.primary : theme.colors.border),
            },
          }}
          width={250}
          height={250}
        />
        <VictoryLabel
          textAnchor="middle"
          style={{ fontSize: 32, fill: theme.colors.textPrimary, fontWeight: 'bold' }}
          x={125}
          y={115}
          text={`${value}`}
        />
        <VictoryLabel
          textAnchor="middle"
          style={{ fontSize: 14, fill: theme.colors.textSecondary }}
          x={125}
          y={135}
          text={unit}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  chartContainer: {
    marginTop: -40, // Pulls the chart up to overlap the title slightly
    marginBottom: -60, // Reduces bottom space
  },
  emptyContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CheckinSpeedGauge; 