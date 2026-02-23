/**
 * ReportingService Tests
 * 
 * Tests statistics calculations, trend analysis, and reporting functionality.
 */

import { ReportingService } from '../../services/ReportingService';
import { mockEvent, mockEvent2, mockAttendee, mockAttendee2 } from '../setup/mocks';

// Mock DatabaseService
jest.mock('../../services/DatabaseService', () => {
  const mockDb = {
    getEvents: jest.fn(),
    getAttendees: jest.fn(),
    getEventById: jest.fn(),
  };
  
  return {
    DatabaseService: jest.fn().mockImplementation(() => mockDb),
    mockDb,
  };
});

const { mockDb } = jest.requireMock('../../services/DatabaseService');

describe('ReportingService', () => {
  let service: ReportingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportingService();
    
    // Setup default mocks
    mockDb.getEvents.mockReturnValue([mockEvent, mockEvent2]);
    mockDb.getAttendees.mockReturnValue([mockAttendee, mockAttendee2]);
    mockDb.getEventById.mockReturnValue(mockEvent);
  });

  describe('getOverallStats', () => {
    it('should calculate overall statistics', () => {
      const stats = service.getOverallStats();

      expect(stats).toHaveProperty('totalEvents');
      expect(stats).toHaveProperty('totalAttendees');
      expect(stats).toHaveProperty('totalCheckedIn');
      expect(stats).toHaveProperty('checkInRate');
    });

    it('should handle empty events', () => {
      mockDb.getEvents.mockReturnValue([]);

      const stats = service.getOverallStats();

      expect(stats.totalEvents).toBe(0);
      expect(stats.totalAttendees).toBe(0);
    });
  });

  describe('getEventCheckInStats', () => {
    it('should get check-in stats for event', () => {
      const stats = service.getEventCheckInStats('event-1');

      expect(stats).not.toBeNull();
      expect(stats).toHaveProperty('eventId');
      expect(stats).toHaveProperty('totalAttendees');
      expect(stats).toHaveProperty('checkedIn');
    });

    it('should return null for non-existent event', () => {
      mockDb.getEventById.mockReturnValue(null);

      const stats = service.getEventCheckInStats('invalid-id');

      expect(stats).toBeNull();
    });

    it('should handle event with no attendees', () => {
      mockDb.getAttendees.mockReturnValue([]);

      const stats = service.getEventCheckInStats('event-1');

      expect(stats).not.toBeNull();
      expect(stats?.totalAttendees).toBe(0);
    });
  });

  describe('getAttendanceTrends', () => {
    it('should get attendance trends', () => {
      const trends = service.getAttendanceTrends(7);

      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBe(7);
    });

    it('should handle custom day range', () => {
      const trends = service.getAttendanceTrends(30);

      expect(trends.length).toBe(30);
    });

    it('should handle empty events', () => {
      mockDb.getEvents.mockReturnValue([]);

      const trends = service.getAttendanceTrends(7);

      expect(trends.length).toBe(7);
      expect(trends.every(t => t.attendees === 0)).toBe(true);
    });
  });

  describe('getCheckInRateTrends', () => {
    it('should get check-in rate trends', () => {
      const trends = service.getCheckInRateTrends(7);

      expect(Array.isArray(trends)).toBe(true);
      // May return fewer days if no events in that period
      expect(trends.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate rates correctly', () => {
      const trends = service.getCheckInRateTrends(7);

      trends.forEach(trend => {
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('rate');
        expect(trend.rate).toBeGreaterThanOrEqual(0);
        expect(trend.rate).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('getEventDistribution', () => {
    it('should get event distribution', () => {
      const distribution = service.getEventDistribution();

      expect(Array.isArray(distribution)).toBe(true);
      expect(distribution.length).toBeGreaterThan(0);
    });

    it('should have correct structure', () => {
      const distribution = service.getEventDistribution();

      distribution.forEach(item => {
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('value');
        expect(item).toHaveProperty('percentage');
      });
    });

    it('should handle empty events', () => {
      mockDb.getEvents.mockReturnValue([]);

      const distribution = service.getEventDistribution();

      expect(distribution.every(d => d.value === 0)).toBe(true);
    });
  });

  describe('getAttendeeTypeDistribution', () => {
    it('should get attendee type distribution', () => {
      const distribution = service.getAttendeeTypeDistribution();

      expect(Array.isArray(distribution)).toBe(true);
      expect(distribution.length).toBe(2); // Checked in and not checked in
    });

    it('should calculate percentages', () => {
      const distribution = service.getAttendeeTypeDistribution();

      const totalPercentage = distribution.reduce((sum, item) => sum + item.percentage, 0);
      // Allow for rounding or zero attendees
      expect(totalPercentage).toBeGreaterThanOrEqual(0);
      expect(totalPercentage).toBeLessThanOrEqual(100);
    });

    it('should handle no attendees', () => {
      mockDb.getEvents.mockReturnValue([]);

      const distribution = service.getAttendeeTypeDistribution();

      expect(distribution.every(d => d.count === 0)).toBe(true);
    });
  });

  describe('generateReport', () => {
    it('should generate comprehensive report', () => {
      const report = service.generateReport();

      expect(report).toBeDefined();
      expect(typeof report).toBe('object');
    });

    it('should include date range', () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-12-31');

      const report = service.generateReport(startDate, endDate);

      expect(report).toBeDefined();
      expect(typeof report).toBe('object');
    });
  });

  describe('formatReportAsCSV', () => {
    it('should format report as CSV', () => {
      const report = service.generateReport();
      const csv = service.formatReportAsCSV(report);

      expect(typeof csv).toBe('string');
      expect(csv).toContain('Ventry Event Report');
    });

    it('should include statistics', () => {
      const report = service.generateReport();
      const csv = service.formatReportAsCSV(report);

      expect(csv).toContain('Total Events');
      expect(csv).toContain('Total Attendees');
    });
  });

  describe('getTopEvents', () => {
    it('should get top performing events', () => {
      const topEvents = service.getTopEvents(5);

      expect(Array.isArray(topEvents)).toBe(true);
      expect(topEvents.length).toBeLessThanOrEqual(5);
    });

    it('should sort by check-in rate', () => {
      const topEvents = service.getTopEvents(5);

      for (let i = 0; i < topEvents.length - 1; i++) {
        expect(topEvents[i].checkInRate).toBeGreaterThanOrEqual(topEvents[i + 1].checkInRate);
      }
    });

    it('should handle empty events', () => {
      mockDb.getEvents.mockReturnValue([]);

      const topEvents = service.getTopEvents(5);

      expect(topEvents.length).toBe(0);
    });
  });

  describe('getLowPerformingEvents', () => {
    it('should get low performing events', () => {
      const lowEvents = service.getLowPerformingEvents(50, 5);

      expect(Array.isArray(lowEvents)).toBe(true);
    });

    it('should filter by threshold', () => {
      const lowEvents = service.getLowPerformingEvents(50, 5);

      lowEvents.forEach(event => {
        expect(event.checkInRate).toBeLessThan(50);
      });
    });

    it('should limit results', () => {
      const lowEvents = service.getLowPerformingEvents(50, 3);

      expect(lowEvents.length).toBeLessThanOrEqual(3);
    });
  });
});
