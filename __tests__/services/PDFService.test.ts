/**
 * PDFService Tests
 * 
 * Tests PDF generation for statistics and event reports.
 */

import { PDFService } from '../../services/PDFService';
import { createMockEvents, createMockAttendees } from '../setup/mocks';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

jest.mock('expo-print');
jest.mock('expo-sharing');

describe('PDFService - Statistics Report', () => {
  let service: PDFService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PDFService();
  });

  describe('generateStatisticsReport', () => {
    it('should generate PDF with statistics', async () => {
      const stats = {
        totalEvents: 10,
        totalAttendees: 500,
        totalCheckedIn: 400,
        checkInRate: 80,
        averageAttendeesPerEvent: 50,
      };
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file://report.pdf' });

      await service.generateStatisticsReport(stats);

      expect(Print.printToFileAsync).toHaveBeenCalled();
    });

    it('should include all statistics in HTML', async () => {
      const stats = {
        totalEvents: 10,
        totalAttendees: 500,
        totalCheckedIn: 400,
        checkInRate: 80,
        averageAttendeesPerEvent: 50,
      };
      (Print.printToFileAsync as jest.Mock).mockImplementation((options) => {
        expect(options.html).toContain('10');
        expect(options.html).toContain('500');
        expect(options.html).toContain('400');
        expect(options.html).toContain('80');
        return Promise.resolve({ uri: 'file://report.pdf' });
      });

      await service.generateStatisticsReport(stats);
    });

    it('should include CSS styling', async () => {
      const stats = {
        totalEvents: 5,
        totalAttendees: 100,
        totalCheckedIn: 80,
        checkInRate: 80,
        averageAttendeesPerEvent: 20,
      };
      (Print.printToFileAsync as jest.Mock).mockImplementation((options) => {
        expect(options.html).toContain('<style>');
        expect(options.html).toContain('</style>');
        return Promise.resolve({ uri: 'file://report.pdf' });
      });

      await service.generateStatisticsReport(stats);
    });

    it('should share PDF after generation', async () => {
      const stats = {
        totalEvents: 5,
        totalAttendees: 100,
        totalCheckedIn: 80,
        checkInRate: 80,
        averageAttendeesPerEvent: 20,
      };
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file://report.pdf' });
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      await service.generateStatisticsReport(stats);

      expect(Sharing.shareAsync).toHaveBeenCalledWith('file://report.pdf');
    });

    it('should throw error if PDF generation fails', async () => {
      const stats = {
        totalEvents: 5,
        totalAttendees: 100,
        totalCheckedIn: 80,
        checkInRate: 80,
        averageAttendeesPerEvent: 20,
      };
      (Print.printToFileAsync as jest.Mock).mockRejectedValue(new Error('PDF generation failed'));

      await expect(service.generateStatisticsReport(stats)).rejects.toThrow('PDF generation failed');
    });

    it('should handle zero values', async () => {
      const stats = {
        totalEvents: 0,
        totalAttendees: 0,
        totalCheckedIn: 0,
        checkInRate: 0,
        averageAttendeesPerEvent: 0,
      };
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file://report.pdf' });

      await expect(service.generateStatisticsReport(stats)).resolves.not.toThrow();
    });
  });

  describe('generateEventReport', () => {
    it('should generate PDF for event', async () => {
      const event = createMockEvents(1)[0];
      const attendees = createMockAttendees(5, event.id);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file://event-report.pdf' });

      await service.generateEventReport(event, attendees);

      expect(Print.printToFileAsync).toHaveBeenCalled();
    });

    it('should include event details in HTML', async () => {
      const event = createMockEvents(1)[0];
      const attendees = createMockAttendees(2, event.id);
      (Print.printToFileAsync as jest.Mock).mockImplementation((options) => {
        expect(options.html).toContain(event.title);
        expect(options.html).toContain(event.date);
        return Promise.resolve({ uri: 'file://event-report.pdf' });
      });

      await service.generateEventReport(event, attendees);
    });

    it('should include attendee list', async () => {
      const event = createMockEvents(1)[0];
      const attendees = createMockAttendees(3, event.id);
      (Print.printToFileAsync as jest.Mock).mockImplementation((options) => {
        attendees.forEach(a => {
          expect(options.html).toContain(a.name);
        });
        return Promise.resolve({ uri: 'file://event-report.pdf' });
      });

      await service.generateEventReport(event, attendees);
    });

    it('should show check-in status', async () => {
      const event = createMockEvents(1)[0];
      const attendees = [
        { ...createMockAttendees(1, event.id)[0], checkedIn: true },
        { ...createMockAttendees(1, event.id)[0], id: 'attendee-2', checkedIn: false },
      ];
      (Print.printToFileAsync as jest.Mock).mockImplementation((options) => {
        expect(options.html).toContain('Checked In');
        expect(options.html).toContain('Not Checked In');
        return Promise.resolve({ uri: 'file://event-report.pdf' });
      });

      await service.generateEventReport(event, attendees);
    });

    it('should handle event with no attendees', async () => {
      const event = createMockEvents(1)[0];
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file://event-report.pdf' });

      await expect(service.generateEventReport(event, [])).resolves.not.toThrow();
    });

    it('should share PDF after generation', async () => {
      const event = createMockEvents(1)[0];
      const attendees = createMockAttendees(2, event.id);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file://event-report.pdf' });
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      await service.generateEventReport(event, attendees);

      expect(Sharing.shareAsync).toHaveBeenCalled();
    });
  });

  describe('PDF Options', () => {
    it('should support A4 page size', async () => {
      const stats = {
        totalEvents: 5,
        totalAttendees: 100,
        totalCheckedIn: 80,
        checkInRate: 80,
        averageAttendeesPerEvent: 20,
      };
      (Print.printToFileAsync as jest.Mock).mockImplementation((options) => {
        expect(options).toBeDefined();
        return Promise.resolve({ uri: 'file://report.pdf' });
      });

      await service.generateStatisticsReport(stats, { pageSize: 'A4' });
    });

    it('should support Letter page size', async () => {
      const stats = {
        totalEvents: 5,
        totalAttendees: 100,
        totalCheckedIn: 80,
        checkInRate: 80,
        averageAttendeesPerEvent: 20,
      };
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file://report.pdf' });

      await service.generateStatisticsReport(stats, { pageSize: 'Letter' });

      expect(Print.printToFileAsync).toHaveBeenCalled();
    });

    it('should support portrait orientation', async () => {
      const stats = {
        totalEvents: 5,
        totalAttendees: 100,
        totalCheckedIn: 80,
        checkInRate: 80,
        averageAttendeesPerEvent: 20,
      };
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file://report.pdf' });

      await service.generateStatisticsReport(stats, { orientation: 'portrait' });

      expect(Print.printToFileAsync).toHaveBeenCalled();
    });

    it('should support landscape orientation', async () => {
      const stats = {
        totalEvents: 5,
        totalAttendees: 100,
        totalCheckedIn: 80,
        checkInRate: 80,
        averageAttendeesPerEvent: 20,
      };
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file://report.pdf' });

      await service.generateStatisticsReport(stats, { orientation: 'landscape' });

      expect(Print.printToFileAsync).toHaveBeenCalled();
    });

    it('should include custom fields if provided', async () => {
      const event = createMockEvents(1)[0];
      const attendees = createMockAttendees(1, event.id);
      (Print.printToFileAsync as jest.Mock).mockImplementation((options) => {
        expect(options.html).toContain('Company');
        return Promise.resolve({ uri: 'file://event-report.pdf' });
      });

      await service.generateEventReport(event, attendees, {
        includeCustomFields: true,
        customFields: [{ id: 'field-1', name: 'Company', key: 'company', type: 'text' }],
      });
    });
  });

  describe('HTML Generation', () => {
    it('should generate valid HTML', async () => {
      const stats = {
        totalEvents: 5,
        totalAttendees: 100,
        totalCheckedIn: 80,
        checkInRate: 80,
        averageAttendeesPerEvent: 20,
      };
      (Print.printToFileAsync as jest.Mock).mockImplementation((options) => {
        expect(options.html).toContain('<!DOCTYPE html>');
        expect(options.html).toContain('<html>');
        expect(options.html).toContain('</html>');
        return Promise.resolve({ uri: 'file://report.pdf' });
      });

      await service.generateStatisticsReport(stats);
    });

    it('should escape HTML special characters', async () => {
      const event = createMockEvents(1)[0];
      event.title = 'Event with <special> & "characters"';
      const attendees = createMockAttendees(1, event.id);
      (Print.printToFileAsync as jest.Mock).mockImplementation((options) => {
        expect(options.html).not.toContain('<special>');
        expect(options.html).toContain('&lt;special&gt;');
        return Promise.resolve({ uri: 'file://report.pdf' });
      });

      await service.generateEventReport(event, attendees);
    });

    it('should format dates consistently', async () => {
      const event = createMockEvents(1)[0];
      event.date = '2026-02-20';
      const attendees = createMockAttendees(1, event.id);
      (Print.printToFileAsync as jest.Mock).mockImplementation((options) => {
        expect(options.html).toContain('2026-02-20');
        return Promise.resolve({ uri: 'file://report.pdf' });
      });

      await service.generateEventReport(event, attendees);
    });

    it('should handle null values gracefully', async () => {
      const event = createMockEvents(1)[0];
      event.location = null;
      event.notes = null;
      const attendees = createMockAttendees(1, event.id);
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file://event-report.pdf' });

      await expect(service.generateEventReport(event, attendees)).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should throw error if sharing fails', async () => {
      const stats = {
        totalEvents: 5,
        totalAttendees: 100,
        totalCheckedIn: 80,
        checkInRate: 80,
        averageAttendeesPerEvent: 20,
      };
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file://report.pdf' });
      (Sharing.shareAsync as jest.Mock).mockRejectedValue(new Error('Sharing failed'));

      await expect(service.generateStatisticsReport(stats)).rejects.toThrow('Sharing failed');
    });

    it('should handle missing data gracefully', async () => {
      const stats = {
        totalEvents: 0,
        totalAttendees: 0,
        totalCheckedIn: 0,
        checkInRate: 0,
        averageAttendeesPerEvent: 0,
      };
      (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file://report.pdf' });

      await expect(service.generateStatisticsReport(stats)).resolves.not.toThrow();
    });
  });
});
