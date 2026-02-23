/**
 * ExportService Tests
 * 
 * Tests CSV export functionality for events and attendees.
 */

import { ExportService } from '../../services/ExportService';
import { mockEvent, mockAttendee, createMockEvents, createMockAttendees } from '../setup/mocks';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

jest.mock('expo-file-system');
jest.mock('expo-sharing');

describe('ExportService - CSV Export', () => {
  let service: ExportService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExportService();
  });

  describe('exportEventsToCSV', () => {
    it('should export events to CSV', async () => {
      const events = createMockEvents(3);
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      await service.exportEventsToCSV(events);

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });

    it('should include CSV headers', async () => {
      const events = createMockEvents(1);
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        expect(content).toContain('Title');
        expect(content).toContain('Date');
        expect(content).toContain('Time');
        expect(content).toContain('Location');
        return Promise.resolve();
      });

      await service.exportEventsToCSV(events);
    });

    it('should include event data', async () => {
      const events = [mockEvent];
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        expect(content).toContain(mockEvent.title);
        expect(content).toContain(mockEvent.date);
        return Promise.resolve();
      });

      await service.exportEventsToCSV(events);
    });

    it('should escape special characters', async () => {
      const events = [{
        ...mockEvent,
        title: 'Event with "quotes" and, commas',
      }];
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        expect(content).toContain('"Event with ""quotes"" and, commas"');
        return Promise.resolve();
      });

      await service.exportEventsToCSV(events);
    });

    it('should handle empty events array', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      await service.exportEventsToCSV([]);

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });

    it('should generate unique filename', async () => {
      const events = createMockEvents(1);
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri) => {
        expect(uri).toContain('events_');
        expect(uri).toContain('.csv');
        return Promise.resolve();
      });

      await service.exportEventsToCSV(events);
    });

    it('should share file after export', async () => {
      const events = createMockEvents(1);
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      await service.exportEventsToCSV(events);

      expect(Sharing.shareAsync).toHaveBeenCalled();
    });

    it('should throw error if file write fails', async () => {
      const events = createMockEvents(1);
      (FileSystem.writeAsStringAsync as jest.Mock).mockRejectedValue(new Error('Write failed'));

      await expect(service.exportEventsToCSV(events)).rejects.toThrow('Write failed');
    });
  });

  describe('exportAttendeesToCSV', () => {
    it('should export attendees to CSV', async () => {
      const attendees = createMockAttendees(5, 'event-1');
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      await service.exportAttendeesToCSV(attendees, 'Test Event');

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });

    it('should include CSV headers', async () => {
      const attendees = createMockAttendees(1, 'event-1');
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        expect(content).toContain('Name');
        expect(content).toContain('Email');
        expect(content).toContain('Phone');
        expect(content).toContain('Checked In');
        return Promise.resolve();
      });

      await service.exportAttendeesToCSV(attendees, 'Test Event');
    });

    it('should include attendee data', async () => {
      const attendees = [mockAttendee];
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        expect(content).toContain(mockAttendee.name);
        expect(content).toContain(mockAttendee.email || '');
        return Promise.resolve();
      });

      await service.exportAttendeesToCSV(attendees, 'Test Event');
    });

    it('should format boolean values', async () => {
      const attendees = [
        { ...mockAttendee, checkedIn: true },
        { ...mockAttendee, id: 'attendee-2', checkedIn: false },
      ];
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        expect(content).toContain('Yes');
        expect(content).toContain('No');
        return Promise.resolve();
      });

      await service.exportAttendeesToCSV(attendees, 'Test Event');
    });

    it('should handle null values', async () => {
      const attendees = [{
        ...mockAttendee,
        email: null,
        phone: null,
      }];
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      await expect(service.exportAttendeesToCSV(attendees, 'Test Event')).resolves.not.toThrow();
    });

    it('should include event name in filename', async () => {
      const attendees = createMockAttendees(1, 'event-1');
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri) => {
        expect(uri).toContain('Test_Event');
        expect(uri).toContain('attendees_');
        return Promise.resolve();
      });

      await service.exportAttendeesToCSV(attendees, 'Test Event');
    });

    it('should sanitize event name for filename', async () => {
      const attendees = createMockAttendees(1, 'event-1');
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri) => {
        expect(uri).not.toContain('/');
        expect(uri).not.toContain('\\');
        return Promise.resolve();
      });

      await service.exportAttendeesToCSV(attendees, 'Test/Event\\Name');
    });

    it('should handle empty attendees array', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      await service.exportAttendeesToCSV([], 'Test Event');

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });

    it('should share file after export', async () => {
      const attendees = createMockAttendees(1, 'event-1');
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      await service.exportAttendeesToCSV(attendees, 'Test Event');

      expect(Sharing.shareAsync).toHaveBeenCalled();
    });
  });

  describe('exportCheckInReport', () => {
    it('should export check-in report', async () => {
      const attendees = createMockAttendees(10, 'event-1');
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      await service.exportCheckInReport(attendees, 'Test Event');

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });

    it('should include statistics in report', async () => {
      const attendees = createMockAttendees(10, 'event-1');
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        expect(content).toContain('Total Attendees');
        expect(content).toContain('Checked In');
        expect(content).toContain('Not Checked In');
        expect(content).toContain('Check-in Rate');
        return Promise.resolve();
      });

      await service.exportCheckInReport(attendees, 'Test Event');
    });

    it('should calculate correct statistics', async () => {
      const attendees = createMockAttendees(10, 'event-1');
      const checkedInCount = attendees.filter(a => a.checkedIn).length;
      
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        expect(content).toContain(`${checkedInCount}`);
        expect(content).toContain(`${10 - checkedInCount}`);
        return Promise.resolve();
      });

      await service.exportCheckInReport(attendees, 'Test Event');
    });

    it('should include check-in times', async () => {
      const attendees = [{
        ...mockAttendee,
        checkedIn: true,
        checkInTime: '2026-02-20T10:00:00Z',
      }];
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        expect(content).toContain('Check-in Time');
        return Promise.resolve();
      });

      await service.exportCheckInReport(attendees, 'Test Event');
    });

    it('should handle attendees without check-in time', async () => {
      const attendees = [{
        ...mockAttendee,
        checkedIn: false,
        checkInTime: null,
      }];
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      await expect(service.exportCheckInReport(attendees, 'Test Event')).resolves.not.toThrow();
    });
  });

  describe('exportWithCustomFields', () => {
    it('should export attendees with custom fields', async () => {
      const attendees = createMockAttendees(2, 'event-1');
      const customFields = [
        { id: 'field-1', name: 'Company', key: 'company', type: 'text' },
        { id: 'field-2', name: 'Job Title', key: 'job_title', type: 'text' },
      ];
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      await service.exportWithCustomFields(attendees, customFields, 'Test Event');

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });

    it('should include custom field headers', async () => {
      const attendees = createMockAttendees(1, 'event-1');
      const customFields = [
        { id: 'field-1', name: 'Company', key: 'company', type: 'text' },
      ];
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        expect(content).toContain('Company');
        return Promise.resolve();
      });

      await service.exportWithCustomFields(attendees, customFields, 'Test Event');
    });

    it('should include custom field values', async () => {
      const attendees = createMockAttendees(1, 'event-1');
      const customFields = [
        { id: 'field-1', name: 'Company', key: 'company', type: 'text' },
      ];
      const customFieldValues = {
        [attendees[0].id]: { 'field-1': 'Acme Corp' },
      };
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        expect(content).toContain('Acme Corp');
        return Promise.resolve();
      });

      await service.exportWithCustomFields(attendees, customFields, 'Test Event', customFieldValues);
    });

    it('should handle missing custom field values', async () => {
      const attendees = createMockAttendees(1, 'event-1');
      const customFields = [
        { id: 'field-1', name: 'Company', key: 'company', type: 'text' },
      ];
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      await expect(
        service.exportWithCustomFields(attendees, customFields, 'Test Event')
      ).resolves.not.toThrow();
    });

    it('should handle empty custom fields array', async () => {
      const attendees = createMockAttendees(1, 'event-1');
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      await service.exportWithCustomFields(attendees, [], 'Test Event');

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });
  });

  describe('CSV Formatting', () => {
    it('should escape double quotes', async () => {
      const events = [{
        ...mockEvent,
        title: 'Event with "quotes"',
      }];
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        expect(content).toContain('""quotes""');
        return Promise.resolve();
      });

      await service.exportEventsToCSV(events);
    });

    it('should wrap fields with commas in quotes', async () => {
      const events = [{
        ...mockEvent,
        title: 'Event, with comma',
      }];
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        expect(content).toContain('"Event, with comma"');
        return Promise.resolve();
      });

      await service.exportEventsToCSV(events);
    });

    it('should wrap fields with newlines in quotes', async () => {
      const events = [{
        ...mockEvent,
        notes: 'Line 1\nLine 2',
      }];
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        expect(content).toContain('"Line 1\nLine 2"');
        return Promise.resolve();
      });

      await service.exportEventsToCSV(events);
    });

    it('should handle empty strings', async () => {
      const attendees = [{
        ...mockAttendee,
        email: '',
        phone: '',
      }];
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      await expect(service.exportAttendeesToCSV(attendees, 'Test')).resolves.not.toThrow();
    });

    it('should format dates consistently', async () => {
      const events = [mockEvent];
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        expect(content).toContain(mockEvent.date);
        return Promise.resolve();
      });

      await service.exportEventsToCSV(events);
    });
  });

  describe('Error Handling', () => {
    it('should throw error if sharing fails', async () => {
      const events = createMockEvents(1);
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (Sharing.shareAsync as jest.Mock).mockRejectedValue(new Error('Sharing failed'));

      await expect(service.exportEventsToCSV(events)).rejects.toThrow('Sharing failed');
    });

    it('should throw error if file system not available', async () => {
      const events = createMockEvents(1);
      (FileSystem.writeAsStringAsync as jest.Mock).mockRejectedValue(new Error('File system error'));

      await expect(service.exportEventsToCSV(events)).rejects.toThrow('File system error');
    });

    it('should handle invalid data gracefully', async () => {
      const invalidEvents: any[] = [{ invalid: 'data' }];
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      // Should not throw, but handle gracefully
      await expect(service.exportEventsToCSV(invalidEvents)).resolves.not.toThrow();
    });
  });
});
