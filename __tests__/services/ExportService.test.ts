/**
 * ExportService Tests
 * 
 * Tests export functionality for events and attendees.
 */

import { ExportService, ExportFormat, ExportOptions } from '../../services/ExportService';
import { mockEvent, mockAttendee, mockAttendee2, createMockEvents, createMockAttendees } from '../setup/mocks';
import CsvService from '../../services/CsvService';

// Mock DatabaseService
jest.mock('../../services/DatabaseService', () => {
  const mockDb = {
    getEventById: jest.fn(),
    getAttendees: jest.fn(),
  };
  
  return {
    DatabaseService: jest.fn().mockImplementation(() => mockDb),
    mockDb, // Export for test access
  };
});

// Mock CsvService
jest.mock('../../services/CsvService', () => ({
  __esModule: true,
  default: {
    exportAttendeesToCsv: jest.fn().mockResolvedValue('file://attendees.csv'),
    exportEventToCsv: jest.fn().mockResolvedValue('file://event.csv'),
    shareCsvFile: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock expo-file-system File class
jest.mock('expo-file-system', () => ({
  Paths: {
    document: '/mock/documents',
  },
  File: jest.fn().mockImplementation((pathOrDir: string, filename?: string) => {
    // Handle both File(path) and File(dir, filename) constructors
    const fullPath = filename ? `${pathOrDir}/${filename}` : pathOrDir;
    return {
      uri: fullPath,
      write: jest.fn().mockResolvedValue(undefined),
      text: jest.fn().mockResolvedValue('mock file content'),
    };
  }),
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn().mockResolvedValue(undefined),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));

// Mock Alert
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Alert: {
    alert: jest.fn(),
  },
}));

// Get mock database from the mocked module
const { mockDb } = jest.requireMock('../../services/DatabaseService');

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExportService();
    
    // Setup default mock returns
    mockDb.getEventById.mockReturnValue(mockEvent);
    mockDb.getAttendees.mockReturnValue([mockAttendee, mockAttendee2]);
  });

  describe('exportAttendees', () => {
    it('should export attendees to CSV by default', async () => {
      const filePath = await service.exportAttendees('event-1');

      expect(mockDb.getEventById).toHaveBeenCalledWith('event-1');
      expect(mockDb.getAttendees).toHaveBeenCalledWith('event-1');
      expect(CsvService.exportAttendeesToCsv).toHaveBeenCalled();
      expect(filePath).toBe('file://attendees.csv');
    });

    it('should throw error if event not found', async () => {
      mockDb.getEventById.mockReturnValue(null);

      await expect(service.exportAttendees('invalid-id')).rejects.toThrow('Event not found');
    });

    it('should throw error if no attendees to export', async () => {
      mockDb.getAttendees.mockReturnValue([]);

      await expect(service.exportAttendees('event-1')).rejects.toThrow('No attendees to export');
    });

    it('should export to JSON format', async () => {
      const options: ExportOptions = { format: ExportFormat.JSON };
      
      const filePath = await service.exportAttendees('event-1', options);

      expect(filePath).toContain('.json');
      expect(CsvService.exportAttendeesToCsv).not.toHaveBeenCalled();
    });

    it('should include check-in status when requested', async () => {
      const options: ExportOptions = { 
        format: ExportFormat.CSV,
        includeCheckInStatus: true 
      };

      await service.exportAttendees('event-1', options);

      expect(CsvService.exportAttendeesToCsv).toHaveBeenCalledWith(
        expect.any(Array),
        mockEvent,
        true
      );
    });

    it('should exclude check-in status when not requested', async () => {
      const options: ExportOptions = { 
        format: ExportFormat.CSV,
        includeCheckInStatus: false 
      };

      await service.exportAttendees('event-1', options);

      expect(CsvService.exportAttendeesToCsv).toHaveBeenCalledWith(
        expect.any(Array),
        mockEvent,
        false
      );
    });

    it('should filter fields when includeFields is specified', async () => {
      const options: ExportOptions = { 
        format: ExportFormat.JSON,
        includeFields: ['name', 'email']
      };

      const filePath = await service.exportAttendees('event-1', options);

      expect(filePath).toContain('.json');
    });

    it('should encrypt file when password is provided', async () => {
      const options: ExportOptions = { 
        format: ExportFormat.CSV,
        password: 'secret123'
      };

      const filePath = await service.exportAttendees('event-1', options);

      expect(filePath).toContain('.encrypted');
    });
  });

  describe('exportEvent', () => {
    it('should export event to CSV by default', async () => {
      const filePath = await service.exportEvent('event-1');

      expect(mockDb.getEventById).toHaveBeenCalledWith('event-1');
      expect(CsvService.exportEventToCsv).toHaveBeenCalledWith(mockEvent);
      expect(filePath).toBe('file://event.csv');
    });

    it('should throw error if event not found', async () => {
      mockDb.getEventById.mockReturnValue(null);

      await expect(service.exportEvent('invalid-id')).rejects.toThrow('Event not found');
    });

    it('should export to JSON format', async () => {
      const options: ExportOptions = { format: ExportFormat.JSON };
      
      const filePath = await service.exportEvent('event-1', options);

      expect(filePath).toContain('.json');
      expect(CsvService.exportEventToCsv).not.toHaveBeenCalled();
    });

    it('should encrypt file when password is provided', async () => {
      const options: ExportOptions = { 
        format: ExportFormat.CSV,
        password: 'secret123'
      };

      const filePath = await service.exportEvent('event-1', options);

      expect(filePath).toContain('.encrypted');
    });
  });

  describe('batchExportEvents', () => {
    it('should export multiple events', async () => {
      const events = createMockEvents(3);
      mockDb.getEventById.mockImplementation((id: string) => 
        events.find(e => e.id === id) || null
      );
      mockDb.getAttendees.mockReturnValue([mockAttendee]);

      const filePath = await service.batchExportEvents(['event-1', 'event-2', 'event-3']);

      expect(mockDb.getEventById).toHaveBeenCalledTimes(3);
      expect(filePath).toMatch(/batch_export_.*\.csv/);
    });

    it('should handle missing events gracefully', async () => {
      mockDb.getEventById.mockReturnValue(null);
      mockDb.getAttendees.mockReturnValue([]);

      const filePath = await service.batchExportEvents(['invalid-1', 'invalid-2']);

      expect(filePath).toMatch(/batch_export_.*\.csv/);
    });

    it('should include attendee information', async () => {
      mockDb.getEventById.mockReturnValue(mockEvent);
      mockDb.getAttendees.mockReturnValue([mockAttendee, mockAttendee2]);

      const filePath = await service.batchExportEvents(['event-1']);

      expect(mockDb.getAttendees).toHaveBeenCalledWith('event-1');
      expect(filePath).toBeDefined();
    });
  });

  describe('shareFile', () => {
    it('should share file using CsvService', async () => {
      await service.shareFile('file://test.csv', 'Test Export');

      expect(CsvService.shareCsvFile).toHaveBeenCalledWith('file://test.csv', 'Test Export');
    });

    it('should use default title if not provided', async () => {
      await service.shareFile('file://test.csv');

      expect(CsvService.shareCsvFile).toHaveBeenCalledWith('file://test.csv', 'Share File');
    });
  });

  describe('getEventStatistics', () => {
    it('should calculate event statistics', () => {
      const attendees = [
        { ...mockAttendee, checked_in: true },
        { ...mockAttendee2, checked_in: false },
      ];
      mockDb.getAttendees.mockReturnValue(attendees);

      const stats = service.getEventStatistics('event-1');

      expect(stats.eventName).toBe(mockEvent.title);
      expect(stats.totalAttendees).toBe(2);
      expect(stats.checkedIn).toBe(1);
      expect(stats.notCheckedIn).toBe(1);
      expect(stats.checkInRate).toBe('50.0%');
    });

    it('should throw error if event not found', () => {
      mockDb.getEventById.mockReturnValue(null);

      expect(() => service.getEventStatistics('invalid-id')).toThrow('Event not found');
    });

    it('should handle zero attendees', () => {
      mockDb.getAttendees.mockReturnValue([]);

      const stats = service.getEventStatistics('event-1');

      expect(stats.totalAttendees).toBe(0);
      expect(stats.checkedIn).toBe(0);
      expect(stats.checkInRate).toBe('0.0%');
    });

    it('should group check-ins by hour', () => {
      const attendees = [
        { 
          ...mockAttendee, 
          checked_in: true, 
          check_in_time: '2026-02-20T10:30:00Z' 
        },
        { 
          ...mockAttendee2, 
          checked_in: true, 
          check_in_time: '2026-02-20T10:45:00Z' 
        },
      ];
      mockDb.getAttendees.mockReturnValue(attendees);

      const stats = service.getEventStatistics('event-1');

      expect(stats.checkInsByHour).toBeDefined();
      expect(typeof stats.checkInsByHour).toBe('object');
    });
  });

  describe('getActiveTasks', () => {
    it('should return empty array initially', () => {
      const tasks = service.getActiveTasks();

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBe(0);
    });
  });

  describe('getTaskStatus', () => {
    it('should return undefined for non-existent task', () => {
      const status = service.getTaskStatus('non-existent-id');

      expect(status).toBeUndefined();
    });
  });
});
