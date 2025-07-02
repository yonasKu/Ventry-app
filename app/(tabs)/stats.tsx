import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useEvents } from '@/context/EventContext';
import { format, parseISO, isThisWeek, isThisMonth, differenceInDays } from 'date-fns';
import { VictoryPie, VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryLine, VictoryLabel } from 'victory-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUp, ArrowDown, Calendar, Users, CheckCircle, Clock } from 'phosphor-react-native';

const { width } = Dimensions.get('window');

type TimeFilter = 'week' | 'month' | 'year' | 'all';

export default function StatsScreen() {
  const theme = useTheme();
  const { events, loading } = useEvents();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

  // Filter events based on selected time period
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
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
      const eventDate = new Date(event.date);
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
    
    return { 
      totalEvents, 
      totalAttendees, 
      totalCheckedIn, 
      checkInRate,
      eventsGrowth,
      eventsGrowthPositive
    };
  }, [filteredEvents, events, timeFilter]);

  // Format event data for charts
  const chartData = useMemo(() => {
    // Sort by date and take most recent 6 events
    const recentEvents = [...filteredEvents]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6)
      .reverse();
    
    const barData = recentEvents.map(event => ({
      x: event.title.length > 10 ? `${event.title.substring(0, 10)}...` : event.title,
      y: event.attendees_count || 0,
      checkedIn: event.checked_in_count || 0,
      checkInRate: event.attendees_count ? (event.checked_in_count / event.attendees_count * 100).toFixed(0) : 0
    }));

    const pieData = [
      { x: "Checked In", y: stats.totalCheckedIn, color: theme.colors.primary },
      { x: "Not Checked In", y: stats.totalAttendees - stats.totalCheckedIn, color: theme.colors.cardBackground }
    ];
    
    return { barData, pieData };
  }, [filteredEvents, stats, theme]);

  // Victory theme customization
  const customTheme = {
    ...VictoryTheme.material,
    axis: {
      ...VictoryTheme.material.axis,
      style: {
        ...VictoryTheme.material.axis.style,
        axis: {
          ...VictoryTheme.material.axis.style.axis,
          stroke: theme.colors.textSecondary,
        },
        tickLabels: {
          ...VictoryTheme.material.axis.style.tickLabels,
          fill: theme.colors.textSecondary,
          fontSize: 8
        }
      }
    }
  };

  const renderTimeFilter = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity 
        style={[styles.filterButton, timeFilter === 'week' && [styles.activeFilter, { borderColor: theme.colors.primary }]]} 
        onPress={() => setTimeFilter('week')}
      >
        <Text style={[styles.filterText, timeFilter === 'week' && { color: theme.colors.primary }]}>Week</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterButton, timeFilter === 'month' && [styles.activeFilter, { borderColor: theme.colors.primary }]]} 
        onPress={() => setTimeFilter('month')}
      >
        <Text style={[styles.filterText, timeFilter === 'month' && { color: theme.colors.primary }]}>Month</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterButton, timeFilter === 'year' && [styles.activeFilter, { borderColor: theme.colors.primary }]]} 
        onPress={() => setTimeFilter('year')}
      >
        <Text style={[styles.filterText, timeFilter === 'year' && { color: theme.colors.primary }]}>Year</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterButton, timeFilter === 'all' && [styles.activeFilter, { borderColor: theme.colors.primary }]]} 
        onPress={() => setTimeFilter('all')}
      >
        <Text style={[styles.filterText, timeFilter === 'all' && { color: theme.colors.primary }]}>All Time</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary }} 
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.header, { color: theme.colors.textPrimary }]}>Statistics</Text>
      
      {renderTimeFilter()}
      
      <View style={[styles.summaryCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Overview</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={styles.summaryIconContainer}>
              <Calendar size={24} color={theme.colors.primary} weight="bold" />
            </View>
            <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{stats.totalEvents}</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Events</Text>
            {Number(stats.eventsGrowth) !== 0 && (
              <View style={[styles.growthBadge, { backgroundColor: stats.eventsGrowthPositive ? 'rgba(75, 181, 67, 0.1)' : 'rgba(181, 67, 67, 0.1)' }]}>
                {stats.eventsGrowthPositive ? <ArrowUp size={12} color="#4BB543" /> : <ArrowDown size={12} color="#B54343" />}
                <Text style={[styles.growthText, { color: stats.eventsGrowthPositive ? '#4BB543' : '#B54343' }]}>
                  {stats.eventsGrowth}%
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.summaryItem}>
            <View style={styles.summaryIconContainer}>
              <Users size={24} color={theme.colors.primary} weight="bold" />
            </View>
            <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{stats.totalAttendees}</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Attendees</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <View style={styles.summaryIconContainer}>
              <CheckCircle size={24} color={theme.colors.primary} weight="bold" />
            </View>
            <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{stats.checkInRate}%</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Check-in Rate</Text>
          </View>
        </View>
      </View>
      
      {/* Recent Events Chart */}
      {chartData.barData.length > 0 ? (
        <View style={[styles.chartCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Recent Events</Text>
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
                      return `rgba(${parseInt(theme.colors.primary.slice(1, 3), 16)}, ${parseInt(theme.colors.primary.slice(3, 5), 16)}, ${parseInt(theme.colors.primary.slice(5, 7), 16)}, 0.2)`;
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
                <View style={[styles.legendColor, { backgroundColor: `rgba(${parseInt(theme.colors.primary.slice(1, 3), 16)}, ${parseInt(theme.colors.primary.slice(3, 5), 16)}, ${parseInt(theme.colors.primary.slice(5, 7), 16)}, 0.2)` }]} />
                <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Total Attendees</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.chartCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Recent Events</Text>
          <View style={styles.emptyChartContainer}>
            <Calendar size={48} color={theme.colors.textSecondary} weight="light" />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No events in this period</Text>
          </View>
        </View>
      )}
      
      {/* Check-in Distribution Chart */}
      {stats.totalAttendees > 0 ? (
        <View style={[styles.chartCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Check-in Distribution</Text>
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
                  text={({ datum }) => `${datum.x}: ${Math.round(datum.y / stats.totalAttendees * 100)}%`}
                />
              }
            />
            <View style={styles.centerLabel}>
              <Text style={[styles.centerValue, { color: theme.colors.primary }]}>{stats.checkInRate}%</Text>
              <Text style={[styles.centerText, { color: theme.colors.textSecondary }]}>Check-in Rate</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.chartCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Check-in Distribution</Text>
          <View style={styles.emptyChartContainer}>
            <Users size={48} color={theme.colors.textSecondary} weight="light" />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No attendee data in this period</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
    backgroundColor: 'rgba(100, 100, 255, 0.1)',
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
  chartCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
});