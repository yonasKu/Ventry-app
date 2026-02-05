import { useMemo } from 'react';
import { parseISO, isThisWeek, isThisMonth, differenceInDays, format } from 'date-fns';
import { Event } from '@/services/DatabaseService';
import { useTheme } from '@/context/ThemeContext';
import { hexToHsl, hslToHex } from '@/utils/colorUtils';

export type TimeFilter = 'week' | 'month' | 'year' | 'all';

/**
 * A custom hook to process and calculate all statistics for the stats page.
 * @param events - The raw array of events from the database.
 * @param timeFilter - The currently selected time filter ('week', 'month', 'year', 'all').
 * @returns An object containing all calculated stats and chart data.
 */
export const useStatistics = (events: Event[], timeFilter: TimeFilter) => {
  const theme = useTheme();

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      switch (timeFilter) {
        case 'week': return isThisWeek(eventDate);
        case 'month': return isThisMonth(eventDate);
        case 'year': return differenceInDays(new Date(), eventDate) <= 365;
        default: return true;
      }
    });
  }, [events, timeFilter]);

  const stats = useMemo(() => {
    const totalEvents = filteredEvents.length;
    const totalAttendees = filteredEvents.reduce((sum, e) => sum + (e.attendees_count || 0), 0);
    const totalCheckedIn = filteredEvents.reduce((sum, e) => sum + (e.checked_in_count || 0), 0);
    const checkInRate = totalAttendees > 0 ? ((totalCheckedIn / totalAttendees) * 100).toFixed(1) : '0';
    
    // Calculate vs previous period
    const previousPeriodEvents = events.filter(event => {
      const eventDate = parseISO(event.date);
      switch (timeFilter) {
        case 'week': return differenceInDays(new Date(), eventDate) > 7 && differenceInDays(new Date(), eventDate) <= 14;
        case 'month': return differenceInDays(new Date(), eventDate) > 30 && differenceInDays(new Date(), eventDate) <= 60;
        case 'year': return differenceInDays(new Date(), eventDate) > 365 && differenceInDays(new Date(), eventDate) <= 730;
        default: return true;
      }
    });
    
    const eventsGrowth = previousPeriodEvents.length > 0 
      ? ((totalEvents - previousPeriodEvents.length) / previousPeriodEvents.length * 100).toFixed(1)
      : '0';
      
    const eventsGrowthPositive = Number(eventsGrowth) >= 0;
    
    const avgAttendeesPerEvent = totalEvents > 0 ? Math.round(totalAttendees / totalEvents) : 0;
    
    const recentEvents = [...filteredEvents].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    const mostRecentEvent = recentEvents.length > 0 ? recentEvents[0] : null;
    const mostPopularEvent = [...filteredEvents].sort((a, b) => (b.attendees_count || 0) - (a.attendees_count || 0))[0];
    
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

  const chartData = useMemo(() => {
    const recentEvents = [...filteredEvents]
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .slice(0, 6).reverse();
    
    const barData = recentEvents.map(event => ({
      x: event.title.length > 10 ? `${event.title.substring(0, 10)}...` : event.title,
      y: event.attendees_count || 0,
      checkedIn: event.checked_in_count || 0,
      checkInRate: event.attendees_count ? ((event.checked_in_count || 0) / event.attendees_count * 100).toFixed(0) : '0'
    }));

    const pieData = [
      { x: "Checked In", y: stats.totalCheckedIn },
      { x: "Not Checked In", y: stats.totalAttendees - stats.totalCheckedIn }
    ];
    
    return { barData, pieData };
  }, [filteredEvents, stats]);

  const distributionChartData = useMemo(() => {
    // Empty distribution data - feature not yet implemented
    const distributionData: Array<{ x: string; y: number }> = [];
    const totalEvents = 0;
    const colorScale: string[] = [];

    return { distributionData, colorScale, totalEvents };
  }, [theme]);

  return {
    stats,
    chartData,
    distributionChartData,
  };
};
