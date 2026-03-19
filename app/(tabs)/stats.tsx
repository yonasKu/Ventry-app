import React, { useMemo, useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { Funnel, ShareNetwork } from 'phosphor-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useEvents } from '@/context/EventContext';
import { useEventStore } from '@/store/useEventStore';
import { parseISO, isThisWeek, isThisMonth, differenceInDays, isFuture, format } from 'date-fns';
import { VictoryTheme } from 'victory-native';
import StatsHeader from '@/components/statistics/StatsHeader';
import TimeFilterComponent from '@/components/statistics/TimeFilter';
import EventDistributionChart from '@/components/statistics/EventDistributionChart';
import CheckInChart from '@/components/statistics/CheckInChart';
import EventsBarChart from '@/components/statistics/EventsBarChart';
import OverviewSection from '@/components/statistics/OverviewSection';
import EventInsights from '@/components/statistics/EventInsights';
import AttendanceTrendChart from '@/components/statistics/AttendanceTrendChart';
import AttendeeTypeChart from '@/components/statistics/AttendeeTypeChart';
import SectionHeader from '@/components/statistics/SectionHeader';
import CheckinActivityHeatMap from '@/components/statistics/CheckinActivityHeatMap';
import CheckinSpeedGauge from '@/components/statistics/CheckinSpeedGauge';
import EventCompletionBars from '@/components/statistics/EventCompletionBars';
import CheckinRateTrendChart from '@/components/statistics/CheckinRateTrendChart';
import ReportingService from '@/services/ReportingService';
import ExportPDFButton from '@/components/ExportPDFButton';
import FilterSheet, { FilterOptions } from '@/components/FilterSheet';
import { ShareUtils } from '@/utils/shareUtils';

import { useLocalSearchParams } from 'expo-router';

export default function StatsScreen() {
  const theme = useTheme();
  const { events, loading, refreshEvents } = useEvents();
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  
  // Use Zustand for filter state management
  const zustandFilters = useEventStore((state) => state.filters);
  const setTimeFilter = useEventStore((state) => state.setTimeFilter);
  const setCategory = useEventStore((state) => state.setCategory);
  const setStatus = useEventStore((state) => state.setStatus);
  
  // Local state for full filter options (for FilterSheet compatibility)
  const [filters, setFilters] = useState<FilterOptions>({
    selectedEventId: eventId || null,
    timeFilter: zustandFilters.timeFilter,
    category: zustandFilters.category,
    status: zustandFilters.status,
    checkInStatus: 'all',
    attendeeRange: { min: null, max: null },
    sortBy: 'date',
  });

  // Sync Zustand filters with local filters
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      timeFilter: zustandFilters.timeFilter,
      category: zustandFilters.category,
      status: zustandFilters.status,
    }));
  }, [zustandFilters]);

  // Update filters when eventId param changes
  useEffect(() => {
    if (eventId) {
      setFilters(prev => ({ ...prev, selectedEventId: eventId }));
    }
  }, [eventId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshEvents();
    setRefreshing(false);
  };
  
  // Handle filter apply - update both local and Zustand state
  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // Update Zustand store
    setTimeFilter(newFilters.timeFilter);
    setCategory(newFilters.category);
    setStatus(newFilters.status);
  };

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    let filtered = events;
    
    // Filter by specific event if selected
    if (filters.selectedEventId) {
      filtered = events.filter(event => event.id === filters.selectedEventId);
    } else {
      // Filter by time period
      filtered = events.filter(event => {
        const eventDate = parseISO(event.date);
        switch (filters.timeFilter) {
          case 'week': return isThisWeek(eventDate);
          case 'month': return isThisMonth(eventDate);
          case 'year': return differenceInDays(new Date(), eventDate) <= 365;
          case 'all': return true;
          default: return true;
        }
      });
    }
    
    return filtered;
  }, [events, filters]);

  // Calculate key stats using filtered events
  const stats = useMemo(() => {
    // Calculate vs previous period
    const previousPeriodEvents = events.filter(event => {
      const eventDate = parseISO(event.date);
      switch (filters.timeFilter) {
        case 'week': return differenceInDays(new Date(), eventDate) > 7 && differenceInDays(new Date(), eventDate) <= 14;
        case 'month': return differenceInDays(new Date(), eventDate) > 30 && differenceInDays(new Date(), eventDate) <= 60;
        case 'year': return differenceInDays(new Date(), eventDate) > 365 && differenceInDays(new Date(), eventDate) <= 730;
        case 'all': return true;
        default: return true;
      }
    });
    
    const eventsGrowth = previousPeriodEvents.length > 0 
      ? ((filteredEvents.length - previousPeriodEvents.length) / previousPeriodEvents.length * 100).toFixed(1)
      : '0';
      
    const eventsGrowthPositive = Number(eventsGrowth) >= 0;
    
    // Find most recent and popular events from filtered data
    const recentEvents = [...filteredEvents].sort((a, b) => 
      parseISO(b.date).getTime() - parseISO(a.date).getTime()
    );
    
    const mostRecentEvent = recentEvents.length > 0 ? recentEvents[0] : null;
    const mostPopularEvent = [...filteredEvents].sort((a, b) => 
      (b.attendees_count || 0) - (a.attendees_count || 0)
    )[0];
    
    // Calculate average attendance from filtered events
    const avgAttendeesPerEvent = filteredEvents.length > 0
      ? (filteredEvents.reduce((sum, e) => sum + (e.attendees_count || 0), 0) / filteredEvents.length).toFixed(1)
      : '0';
    
    // Count active (upcoming) events from filtered events
    const activeEvents = filteredEvents.filter(e => isFuture(parseISO(e.date))).length;
    
    return { 
      totalEvents: filteredEvents.length,
      totalAttendees: filteredEvents.reduce((sum, e) => sum + (e.attendees_count || 0), 0),
      totalCheckedIn: filteredEvents.reduce((sum, e) => sum + (e.checked_in_count || 0), 0),
      checkInRate: filteredEvents.reduce((sum, e) => sum + (e.attendees_count || 0), 0) > 0
        ? ((filteredEvents.reduce((sum, e) => sum + (e.checked_in_count || 0), 0) / 
            filteredEvents.reduce((sum, e) => sum + (e.attendees_count || 0), 0)) * 100).toFixed(1)
        : '0',
      eventsGrowth,
      eventsGrowthPositive,
      avgAttendeesPerEvent: Number(avgAttendeesPerEvent),
      mostRecentEvent,
      mostPopularEvent,
      activeEvents,
    };
  }, [filteredEvents, events, filters.timeFilter]);

  // Format event data for charts using FILTERED events only
  const chartData = useMemo(() => {
    const sortedEvents = [...filteredEvents].sort(
      (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()
    );

    // Data for AttendanceTrendChart - calculate from filteredEvents
    const days = filters.timeFilter === 'week' ? 7 : filters.timeFilter === 'month' ? 30 : filters.timeFilter === 'year' ? 365 : 90;
    // Group filtered events by date
    const eventsByDate = filteredEvents.reduce((acc, event) => {
      const dateKey = format(parseISO(event.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = { attendees: 0, checkedIn: 0 };
      }
      acc[dateKey].attendees += event.attendees_count || 0;
      acc[dateKey].checkedIn += event.checked_in_count || 0;
      return acc;
    }, {} as Record<string, { attendees: number; checkedIn: number }>);
    
    const trendData = Object.entries(eventsByDate).map(([date, data]) => ({
      x: parseISO(date),
      y: data.attendees,
    }));

    // Data for EventsBarChart
    const recentEvents = sortedEvents.slice(-6);
    const barData = recentEvents.map(event => ({
      id: event.id, // Add unique ID for React keys
      x: event.title.length > 10 ? `${event.title.substring(0, 10)}...` : event.title,
      y: event.attendees_count || 0,
      checkedIn: event.checked_in_count || 0,
      checkInRate: event.attendees_count ? ((event.checked_in_count || 0) / event.attendees_count * 100).toFixed(0) : '0'
    }));

    // Data for CheckInChart - calculate from filteredEvents
    const totalFilteredAttendees = filteredEvents.reduce((sum, e) => sum + (e.attendees_count || 0), 0);
    const totalFilteredCheckedIn = filteredEvents.reduce((sum, e) => sum + (e.checked_in_count || 0), 0);
    const pieData = [
      { x: "Checked In", y: totalFilteredCheckedIn, color: theme.colors.primary },
      { x: "Not Checked In", y: totalFilteredAttendees - totalFilteredCheckedIn, color: theme.colors.border || '#e0e0e0' }
    ];
    const pieStats = {
      totalAttendees: totalFilteredAttendees,
      checkInRate: totalFilteredAttendees > 0 ? ((totalFilteredCheckedIn / totalFilteredAttendees) * 100).toFixed(1) : '0',
    };
    
    // Data for EventDistributionChart - calculate from filteredEvents
    const statusCounts = filteredEvents.reduce((acc, event) => {
      const eventDate = parseISO(event.date);
      const now = new Date();
      let status = 'Upcoming';
      if (eventDate < now) status = 'Past';
      else if (format(eventDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) status = 'Today';
      
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const distributionData = Object.entries(statusCounts).map(([label, value]) => ({
      x: label,
      y: value,
    }));
    
    // AttendeeTypeChart data - empty for now (feature not yet implemented)
    const attendeeTypeData: Array<{ event: string; new: number; returning: number }> = [];
    
    // Calculate check-in speed from real data
    const checkinSpeed = stats.totalCheckedIn > 0 ? Math.min(Math.round(stats.totalCheckedIn / filteredEvents.length), 100) : 0;

    // CheckinActivityHeatMap data - empty for now (feature not yet implemented)
    const heatMapData: number[][] = [];

    // Data for EventCompletionBars - use filteredEvents only
    const topEvents = [...filteredEvents]
      .sort((a, b) => (b.attendees_count || 0) - (a.attendees_count || 0))
      .slice(0, 4);
    const eventCompletionData = topEvents.map((event) => ({
      name: event.title,
      checkedIn: event.checked_in_count || 0,
      total: event.attendees_count || 0,
    }));

    // Data for CheckinRateTrendChart - calculate from filteredEvents
    const sortedByDate = [...filteredEvents].sort((a, b) => 
      parseISO(a.date).getTime() - parseISO(b.date).getTime()
    );
    const checkinRateTrendData = sortedByDate.map((event, index) => ({
      x: index,
      y: event.attendees_count ? ((event.checked_in_count || 0) / event.attendees_count * 100) : 0,
    }));

    return { barData, pieData, pieStats, distributionData, trendData, attendeeTypeData, heatMapData, checkinSpeed, eventCompletionData, checkinRateTrendData };
  }, [filteredEvents, stats, theme, filters.timeFilter]);

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
    <>
      <ScrollView 
        style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary }} 
        contentContainerStyle={[styles.container, { paddingHorizontal: theme.spacing.sm }]}
        refreshControl={
          <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Header with Filter Icon */}
      <View style={styles.headerContainer}>
        <StatsHeader />
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.colors.backgroundPrimary }]}
          onPress={() => setFilterSheetVisible(true)}
        >
          <Funnel size={22} color={theme.colors.primary} weight="bold" />
        </TouchableOpacity>
      </View>
      
      {/* Export and Share Buttons */}
      <View style={{ marginBottom: theme.spacing.md, flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <ExportPDFButton
            type="statistics"
            timeFilter={filters.timeFilter}
            variant="primary"
          />
        </View>
        <TouchableOpacity
          style={[
            styles.shareButton,
            { backgroundColor: theme.colors.success }
          ]}
          onPress={() => ShareUtils.shareStats({
            totalEvents: stats.totalEvents,
            totalAttendees: stats.totalAttendees,
            checkInRate: stats.checkInRate,
            timeFilter: filters.timeFilter
          })}
        >
          <ShareNetwork size={20} color="white" weight="bold" />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
      
      <TimeFilterComponent 
        timeFilter={filters.timeFilter} 
        setTimeFilter={(tf) => {
          setFilters({ ...filters, timeFilter: tf });
          setTimeFilter(tf); // Update Zustand
        }} 
      />
      <OverviewSection stats={stats} />
      <EventDistributionChart data={chartData.distributionData} />
      <SectionHeader title="Attendance Analytics" />
      <AttendanceTrendChart data={chartData.trendData} />
      <AttendeeTypeChart data={chartData.attendeeTypeData} />
      <SectionHeader title="Event Insights" />
      <EventInsights stats={{
        avgAttendeesPerEvent: stats.avgAttendeesPerEvent,
        mostPopularEvent: stats.mostPopularEvent ? {
          title: stats.mostPopularEvent.title,
          attendees_count: stats.mostPopularEvent.attendees_count
        } : undefined,
        mostRecentEvent: stats.mostRecentEvent ? {
          title: stats.mostRecentEvent.title,
          date: stats.mostRecentEvent.date
        } : undefined
      }} />
      <EventsBarChart data={chartData.barData} customTheme={customTheme} />
      <CheckInChart 
        data={chartData.pieData} 
        stats={chartData.pieStats}
      />
      <SectionHeader title="Check-in Efficiency" />
      <CheckinActivityHeatMap data={chartData.heatMapData} />
      <CheckinSpeedGauge value={chartData.checkinSpeed} label="Average Check-in Speed" unit="per minute" />
      <EventCompletionBars events={chartData.eventCompletionData} title="Event Completion Status" />
      <CheckinRateTrendChart data={chartData.checkinRateTrendData} title="Check-in Rate Over Time" />
    </ScrollView>
    
    {/* Filter Sheet - Moved outside ScrollView */}
    <FilterSheet
      visible={filterSheetVisible}
      onClose={() => setFilterSheetVisible(false)}
      onApply={handleApplyFilters}
      currentFilters={filters}
      events={events}
      showTimeFilter={true}
      showEventFilter={true}
      showCategoryFilter={false}
      showStatusFilter={false}
      showCheckInFilter={true}
      showAttendeeRangeFilter={false}
      showSortOptions={false}
    />
  </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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