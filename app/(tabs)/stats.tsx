import React, { useMemo, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  RefreshControl,
  ActivityIndicator 
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useEvents } from '@/context/EventContext';
import { format, parseISO, isThisWeek, isThisMonth, differenceInDays, formatDistance } from 'date-fns';
import { VictoryPie, VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryLabel } from 'victory-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUp, ArrowDown, Calendar, Users, CheckCircle, Clock, ChartBar, TrendUp, Trophy } from 'phosphor-react-native';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// --- Color Utility Functions ---
// Converts a hex color to an HSL array
function hexToHsl(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

// Converts an HSL color to a hex string
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { [r, g, b] = [c, x, 0]; }
  else if (60 <= h && h < 120) { [r, g, b] = [x, c, 0]; }
  else if (120 <= h && h < 180) { [r, g, b] = [0, c, x]; }
  else if (180 <= h && h < 240) { [r, g, b] = [0, x, c]; }
  else if (240 <= h && h < 300) { [r, g, b] = [x, 0, c]; }
  else if (300 <= h && h < 360) { [r, g, b] = [c, 0, x]; }
  const toHex = (c: number) => ('0' + Math.round((c + m) * 255).toString(16)).slice(-2);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Generates a vibrant, dynamic color scale
function generateColorScale(baseColor: string, count: number): string[] {
  const scale: string[] = [];
  const [baseH, baseS, baseL] = hexToHsl(baseColor);
  for (let i = 0; i < count; i++) {
    // Rotate hue by the golden angle for pleasing distribution
    const hue = (baseH + i * 137.5) % 360;
    // Vary saturation and lightness slightly for more dynamism
    const saturation = baseS - (i % 3) * 5;
    const lightness = baseL + (i % 4) * 5;
    scale.push(hslToHex(hue, Math.max(40, saturation), Math.min(70, lightness)));
  }
  return scale;
}

type TimeFilter = 'week' | 'month' | 'year' | 'all';

export default function StatsScreen() {
  const theme = useTheme();
  const { events, loading, refreshEvents } = useEvents();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshEvents();
    setRefreshing(false);
  };

  // Filter events based on selected time period
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Parse the date string to a Date object
      const eventDate = parseISO(event.date);
      switch (timeFilter) {
        case 'week': return isThisWeek(eventDate);
        case 'month': return isThisMonth(eventDate);
        case 'year': return differenceInDays(new Date(), eventDate) <= 365;
        case 'all': return true;
        default: return true;
      }
    });
  }, [events, timeFilter]);

  // Calculate key stats
  const stats = useMemo(() => {
    const totalEvents = filteredEvents.length;
    const totalAttendees = filteredEvents.reduce((sum, e) => sum + (e.attendees_count || 0), 0);
    const totalCheckedIn = filteredEvents.reduce((sum, e) => sum + (e.checked_in_count || 0), 0);
    const checkInRate = totalAttendees > 0 ? ((totalCheckedIn / totalAttendees) * 100).toFixed(1) : '0';
    
    // Calculate vs previous period
    const previousPeriodEvents = events.filter(event => {
      // Parse the date string to a Date object
      const eventDate = parseISO(event.date);
      switch (timeFilter) {
        case 'week': return differenceInDays(new Date(), eventDate) > 7 && differenceInDays(new Date(), eventDate) <= 14;
        case 'month': return differenceInDays(new Date(), eventDate) > 30 && differenceInDays(new Date(), eventDate) <= 60;
        case 'year': return differenceInDays(new Date(), eventDate) > 365 && differenceInDays(new Date(), eventDate) <= 730;
        case 'all': return true;
        default: return true;
      }
    });
    
    const eventsGrowth = previousPeriodEvents.length > 0 
      ? ((totalEvents - previousPeriodEvents.length) / previousPeriodEvents.length * 100).toFixed(1)
      : '0';
      
    const eventsGrowthPositive = Number(eventsGrowth) >= 0;
    
    // Additional stats
    const avgAttendeesPerEvent = totalEvents > 0 ? Math.round(totalAttendees / totalEvents) : 0;
    
    // Find most recent event
    const recentEvents = [...filteredEvents].sort((a, b) => 
      parseISO(b.date).getTime() - parseISO(a.date).getTime()
    );
    
    const mostRecentEvent = recentEvents.length > 0 ? recentEvents[0] : null;
    const mostPopularEvent = [...filteredEvents].sort((a, b) => 
      (b.attendees_count || 0) - (a.attendees_count || 0)
    )[0];
    
    return { 
      totalEvents, 
      totalAttendees, 
      totalCheckedIn, 
      checkInRate,
      eventsGrowth,
      eventsGrowthPositive,
      avgAttendeesPerEvent,
      mostRecentEvent,
      mostPopularEvent
    };
  }, [filteredEvents, events, timeFilter]);

  // Format event data for charts
  const chartData = useMemo(() => {
    // Sort by date and take most recent 6 events
    const recentEvents = [...filteredEvents]
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .slice(0, 6)
      .reverse();
    
    const barData = recentEvents.map(event => ({
      x: event.title.length > 10 ? `${event.title.substring(0, 10)}...` : event.title,
      y: event.attendees_count || 0,
      checkedIn: event.checked_in_count || 0,
      checkInRate: event.attendees_count ? ((event.checked_in_count || 0) / event.attendees_count * 100).toFixed(0) : '0'
    }));

    const pieData = [
      { x: "Checked In", y: stats.totalCheckedIn, color: theme.colors.primary },
      { x: "Not Checked In", y: stats.totalAttendees - stats.totalCheckedIn, color: theme.colors.border || '#e0e0e0' }
    ];
    
    return { barData, pieData };
  }, [filteredEvents, stats, theme]);

  // Victory theme customization
  const customTheme = {
    ...VictoryTheme.material,
    axis: {
      style: {
        axis: {
          stroke: theme.colors.textSecondary,
        },
        tickLabels: {
          fill: theme.colors.textSecondary,
          fontSize: 8
        },
        grid: {
          stroke: 'transparent'
        }
      }
    }
  };

  const renderDistributionChart = () => {
    // Expanded sample data for a more professional look
    const distributionData = [
      { x: 'Meetups', y: 42 },
      { x: 'Workshops', y: 28 },
      { x: 'Conferences', y: 19 },
      { x: 'Webinars', y: 15 },
      { x: 'Team Building', y: 12 },
      { x: 'Product Launches', y: 9 },
      { x: 'Networking', y: 7 },
      { x: 'Seminars', y: 5 },
      { x: 'Trade Shows', y: 3 },
    ];
    
    // Calculate total for percentage calculation
    const totalEvents = distributionData.reduce((acc, d) => acc + d.y, 0);

    // Your preferred vibrant color palette for the top categories
    const accentColors = [
      theme.colors.accent, // Orange for the largest slice
      '#8B5CF6',           // Purple for the second largest
      '#3B82F6',           // Blue for the third
      '#10B981',           // Green for the fourth
      '#EF4444',           // Red for the fifth
    ];

    // Sort data to assign colors based on rank
    const sortedData = [...distributionData].sort((a, b) => b.y - a.y);
    
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
    const colorScale = distributionData.map(item => colorMap[item.x]);

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
          data={distributionData}
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

  const renderTimeFilter = () => (
    <Animated.View 
      style={styles.filterContainer}
      entering={FadeInDown.delay(100).springify()}
    >
      <TouchableOpacity 
        style={[
          styles.filterButton, 
          timeFilter === 'week' && [
            styles.activeFilter, 
            { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}15` }
          ]
        ]} 
        onPress={() => setTimeFilter('week')}
      >
        <Text 
          style={[
            styles.filterText, 
            timeFilter === 'week' && { color: theme.colors.primary, fontWeight: '600' }
          ]}
        >
          Week
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.filterButton, 
          timeFilter === 'month' && [
            styles.activeFilter, 
            { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}15` }
          ]
        ]} 
        onPress={() => setTimeFilter('month')}
      >
        <Text 
          style={[
            styles.filterText, 
            timeFilter === 'month' && { color: theme.colors.primary, fontWeight: '600' }
          ]}
        >
          Month
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.filterButton, 
          timeFilter === 'year' && [
            styles.activeFilter, 
            { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}15` }
          ]
        ]} 
        onPress={() => setTimeFilter('year')}
      >
        <Text 
          style={[
            styles.filterText, 
            timeFilter === 'year' && { color: theme.colors.primary, fontWeight: '600' }
          ]}
        >
          Year
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.filterButton, 
          timeFilter === 'all' && [
            styles.activeFilter, 
            { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}15` }
          ]
        ]} 
        onPress={() => setTimeFilter('all')}
      >
        <Text 
          style={[
            styles.filterText, 
            timeFilter === 'all' && { color: theme.colors.primary, fontWeight: '600' }
          ]}
        >
          All Time
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={[theme.typography.display, { color: theme.colors.textPrimary }]}>
        Statistics
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.xs }]}>
        Event data and insights
      </Text>
    </View>
  );

  const renderOverviewSection = () => (
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
      </View>
    </Animated.View>
  );

  const renderEventInsights = () => (
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
  
  // Recent Events Chart Component
  const renderEventsChart = () => (
    chartData.barData.length > 0 ? (
      <Animated.View 
        style={[
          styles.chartCard, 
          { 
            backgroundColor: theme.colors.backgroundPrimary,
            borderRadius: theme.borderRadius.lg,
            ...theme.shadows.md 
          }
        ]}
        entering={FadeInDown.delay(250).springify()}
        layout={Layout.springify()}
      >
        <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary }]}>
          Recent Events
        </Text>
        <View style={styles.chartContainer}>
          <VictoryChart
            domainPadding={{ x: 20 }}
            width={width - 64}
            height={250}
            theme={customTheme}
            padding={{ top: 20, bottom: 50, left: 50, right: 50 }}
          >
            <VictoryAxis
              tickFormat={(t) => t}
              style={{
                tickLabels: {
                  angle: -30,
                  textAnchor: 'end',
                  fontSize: 8,
                  fill: theme.colors.textSecondary
                }
              }}
            />
            <VictoryAxis
              dependentAxis
              tickFormat={(t) => `${t}`}
              style={{
                tickLabels: {
                  fontSize: 10,
                  fill: theme.colors.textSecondary
                }
              }}
            />
            <VictoryBar
              data={chartData.barData}
              x="x"
              y="y"
              style={{
                data: {
                  fill: ({ datum }) => {
                    const hex = theme.colors.primary.replace('#', '');
                    const r = parseInt(hex.substring(0, 2), 16);
                    const g = parseInt(hex.substring(2, 4), 16);
                    const b = parseInt(hex.substring(4, 6), 16);
                    return `rgba(${r}, ${g}, ${b}, 0.2)`;
                  },
                  stroke: theme.colors.primary,
                  strokeWidth: 1
                }
              }}
              barRatio={0.8}
              labels={({ datum }) => `${datum.y}`}
              labelComponent={<VictoryLabel dy={-10} style={{ fill: theme.colors.textSecondary, fontSize: 10 }} />}
            />
            <VictoryBar
              data={chartData.barData}
              x="x"
              y="checkedIn"
              style={{
                data: {
                  fill: theme.colors.primary
                }
              }}
              barRatio={0.8}
              labels={({ datum }) => `${datum.checkedIn}`}
              labelComponent={<VictoryLabel dy={-10} style={{ fill: theme.colors.textSecondary, fontSize: 10 }} />}
            />
          </VictoryChart>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: theme.colors.primary }]} />
              <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Checked In</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: (() => {
                const hex = theme.colors.primary.replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                return `rgba(${r}, ${g}, ${b}, 0.2)`;
              })() }]} />
              <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Total Attendees</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    ) : (
      <Animated.View 
        style={[
          styles.chartCard, 
          { 
            backgroundColor: theme.colors.backgroundPrimary,
            borderRadius: theme.borderRadius.lg,
            ...theme.shadows.md 
          }
        ]}
        entering={FadeInDown.delay(250).springify()}
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
    )
  );

  // Check-in Distribution Chart Component  
  const renderCheckInChart = () => (
    stats.totalAttendees > 0 ? (
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
            data={chartData.pieData}
            colorScale={chartData.pieData.map(d => d.color)}
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
    ) : (
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
    )
  );

  if (loading && !refreshing && events.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>
          Loading statistics...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary }} 
      contentContainerStyle={[styles.container, { paddingHorizontal: theme.spacing.lg }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {renderHeader()}
      {renderDistributionChart()}
      {renderTimeFilter()}
      {renderOverviewSection()}
      {renderEventInsights()}
      {renderEventsChart()}
      {renderCheckInChart()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeFilter: {
    backgroundColor: 'rgba(100, 100, 255, 0.08)',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
  },
  summaryCard: {
    padding: 20,
    marginBottom: 20,
  },
  insightsCard: {
    padding: 20,
    marginBottom: 20,
  },
  chartCard: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
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
  chartContainer: {
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
  centerValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  centerText: {
    fontSize: 12,
  },
  emptyChartContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  donutCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
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