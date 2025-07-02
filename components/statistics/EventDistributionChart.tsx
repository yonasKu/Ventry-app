import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { VictoryPie, VictoryLabel } from 'victory-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { hexToHsl, hslToHex } from '@/utils/colorUtils';

const { width } = Dimensions.get('window');

interface EventDistributionChartProps {
  data: Array<{
    x: string;
    y: number;
  }>;
}

const EventDistributionChart: React.FC<EventDistributionChartProps> = ({ data }) => {
  const theme = useTheme();
  const totalEvents = data.reduce((acc, d) => acc + d.y, 0);

  const colorScale = useMemo(() => {
    // Preferred vibrant color palette for the top categories
    const accentColors = [
      theme.colors.accent, // Orange for the largest slice
      '#8B5CF6',          // Purple for the second largest
      '#3B82F6',          // Blue for the third
      '#10B981',          // Green for the fourth
      '#EF4444',          // Red for the fifth
    ];

    // Sort data to assign colors based on rank
    const sortedData = [...data].sort((a, b) => b.y - a.y);
    
    // Dynamically assign colors: use accents first, then generate new ones
    const [baseH, baseS, baseL] = hexToHsl(theme.colors.primary);
    const colorMap = sortedData.reduce((map, item, index) => {
      if (index < accentColors.length) {
        // Use the preferred accent colors for the top items
        map[item.x] = accentColors[index];
      } else {
        // For additional items, generate a new, distinct color
        const hue = (baseH + (index - accentColors.length) * 137.5) % 360;
        const saturation = baseS - (index % 3) * 5;
        const lightness = baseL + (index % 4) * 5;
        map[item.x] = hslToHex(hue, Math.max(40, saturation), Math.min(70, lightness));
      }
      return map;
    }, {} as Record<string, string>);

    // Create the color scale in the original data order for VictoryPie
    return data.map(item => colorMap[item.x]);
  }, [data, theme]);

  if (!totalEvents) {
    return null;
  }

  return (
    <Animated.View 
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.lg,
      }}
      entering={FadeInDown.delay(100).springify()}
      layout={Layout.springify()}
    >
      <VictoryPie
        data={data}
        width={width - theme.spacing.md}
        height={320}
        padding={40}
        innerRadius={80}
        cornerRadius={15}
        padAngle={1.5}
        colorScale={colorScale}
        labels={({ datum }) => `${Math.round((datum.y / totalEvents) * 100)}%`}
        labelComponent={
          <VictoryLabel
            backgroundStyle={{ 
              fill: theme.colors.backgroundPrimary, 
              opacity: 0.7, 
              rx: 8,
            } as any}
            backgroundPadding={{ top: 4, bottom: 4, left: 8, right: 8 }}
            style={{ fill: theme.colors.textPrimary, fontSize: 12, fontWeight: 'bold' }}
          />
        }
        labelRadius={120}
        style={{ data: { stroke: theme.colors.backgroundPrimary, strokeWidth: 2 } }}
        animate={{
          duration: 500,
          onLoad: { duration: 500 }
        }}
      />
      <View style={styles.donutCenter}>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Total Events</Text>
        <Text style={[theme.typography.display, { color: theme.colors.textPrimary, marginTop: theme.spacing.xs }]}>
          {totalEvents}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  donutCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default EventDistributionChart; 