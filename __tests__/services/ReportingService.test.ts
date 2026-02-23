/**
 * ReportingService Tests
 * 
 * Tests statistics calculations, trend analysis, and reporting functionality.
 */

import { ReportingService } from '../../services/ReportingService';
import { createMockEvents, createMockAttendees } from '../setup/mocks';

describe('ReportingService - Statistics Calculations', () => {
  let service: ReportingService;

  beforeEach(() => {
    service = new ReportingService();
  });

  describe('calculateOverallStats', () => {
    it('should calculate total events', () => {
      const events = createMockEvents(5);
      
      const stats = service.calculateOverallStats(events);

      expect(stats.totalEvents).toBe(5);
    });

    it('should calculate total attendees', () => {
      const events = createMockEvents(2);
      events[0].attendees_count = 10;
      events[1].attendees_count = 15;
      
      const stats = service.calculateOverallStats(events);

      expect(stats.totalAttendees).toBe(25);
    });

    it('should calculate total checked in', () => {
      const events = createMockEvents(2);
      events[0].checked_in_count = 5;
      events[1].checked_in_count = 8;
      
      const stats = service.calculateOverallStats(events);

      expect(stats.totalCheckedIn).toBe(13);
    });

    it('should calculate check-in rate', () => {
      const events = createMockEvents(1);
      events[0].attendees_count = 100;
      events[0].checked_in_count = 75;
      
      const stats = service.calculateOverallStats(events);

      expect(stats.checkInRate).toBe(75);
    });

    it('should handle zero attendees', () => {
      const events = createMockEvents(1);
      events[0].attendees_count = 0;
      events[0].checked_in_count = 0;
      
      const stats = service.calculateOverallStats(events);

      expect(stats.checkInRate).toBe(0);
    });

    it('should calculate average attendees per event', () => {
      const events = createMockEvents(3);
      events[0].attendees_count = 10;
      events[1].attendees_count = 20;
      events[2].attendees_count = 30;
      
      const stats = service.calculateOverallStats(events);

      expect(stats.averageAttendeesPerEvent).toBe(20);
    });

    it('should handle empty events array', () => {
      const stats = service.calculateOverallStats([]);

      expect(stats.totalEvents).toBe(0);
      expect(stats.totalAttendees).toBe(0);
      expect(stats.checkInRate).toBe(0);
    });

    it('should round check-in rate to 2 decimals', () => {
      const events = createMockEvents(1);
      events[0].attendees_count = 3;
      events[0].checked_in_count = 2;
      
      const stats = service.calculateOverallStats(events);

      expect(stats.checkInRate).toBeCloseTo(66.67, 2);
    });
  });

  describe('calculateEventStats', () => {
    it('should calculate stats for single event', () => {
      const event = createMockEvents(1)[0];
      event.attendees_count = 50;
      event.checked_in_count = 30;
      
      const stats = service.calculateEventStats(event);

      expect(stats.totalAttendees).toBe(50);
      expect(stats.checkedIn).toBe(30);
      expect(stats.notCheckedIn).toBe(20);
      expect(stats.checkInRate).toBe(60);
    });

    it('should handle event with no attendees', () => {
      const event = createMockEvents(1)[0];
      event.attendees_count = 0;
      event.checked_in_count = 0;
      
      const stats = service.calculateEventStats(event);

      expect(stats.checkInRate).toBe(0);
    });

    it('should calculate completion percentage', () => {
      const event = createMockEvents(1)[0];
      event.expected_attendees = 100;
      event.attendees_count = 75;
      
      const stats = service.calculateEventStats(event);

      expect(stats.completionPercentage).toBe(75);
    });

    it('should handle missing expected attendees', () => {
      const event = createMockEvents(1)[0];
      event.expected_attendees = null;
      event.attendees_count = 50;
      
      const stats = service.calculateEventStats(event);

      expect(stats.completionPercentage).toBe(100);
    });
  });
});

describe('ReportingService - Trend Analysis', () => {
  let service: ReportingService;

  beforeEach(() => {
    service = new ReportingService();
  });

  describe('calculateAttendanceTrends', () => {
    it('should calculate trends over time', () => {
      const events = createMockEvents(5);
      
      const trends = service.calculateAttendanceTrends(events, 7);

      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
    });

    it('should group by days', () => {
      const events = createMockEvents(3);
      const today = new Date();
      events[0].date = today.toISOString().split('T')[0];
      events[1].date = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      events[2].date = new Date(today.getTime() - 48 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const trends = service.calculateAttendanceTrends(events, 7);

      expect(trends.length).toBeLessThanOrEqual(7);
    });

    it('should sum attendees for same day', () => {
      const events = createMockEvents(2);
      const today = new Date().toISOString().split('T')[0];
      events[0].date = today;
      events[0].attendees_count = 10;
      events[1].date = today;
      events[1].attendees_count = 15;
      
      const trends = service.calculateAttendanceTrends(events, 7);
      const todayTrend = trends.find(t => t.date === today);

      expect(todayTrend?.count).toBe(25);
    });

    it('should handle empty events', () => {
      const trends = service.calculateAttendanceTrends([], 7);

      expect(trends).toEqual([]);
    });

    it('should limit to specified days', () => {
      const events = createMockEvents(10);
      
      const trends = service.calculateAttendanceTrends(events, 5);

      expect(trends.length).toBeLessThanOrEqual(5);
    });
  });

  describe('calculateCheckInRateTrends', () => {
    it('should calculate check-in rate trends', () => {
      const events = createMockEvents(3);
      events.forEach((e, i) => {
        e.attendees_count = 100;
        e.checked_in_count = 50 + i * 10;
      });
      
      const trends = service.calculateCheckInRateTrends(events, 7);

      expect(Array.isArray(trends)).toBe(true);
      expect(trends.every(t => t.rate >= 0 && t.rate <= 100)).toBe(true);
    });

    it('should handle events with no attendees', () => {
      const events = createMockEvents(2);
      events[0].attendees_count = 0;
      events[1].attendees_count = 100;
      events[1].checked_in_count = 50;
      
      const trends = service.calculateCheckInRateTrends(events, 7);

      expect(trends).toBeDefined();
    });

    it('should calculate average rate for same day', () => {
      const events = createMockEvents(2);
      const today = new Date().toISOString().split('T')[0];
      events[0].date = today;
      events[0].attendees_count = 100;
      events[0].checked_in_count = 60;
      events[1].date = today;
      events[1].attendees_count = 100;
      events[1].checked_in_count = 80;
      
      const trends = service.calculateCheckInRateTrends(events, 7);
      const todayTrend = trends.find(t => t.date === today);

      expect(todayTrend?.rate).toBe(70); // Average of 60% and 80%
    });
  });
});

describe('ReportingService - Event Distribution', () => {
  let service: ReportingService;

  beforeEach(() => {
    service = new ReportingService();
  });

  describe('categorizeEvents', () => {
    it('should categorize upcoming events', () => {
      const events = createMockEvents(1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      events[0].date = tomorrow.toISOString().split('T')[0];
      
      const categories = service.categorizeEvents(events);

      expect(categories.upcoming).toHaveLength(1);
      expect(categories.today).toHaveLength(0);
      expect(categories.past).toHaveLength(0);
    });

    it('should categorize today events', () => {
      const events = createMockEvents(1);
      events[0].date = new Date().toISOString().split('T')[0];
      
      const categories = service.categorizeEvents(events);

      expect(categories.today).toHaveLength(1);
    });

    it('should categorize past events', () => {
      const events = createMockEvents(1);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      events[0].date = yesterday.toISOString().split('T')[0];
      
      const categories = service.categorizeEvents(events);

      expect(categories.past).toHaveLength(1);
    });

    it('should calculate percentages', () => {
      const events = createMockEvents(4);
      const today = new Date();
      events[0].date = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Tomorrow
      events[1].date = today.toISOString().split('T')[0]; // Today
      events[2].date = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Yesterday
      events[3].date = new Date(today.getTime() - 48 * 60 * 60 * 1000).toISOString().split('T')[0]; // 2 days ago
      
      const categories = service.categorizeEvents(events);

      expect(categories.upcomingPercentage).toBe(25);
      expect(categories.todayPercentage).toBe(25);
      expect(categories.pastPercentage).toBe(50);
    });

    it('should handle empty events', () => {
      const categories = service.categorizeEvents([]);

      expect(categories.upcoming).toEqual([]);
      expect(categories.today).toEqual([]);
      expect(categories.past).toEqual([]);
      expect(categories.upcomingPercentage).toBe(0);
    });
  });

  describe('getAttendeeTypeDistribution', () => {
    it('should calculate checked-in vs not-checked-in', () => {
      const attendees = createMockAttendees(10, 'event-1');
      
      const distribution = service.getAttendeeTypeDistribution(attendees);

      expect(distribution.checkedIn).toBeGreaterThanOrEqual(0);
      expect(distribution.notCheckedIn).toBeGreaterThanOrEqual(0);
      expect(distribution.checkedIn + distribution.notCheckedIn).toBe(10);
    });

    it('should calculate percentages', () => {
      const attendees = createMockAttendees(10, 'event-1');
      
      const distribution = service.getAttendeeTypeDistribution(attendees);

      expect(distribution.checkedInPercentage).toBeGreaterThanOrEqual(0);
      expect(distribution.checkedInPercentage).toBeLessThanOrEqual(100);
    });

    it('should handle empty attendees', () => {
      const distribution = service.getAttendeeTypeDistribution([]);

      expect(distribution.checkedIn).toBe(0);
      expect(distribution.notCheckedIn).toBe(0);
      expect(distribution.checkedInPercentage).toBe(0);
    });

    it('should handle all checked-in', () => {
      const attendees = createMockAttendees(5, 'event-1').map(a => ({
        ...a,
        checkedIn: true,
      }));
      
      const distribution = service.getAttendeeTypeDistribution(attendees);

      expect(distribution.checkedIn).toBe(5);
      expect(distribution.notCheckedIn).toBe(0);
      expect(distribution.checkedInPercentage).toBe(100);
    });
  });
});

describe('ReportingService - Performance Metrics', () => {
  let service: ReportingService;

  beforeEach(() => {
    service = new ReportingService();
  });

  describe('getTopPerformingEvents', () => {
    it('should return events sorted by check-in rate', () => {
      const events = createMockEvents(3);
      events[0].attendees_count = 100;
      events[0].checked_in_count = 90;
      events[1].attendees_count = 100;
      events[1].checked_in_count = 50;
      events[2].attendees_count = 100;
      events[2].checked_in_count = 70;
      
      const topEvents = service.getTopPerformingEvents(events, 2);

      expect(topEvents).toHaveLength(2);
      expect(topEvents[0].checked_in_count).toBe(90);
      expect(topEvents[1].checked_in_count).toBe(70);
    });

    it('should limit to specified count', () => {
      const events = createMockEvents(10);
      
      const topEvents = service.getTopPerformingEvents(events, 5);

      expect(topEvents.length).toBeLessThanOrEqual(5);
    });

    it('should handle empty events', () => {
      const topEvents = service.getTopPerformingEvents([], 5);

      expect(topEvents).toEqual([]);
    });

    it('should exclude events with no attendees', () => {
      const events = createMockEvents(2);
      events[0].attendees_count = 0;
      events[1].attendees_count = 100;
      events[1].checked_in_count = 50;
      
      const topEvents = service.getTopPerformingEvents(events, 5);

      expect(topEvents).toHaveLength(1);
    });
  });

  describe('getLowPerformingEvents', () => {
    it('should return events sorted by low check-in rate', () => {
      const events = createMockEvents(3);
      events[0].attendees_count = 100;
      events[0].checked_in_count = 10;
      events[1].attendees_count = 100;
      events[1].checked_in_count = 90;
      events[2].attendees_count = 100;
      events[2].checked_in_count = 30;
      
      const lowEvents = service.getLowPerformingEvents(events, 2);

      expect(lowEvents).toHaveLength(2);
      expect(lowEvents[0].checked_in_count).toBe(10);
      expect(lowEvents[1].checked_in_count).toBe(30);
    });

    it('should limit to specified count', () => {
      const events = createMockEvents(10);
      
      const lowEvents = service.getLowPerformingEvents(events, 3);

      expect(lowEvents.length).toBeLessThanOrEqual(3);
    });

    it('should handle empty events', () => {
      const lowEvents = service.getLowPerformingEvents([], 5);

      expect(lowEvents).toEqual([]);
    });
  });

  describe('calculateEventCompletionRates', () => {
    it('should calculate completion rates', () => {
      const events = createMockEvents(2);
      events[0].expected_attendees = 100;
      events[0].attendees_count = 75;
      events[1].expected_attendees = 50;
      events[1].attendees_count = 50;
      
      const rates = service.calculateEventCompletionRates(events);

      expect(rates[0].completionRate).toBe(75);
      expect(rates[1].completionRate).toBe(100);
    });

    it('should handle events without expected attendees', () => {
      const events = createMockEvents(1);
      events[0].expected_attendees = null;
      events[0].attendees_count = 50;
      
      const rates = service.calculateEventCompletionRates(events);

      expect(rates[0].completionRate).toBe(100);
    });

    it('should handle empty events', () => {
      const rates = service.calculateEventCompletionRates([]);

      expect(rates).toEqual([]);
    });
  });
});

describe('ReportingService - Time-based Filtering', () => {
  let service: ReportingService;

  beforeEach(() => {
    service = new ReportingService();
  });

  describe('filterEventsByTimeRange', () => {
    it('should filter events by week', () => {
      const events = createMockEvents(5);
      const today = new Date();
      events[0].date = today.toISOString().split('T')[0];
      events[1].date = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      events[2].date = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const filtered = service.filterEventsByTimeRange(events, 'week');

      expect(filtered.length).toBeLessThanOrEqual(events.length);
    });

    it('should filter events by month', () => {
      const events = createMockEvents(5);
      
      const filtered = service.filterEventsByTimeRange(events, 'month');

      expect(Array.isArray(filtered)).toBe(true);
    });

    it('should return all events for "all" range', () => {
      const events = createMockEvents(5);
      
      const filtered = service.filterEventsByTimeRange(events, 'all');

      expect(filtered).toEqual(events);
    });

    it('should handle empty events', () => {
      const filtered = service.filterEventsByTimeRange([], 'week');

      expect(filtered).toEqual([]);
    });
  });
});
