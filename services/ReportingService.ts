import { DatabaseService, Event, Attendee } from './DatabaseService';
import { format, parseISO, differenceInDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

// Types
export interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  todayEvents: number;
  totalAttendees: number;
  totalCheckedIn: number;
  averageAttendance: number;
  checkInRate: number;
}

export interface AttendanceTrendData {
  date: string;
  attendees: number;
  checkedIn: number;
  checkInRate: number;
}

export interface CheckInStats {
  eventId: string;
  eventTitle: string;
  totalAttendees: number;
  checkedIn: number;
  notCheckedIn: number;
  checkInRate: number;
  averageCheckInTime?: number;
}

export interface EventDistribution {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface AttendeeTypeData {
  type: string;
  count: number;
  percentage: number;
}

export interface CheckInRateTrend {
  date: string;
  rate: number;
  events: number;
}

export interface ReportData {
  generatedAt: string;
  dateRange: {
    start: string;
    end: string;
  };
  summary: EventStats;
  events: CheckInStats[];
  trends: AttendanceTrendData[];
  distribution: EventDistribution[];
}

export class ReportingService {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService();
  }

  // ==================== Overall Statistics ====================

  /**
   * Get overall event statistics
   */
  getOverallStats(): EventStats {
    const events = this.db.getEvents();
    const now = new Date();

    let totalAttendees = 0;
    let totalCheckedIn = 0;
    let upcomingEvents = 0;
    let pastEvents = 0;
    let todayEvents = 0;

    events.forEach(event => {
      const eventDate = parseISO(event.date);
      const isToday = format(eventDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
      const isPast = eventDate < startOfDay(now) && !isToday;
      const isUpcoming = eventDate > endOfDay(now);

      if (isToday) todayEvents++;
      else if (isPast) pastEvents++;
      else if (isUpcoming) upcomingEvents++;

      totalAttendees += event.attendees_count || 0;
      totalCheckedIn += event.checked_in_count || 0;
    });

    const averageAttendance = events.length > 0 ? totalAttendees / events.length : 0;
    const checkInRate = totalAttendees > 0 ? (totalCheckedIn / totalAttendees) * 100 : 0;

    return {
      totalEvents: events.length,
      upcomingEvents,
      pastEvents,
      todayEvents,
      totalAttendees,
      totalCheckedIn,
      averageAttendance: Math.round(averageAttendance * 10) / 10,
      checkInRate: Math.round(checkInRate * 10) / 10,
    };
  }

  // ==================== Event-Specific Statistics ====================

  /**
   * Get check-in statistics for a specific event
   */
  getEventCheckInStats(eventId: string): CheckInStats | null {
    const event = this.db.getEventById(eventId);
    if (!event) return null;

    const attendees = this.db.getAttendees(eventId);
    const checkedIn = attendees.filter(a => a.checked_in).length;
    const notCheckedIn = attendees.length - checkedIn;
    const checkInRate = attendees.length > 0 ? (checkedIn / attendees.length) * 100 : 0;

    // Calculate average check-in time (if available)
    const checkInTimes = attendees
      .filter(a => a.checked_in && a.check_in_time)
      .map(a => new Date(a.check_in_time!).getTime());

    const averageCheckInTime = checkInTimes.length > 0
      ? checkInTimes.reduce((sum, time) => sum + time, 0) / checkInTimes.length
      : undefined;

    return {
      eventId: event.id,
      eventTitle: event.title,
      totalAttendees: attendees.length,
      checkedIn,
      notCheckedIn,
      checkInRate: Math.round(checkInRate * 10) / 10,
      averageCheckInTime,
    };
  }

  // ==================== Trends & Analytics ====================

  /**
   * Get attendance trends over time
   */
  getAttendanceTrends(days: number = 30): AttendanceTrendData[] {
    const events = this.db.getEvents();
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Group events by date
    const trendMap = new Map<string, { attendees: number; checkedIn: number }>();

    events.forEach(event => {
      const eventDate = parseISO(event.date);
      
      if (eventDate >= startDate && eventDate <= now) {
        const dateKey = format(eventDate, 'yyyy-MM-dd');
        const existing = trendMap.get(dateKey) || { attendees: 0, checkedIn: 0 };
        
        trendMap.set(dateKey, {
          attendees: existing.attendees + (event.attendees_count || 0),
          checkedIn: existing.checkedIn + (event.checked_in_count || 0),
        });
      }
    });

    // Convert to array and calculate rates
    const trends: AttendanceTrendData[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const data = trendMap.get(dateKey) || { attendees: 0, checkedIn: 0 };
      const checkInRate = data.attendees > 0 ? (data.checkedIn / data.attendees) * 100 : 0;

      trends.push({
        date: dateKey,
        attendees: data.attendees,
        checkedIn: data.checkedIn,
        checkInRate: Math.round(checkInRate * 10) / 10,
      });
    }

    return trends;
  }

  /**
   * Get check-in rate trends
   */
  getCheckInRateTrends(days: number = 30): CheckInRateTrend[] {
    const events = this.db.getEvents();
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Group by date
    const trendMap = new Map<string, { totalAttendees: number; checkedIn: number; events: number }>();

    events.forEach(event => {
      const eventDate = parseISO(event.date);
      
      if (eventDate >= startDate && eventDate <= now) {
        const dateKey = format(eventDate, 'yyyy-MM-dd');
        const existing = trendMap.get(dateKey) || { totalAttendees: 0, checkedIn: 0, events: 0 };
        
        trendMap.set(dateKey, {
          totalAttendees: existing.totalAttendees + (event.attendees_count || 0),
          checkedIn: existing.checkedIn + (event.checked_in_count || 0),
          events: existing.events + 1,
        });
      }
    });

    // Convert to array
    const trends: CheckInRateTrend[] = [];
    trendMap.forEach((data, date) => {
      const rate = data.totalAttendees > 0 ? (data.checkedIn / data.totalAttendees) * 100 : 0;
      trends.push({
        date,
        rate: Math.round(rate * 10) / 10,
        events: data.events,
      });
    });

    return trends.sort((a, b) => a.date.localeCompare(b.date));
  }

  // ==================== Distribution & Breakdown ====================

  /**
   * Get event distribution (upcoming, today, past)
   */
  getEventDistribution(): EventDistribution[] {
    const events = this.db.getEvents();
    const now = new Date();

    let upcoming = 0;
    let today = 0;
    let past = 0;

    events.forEach(event => {
      const eventDate = parseISO(event.date);
      const isToday = format(eventDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
      const isPast = eventDate < startOfDay(now) && !isToday;

      if (isToday) today++;
      else if (isPast) past++;
      else upcoming++;
    });

    const total = events.length || 1; // Avoid division by zero

    return [
      {
        label: 'Upcoming',
        value: upcoming,
        percentage: Math.round((upcoming / total) * 100 * 10) / 10,
        color: '#3B82F6', // Blue
      },
      {
        label: 'Today',
        value: today,
        percentage: Math.round((today / total) * 100 * 10) / 10,
        color: '#10B981', // Green
      },
      {
        label: 'Past',
        value: past,
        percentage: Math.round((past / total) * 100 * 10) / 10,
        color: '#6B7280', // Gray
      },
    ];
  }

  /**
   * Get attendee type distribution (checked in vs not checked in)
   */
  getAttendeeTypeDistribution(): AttendeeTypeData[] {
    const events = this.db.getEvents();
    let checkedIn = 0;
    let notCheckedIn = 0;

    events.forEach(event => {
      checkedIn += event.checked_in_count || 0;
      notCheckedIn += (event.attendees_count || 0) - (event.checked_in_count || 0);
    });

    const total = checkedIn + notCheckedIn || 1;

    return [
      {
        type: 'Checked In',
        count: checkedIn,
        percentage: Math.round((checkedIn / total) * 100 * 10) / 10,
      },
      {
        type: 'Not Checked In',
        count: notCheckedIn,
        percentage: Math.round((notCheckedIn / total) * 100 * 10) / 10,
      },
    ];
  }

  // ==================== Report Generation ====================

  /**
   * Generate a comprehensive report
   */
  generateReport(startDate?: Date, endDate?: Date): ReportData {
    const events = this.db.getEvents();
    const now = new Date();
    
    // Default date range: last 30 days
    const start = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || now;

    // Filter events within date range
    const filteredEvents = events.filter(event => {
      const eventDate = parseISO(event.date);
      return isWithinInterval(eventDate, { start, end });
    });

    // Get stats for each event
    const eventStats: CheckInStats[] = filteredEvents
      .map(event => this.getEventCheckInStats(event.id))
      .filter((stat): stat is CheckInStats => stat !== null);

    return {
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd'),
      },
      summary: this.getOverallStats(),
      events: eventStats,
      trends: this.getAttendanceTrends(differenceInDays(end, start)),
      distribution: this.getEventDistribution(),
    };
  }

  // ==================== Export Helpers ====================

  /**
   * Format report data as CSV
   */
  formatReportAsCSV(report: ReportData): string {
    let csv = 'Ventry Event Report\n';
    csv += `Generated: ${format(new Date(report.generatedAt), 'MMM dd, yyyy HH:mm')}\n`;
    csv += `Date Range: ${report.dateRange.start} to ${report.dateRange.end}\n\n`;

    // Summary
    csv += 'SUMMARY\n';
    csv += `Total Events,${report.summary.totalEvents}\n`;
    csv += `Total Attendees,${report.summary.totalAttendees}\n`;
    csv += `Total Checked In,${report.summary.totalCheckedIn}\n`;
    csv += `Check-in Rate,${report.summary.checkInRate}%\n`;
    csv += `Average Attendance,${report.summary.averageAttendance}\n\n`;

    // Event Details
    csv += 'EVENT DETAILS\n';
    csv += 'Event,Total Attendees,Checked In,Not Checked In,Check-in Rate\n';
    report.events.forEach(event => {
      csv += `"${event.eventTitle}",${event.totalAttendees},${event.checkedIn},${event.notCheckedIn},${event.checkInRate}%\n`;
    });

    return csv;
  }

  /**
   * Get top performing events by check-in rate
   */
  getTopEvents(limit: number = 5): CheckInStats[] {
    const events = this.db.getEvents();
    const stats = events
      .map(event => this.getEventCheckInStats(event.id))
      .filter((stat): stat is CheckInStats => stat !== null)
      .sort((a, b) => b.checkInRate - a.checkInRate);

    return stats.slice(0, limit);
  }

  /**
   * Get events with low check-in rates (need attention)
   */
  getLowPerformingEvents(threshold: number = 50, limit: number = 5): CheckInStats[] {
    const events = this.db.getEvents();
    const stats = events
      .map(event => this.getEventCheckInStats(event.id))
      .filter((stat): stat is CheckInStats => stat !== null && stat.checkInRate < threshold)
      .sort((a, b) => a.checkInRate - b.checkInRate);

    return stats.slice(0, limit);
  }
}

export default new ReportingService();
