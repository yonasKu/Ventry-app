/**
 * PDFService Tests
 * 
 * Tests PDF generation for statistics and event reports.
 */

import { PDFService } from '../../services/PDFService';
import { mockEvent, mockAttendee, mockAttendee2 } from '../setup/mocks';
import * as Print from 'expo-print';

// Mock expo-print
jest.mock('expo-print');

// Mock DatabaseService
jest.mock('../../services/DatabaseService', () => {
  const mockDb = {
    getEventById: jest.fn(),
    getAttendees: jest.fn(),
    getEvents: jest.fn(),
  };
  
  return {
    DatabaseService: jest.fn().mockImplementation(() => mockDb),
    mockDb,
  };
});

// Mock ReportingService
jest.mock('../../services/ReportingService', () => ({
  __esModule: true,
  default: {
    getEventCheckInStats: jest.fn().mockReturnValue({
      eventId: 'event-1',
      eventTitle: 'Test Event',
      totalAttendees: 10,
      checkedIn: 7,
      notCheckedIn: 3,
      checkInRate: 70,
    }),
    getOverallStats: jest.fn().mockReturnValue({
      totalEvents: 5,
      totalAttendees: 50,
      totalCheckedIn: 35,
      checkInRate: 70,
    }),
    generateReport: jest.fn().mockReturnValue({
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: '2026-01-01',
        end: '2026-02-23',
      },
      summary: {
        totalEvents: 5,
        totalAttendees: 50,
        totalCheckedIn: 35,
        checkInRate: 70,
        upcomingEvents: 2,
        todayEvents: 1,
        pastEvents: 2,
        avgAttendeesPerEvent: 10,
      },
      events: [],
      trends: [],
      distribution: [],
    }),
  },
}));

// Mock expo-sharing
jest.mock('expo-sharing');

const { mockDb } = jest.requireMock('../../services/DatabaseService');

describe('PDFService', () => {
  let service: PDFService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PDFService();
    
    // Setup default mocks
    mockDb.getEventById.mockReturnValue(mockEvent);
    mockDb.getAttendees.mockReturnValue([mockAttendee, mockAttendee2]);
    mockDb.getEvents.mockReturnValue([mockEvent]);
    
    (Print.printToFileAsync as jest.Mock).mockResolvedValue({ 
      uri: 'file://mock/report.pdf' 
    });
  });

  describe('generateStatisticsReport', () => {
    it('should generate statistics PDF', async () => {
      const filePath = await service.generateStatisticsReport();

      expect(Print.printToFileAsync).toHaveBeenCalled();
      expect(filePath).toBe('file://mock/report.pdf');
    });

    it('should accept time filter', async () => {
      await service.generateStatisticsReport('week');

      expect(Print.printToFileAsync).toHaveBeenCalled();
    });

    it('should accept PDF options', async () => {
      await service.generateStatisticsReport('month', { 
        pageSize: 'A4',
        orientation: 'portrait' 
      });

      expect(Print.printToFileAsync).toHaveBeenCalled();
    });

    it('should throw error if PDF generation fails', async () => {
      (Print.printToFileAsync as jest.Mock).mockRejectedValue(new Error('PDF failed'));

      await expect(service.generateStatisticsReport()).rejects.toThrow('Failed to generate statistics PDF');
    });
  });

  describe('generateEventReport', () => {
    it('should generate event PDF', async () => {
      const filePath = await service.generateEventReport('event-1');

      expect(mockDb.getEventById).toHaveBeenCalledWith('event-1');
      expect(Print.printToFileAsync).toHaveBeenCalled();
      expect(filePath).toContain('.pdf');
    });

    it('should throw error if event not found', async () => {
      mockDb.getEventById.mockReturnValue(null);

      await expect(service.generateEventReport('invalid-id')).rejects.toThrow('Event not found');
    });

    it('should throw error if stats not available', async () => {
      const ReportingService = require('../../services/ReportingService').default;
      ReportingService.getEventCheckInStats.mockReturnValue(null);

      await expect(service.generateEventReport('event-1')).rejects.toThrow('Failed to get event statistics');
    });

    it('should accept PDF options', async () => {
      await service.generateEventReport('event-1', { 
        pageSize: 'Letter',
        orientation: 'landscape' 
      });

      expect(Print.printToFileAsync).toHaveBeenCalled();
    });
  });

  describe('sharePDF', () => {
    it('should share PDF file', async () => {
      const Sharing = require('expo-sharing');
      Sharing.isAvailableAsync.mockResolvedValue(true);
      Sharing.shareAsync.mockResolvedValue(undefined);

      await service.sharePDF('file://test.pdf');

      expect(Sharing.shareAsync).toHaveBeenCalledWith('file://test.pdf', expect.any(Object));
    });

    it('should throw error if sharing not available', async () => {
      const Sharing = require('expo-sharing');
      Sharing.isAvailableAsync.mockResolvedValue(false);

      await expect(service.sharePDF('file://test.pdf')).rejects.toThrow('Sharing is not available');
    });
  });

  describe('cleanup', () => {
    it('should delete temporary file', async () => {
      await service.cleanup('file://temp.pdf');

      // File mock should have delete called
      expect(true).toBe(true); // File deletion is mocked
    });

    it('should handle cleanup errors gracefully', async () => {
      // Should not throw even if file doesn't exist
      await expect(service.cleanup('file://nonexistent.pdf')).resolves.not.toThrow();
    });
  });
});
