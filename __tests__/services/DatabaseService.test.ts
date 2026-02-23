/**
 * DatabaseService Tests
 * 
 * Tests all CRUD operations for events and attendees in the SQLite database.
 * Covers: creation, reading, updating, deleting, check-ins, and data integrity.
 */

import { DatabaseService, Event, Attendee } from '../../services/DatabaseService';
import { mockEvent, mockAttendee, createMockEvents, createMockAttendees } from '../setup/mocks';

// Get the global mock database
const mockDb = (global as any).mockDb;
const mockRunSync = mockDb.runSync;
const mockGetAllSync = mockDb.getAllSync;
const mockGetFirstSync = mockDb.getFirstSync;
const mockWithTransactionSync = mockDb.withTransactionSync;

// Setup before each test
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Reset mock return values
  mockRunSync.mockReturnValue({ changes: 1, lastInsertRowId: 1 });
  mockGetAllSync.mockReturnValue([]);
  mockGetFirstSync.mockReturnValue(null);
  mockWithTransactionSync.mockImplementation((callback) => callback());
});

describe('DatabaseService - Event Operations', () => {
  let service: DatabaseService;

  beforeEach(() => {
    service = new DatabaseService();
  });

  describe('addEvent', () => {
    it('should create a new event with all required fields', () => {
      const eventData = {
        title: 'Test Event',
        date: '2026-02-20',
        time: '10:00',
        location: 'Test Location',
        notes: 'Test notes',
        expected_attendees: 100,
        category: 'Conference',
      };

      const result = service.addEvent(eventData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(eventData.title);
      expect(result.date).toBe(eventData.date);
      expect(result.time).toBe(eventData.time);
      expect(result.attendees_count).toBe(0);
      expect(result.checked_in_count).toBe(0);
      expect(mockRunSync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO events'),
        expect.any(Array)
      );
    });

    it('should create event with optional fields as null', () => {
      const eventData = {
        title: 'Minimal Event',
        date: '2026-02-20',
        time: '10:00',
      };

      const result = service.addEvent(eventData);

      expect(result.location).toBeNull();
      expect(result.notes).toBeNull();
      expect(result.expected_attendees).toBeNull();
      expect(result.category).toBeNull();
    });

    it('should throw error if database insert fails', () => {
      mockRunSync.mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const eventData = {
        title: 'Test Event',
        date: '2026-02-20',
        time: '10:00',
      };

      expect(() => service.addEvent(eventData)).toThrow('Database error');
    });
  });

  describe('getEvents', () => {
    it('should return all events ordered by date and time', () => {
      const mockEvents = createMockEvents(3);
      mockGetAllSync.mockReturnValueOnce(mockEvents);

      const result = service.getEvents();

      expect(result).toEqual(mockEvents);
      expect(result).toHaveLength(3);
      expect(mockGetAllSync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM events ORDER BY date DESC, time DESC')
      );
    });

    it('should return empty array when no events exist', () => {
      mockGetAllSync.mockReturnValueOnce([]);

      const result = service.getEvents();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw error if database query fails', () => {
      mockGetAllSync.mockImplementationOnce(() => {
        throw new Error('Database query error');
      });

      expect(() => service.getEvents()).toThrow('Database query error');
    });
  });

  describe('getEventById', () => {
    it('should return event with attendees when event exists', () => {
      const mockEventData = { ...mockEvent };
      const mockAttendees = createMockAttendees(2, mockEvent.id);
      
      mockGetFirstSync.mockReturnValueOnce(mockEventData);
      mockGetAllSync.mockReturnValueOnce(mockAttendees.map(a => ({ ...a, checked_in: a.checkedIn ? 1 : 0 })));

      const result = service.getEventById(mockEvent.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockEvent.id);
      expect(result?.attendees).toBeDefined();
      expect(result?.attendees).toHaveLength(2);
    });

    it('should return null when event does not exist', () => {
      mockGetFirstSync.mockReturnValueOnce(null);

      const result = service.getEventById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should return event without attendees if attendee fetch fails', () => {
      const mockEventData = { ...mockEvent };
      mockGetFirstSync.mockReturnValueOnce(mockEventData);
      mockGetAllSync.mockImplementationOnce(() => {
        throw new Error('Attendee fetch error');
      });

      const result = service.getEventById(mockEvent.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockEvent.id);
      expect(result?.attendees).toBeUndefined();
    });
  });

  describe('updateEvent', () => {
    it('should update event fields successfully', () => {
      const updateData = {
        title: 'Updated Event',
        location: 'New Location',
      };

      mockRunSync.mockReturnValueOnce({ changes: 1 });

      const result = service.updateEvent(mockEvent.id, updateData);

      expect(result).toBe(true);
      expect(mockRunSync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE events SET'),
        expect.arrayContaining(['Updated Event', 'New Location'])
      );
    });

    it('should return true when no fields to update', () => {
      const result = service.updateEvent(mockEvent.id, {});

      expect(result).toBe(true);
      expect(mockRunSync).not.toHaveBeenCalled();
    });

    it('should return false when event does not exist', () => {
      mockRunSync.mockReturnValueOnce({ changes: 0 });

      const result = service.updateEvent('non-existent-id', { title: 'New Title' });

      expect(result).toBe(false);
    });

    it('should handle null values correctly', () => {
      const updateData = {
        location: null,
        notes: null,
      };

      mockRunSync.mockReturnValueOnce({ changes: 1 });

      const result = service.updateEvent(mockEvent.id, updateData);

      expect(result).toBe(true);
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', () => {
      mockRunSync.mockReturnValueOnce({ changes: 1 });

      const result = service.deleteEvent(mockEvent.id);

      expect(result).toBe(true);
      expect(mockRunSync).toHaveBeenCalledWith(
        'DELETE FROM events WHERE id = ?;',
        [mockEvent.id]
      );
    });

    it('should return false when event does not exist', () => {
      mockRunSync.mockReturnValueOnce({ changes: 0 });

      const result = service.deleteEvent('non-existent-id');

      expect(result).toBe(false);
    });

    it('should cascade delete attendees (handled by database)', () => {
      mockRunSync.mockReturnValueOnce({ changes: 1 });

      const result = service.deleteEvent(mockEvent.id);

      expect(result).toBe(true);
      // Cascade delete is handled by database FOREIGN KEY constraint
    });
  });
});

describe('DatabaseService - Attendee Operations', () => {
  let service: DatabaseService;

  beforeEach(() => {
    service = new DatabaseService();
  });

  describe('addAttendee', () => {
    it('should add attendee with all fields', () => {
      const attendeeData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };

      mockWithTransactionSync.mockImplementationOnce((callback) => callback());
      mockRunSync.mockReturnValue({ changes: 1 });

      const result = service.addAttendee(mockEvent.id, attendeeData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(attendeeData.name);
      expect(result.email).toBe(attendeeData.email);
      expect(result.phone).toBe(attendeeData.phone);
      expect(result.checked_in).toBe(false);
      expect(result.event_id).toBe(mockEvent.id);
    });

    it('should add attendee with only required fields', () => {
      const attendeeData = {
        name: 'Jane Doe',
      };

      mockWithTransactionSync.mockImplementationOnce((callback) => callback());
      mockRunSync.mockReturnValue({ changes: 1 });

      const result = service.addAttendee(mockEvent.id, attendeeData);

      expect(result.name).toBe(attendeeData.name);
      expect(result.email).toBeNull();
      expect(result.phone).toBeNull();
    });

    it('should increment event attendee count', () => {
      const attendeeData = { name: 'Test Attendee' };

      mockWithTransactionSync.mockImplementationOnce((callback) => callback());
      mockRunSync.mockReturnValue({ changes: 1 });

      service.addAttendee(mockEvent.id, attendeeData);

      expect(mockRunSync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE events SET attendees_count = attendees_count + 1'),
        expect.any(Array)
      );
    });

    it('should use transaction for atomic operation', () => {
      const attendeeData = { name: 'Test Attendee' };

      mockWithTransactionSync.mockImplementationOnce((callback) => callback());

      service.addAttendee(mockEvent.id, attendeeData);

      expect(mockWithTransactionSync).toHaveBeenCalled();
    });
  });

  describe('getAttendees', () => {
    it('should return all attendees for an event', () => {
      const mockAttendeesRaw = [
        { ...mockAttendee, checked_in: 0 },
        { ...mockAttendee, id: 'attendee-2', checked_in: 1 },
      ];

      mockGetAllSync.mockReturnValueOnce(mockAttendeesRaw);

      const result = service.getAttendees(mockEvent.id);

      expect(result).toHaveLength(2);
      expect(result[0].checked_in).toBe(false); // 0 converted to false
      expect(result[1].checked_in).toBe(true);  // 1 converted to true
    });

    it('should return empty array when no attendees exist', () => {
      mockGetAllSync.mockReturnValueOnce([]);

      const result = service.getAttendees(mockEvent.id);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should order attendees by name (case-insensitive)', () => {
      mockGetAllSync.mockReturnValueOnce([]);

      service.getAttendees(mockEvent.id);

      expect(mockGetAllSync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY name COLLATE NOCASE'),
        [mockEvent.id]
      );
    });
  });

  describe('getAttendeeById', () => {
    it('should return attendee when exists', () => {
      const mockAttendeeRaw = { ...mockAttendee, checked_in: 0 };
      mockGetFirstSync.mockReturnValueOnce(mockAttendeeRaw);

      const result = service.getAttendeeById(mockAttendee.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockAttendee.id);
      expect(result?.checked_in).toBe(false);
    });

    it('should return null when attendee does not exist', () => {
      mockGetFirstSync.mockReturnValueOnce(null);

      const result = service.getAttendeeById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should convert checked_in from integer to boolean', () => {
      const mockAttendeeRaw = { ...mockAttendee, checked_in: 1 };
      mockGetFirstSync.mockReturnValueOnce(mockAttendeeRaw);

      const result = service.getAttendeeById(mockAttendee.id);

      expect(result?.checked_in).toBe(true);
    });
  });

  describe('checkInAttendee', () => {
    it('should check in attendee successfully', () => {
      const mockAttendeeRaw = { ...mockAttendee, checked_in: 0 };
      // Mock getAttendeeById call
      mockGetFirstSync.mockReturnValueOnce(mockAttendeeRaw);
      mockWithTransactionSync.mockImplementationOnce((callback) => callback());
      mockRunSync.mockReturnValue({ changes: 1 });

      const result = service.checkInAttendee(mockAttendee.id, mockEvent.id);

      expect(result).toBeDefined();
      expect(result?.checked_in).toBe(true);
      expect(result?.check_in_time).toBeDefined();
      expect(mockRunSync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE attendees SET checked_in'),
        expect.any(Array)
      );
    });

    it('should return existing attendee if already checked in', () => {
      const mockAttendeeRaw = { ...mockAttendee, checked_in: 1, check_in_time: '2026-02-20T10:00:00Z' };
      mockGetFirstSync.mockReturnValueOnce(mockAttendeeRaw);

      const result = service.checkInAttendee(mockAttendee.id, mockEvent.id);

      expect(result).toBeDefined();
      expect(result?.checked_in).toBe(true);
      expect(mockWithTransactionSync).not.toHaveBeenCalled();
    });

    it('should return null if attendee not found', () => {
      mockGetFirstSync.mockReturnValueOnce(null);

      const result = service.checkInAttendee('non-existent-id', mockEvent.id);

      expect(result).toBeNull();
    });

    it('should return null if attendee not registered for event', () => {
      const mockAttendeeRaw = { ...mockAttendee, event_id: 'different-event-id', checked_in: 0 };
      mockGetFirstSync.mockReturnValueOnce(mockAttendeeRaw);

      const result = service.checkInAttendee(mockAttendee.id, mockEvent.id);

      expect(result).toBeNull();
    });

    it('should increment event checked_in_count', () => {
      const mockAttendeeRaw = { ...mockAttendee, checked_in: 0 };
      mockGetFirstSync.mockReturnValueOnce(mockAttendeeRaw);
      mockWithTransactionSync.mockImplementationOnce((callback) => callback());
      mockRunSync.mockReturnValue({ changes: 1 });

      service.checkInAttendee(mockAttendee.id, mockEvent.id);

      expect(mockRunSync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE events SET checked_in_count = checked_in_count + 1'),
        expect.any(Array)
      );
    });

    it('should use transaction for atomic operation', () => {
      const mockAttendeeRaw = { ...mockAttendee, checked_in: 0 };
      mockGetFirstSync.mockReturnValueOnce(mockAttendeeRaw);
      mockWithTransactionSync.mockImplementationOnce((callback) => callback());
      mockRunSync.mockReturnValue({ changes: 1 });

      service.checkInAttendee(mockAttendee.id, mockEvent.id);

      expect(mockWithTransactionSync).toHaveBeenCalled();
    });
  });

  describe('deleteAttendee', () => {
    it('should delete attendee successfully', () => {
      const mockAttendeeRaw = { event_id: mockEvent.id, checked_in: 0 };
      mockGetFirstSync.mockReturnValueOnce(mockAttendeeRaw);
      mockWithTransactionSync.mockImplementationOnce((callback) => callback());
      mockRunSync.mockReturnValue({ changes: 1 });

      const result = service.deleteAttendee(mockAttendee.id);

      expect(result).toBe(true);
    });

    it('should return false when attendee does not exist', () => {
      mockGetFirstSync.mockReturnValueOnce(null);

      const result = service.deleteAttendee('non-existent-id');

      expect(result).toBe(false);
    });

    it('should decrement event attendee count', () => {
      const mockAttendeeRaw = { event_id: mockEvent.id, checked_in: 0 };
      mockGetFirstSync.mockReturnValueOnce(mockAttendeeRaw);
      mockWithTransactionSync.mockImplementationOnce((callback) => callback());
      mockRunSync.mockReturnValue({ changes: 1 });

      service.deleteAttendee(mockAttendee.id);

      expect(mockRunSync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE events SET attendees_count = attendees_count - 1'),
        expect.any(Array)
      );
    });

    it('should decrement checked_in_count if attendee was checked in', () => {
      const mockAttendeeRaw = { event_id: mockEvent.id, checked_in: 1 };
      mockGetFirstSync.mockReturnValueOnce(mockAttendeeRaw);
      mockWithTransactionSync.mockImplementationOnce((callback) => callback());
      mockRunSync.mockReturnValue({ changes: 1 });

      service.deleteAttendee(mockAttendee.id);

      expect(mockRunSync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE events SET checked_in_count = checked_in_count - 1'),
        expect.any(Array)
      );
    });

    it('should use transaction for atomic operation', () => {
      const mockAttendeeRaw = { event_id: mockEvent.id, checked_in: 0 };
      mockGetFirstSync.mockReturnValueOnce(mockAttendeeRaw);
      mockWithTransactionSync.mockImplementationOnce((callback) => callback());

      service.deleteAttendee(mockAttendee.id);

      expect(mockWithTransactionSync).toHaveBeenCalled();
    });
  });
});

describe('DatabaseService - Async Methods', () => {
  let service: DatabaseService;

  beforeEach(() => {
    service = new DatabaseService();
  });

  it('should call addEventAsync and return promise', async () => {
    const eventData = {
      title: 'Async Event',
      date: '2026-02-20',
      time: '10:00',
    };

    mockRunSync.mockReturnValue({ changes: 1 });

    const result = await service.addEventAsync(eventData);

    expect(result).toBeDefined();
    expect(result.title).toBe(eventData.title);
  });

  it('should call getEventsAsync and return promise', async () => {
    const mockEvents = createMockEvents(2);
    mockGetAllSync.mockReturnValueOnce(mockEvents);

    const result = await service.getEventsAsync();

    expect(result).toEqual(mockEvents);
  });

  it('should call checkInAttendeeAsync and return promise', async () => {
    const mockAttendeeRaw = { ...mockAttendee, checked_in: 0 };
    mockGetFirstSync.mockReturnValueOnce(mockAttendeeRaw);
    mockWithTransactionSync.mockImplementationOnce((callback) => callback());
    mockRunSync.mockReturnValue({ changes: 1 });

    const result = await service.checkInAttendeeAsync(mockAttendee.id, mockEvent.id);

    expect(result).toBeDefined();
    expect(result?.checked_in).toBe(true);
  });
});

describe('DatabaseService - Data Integrity', () => {
  let service: DatabaseService;

  beforeEach(() => {
    service = new DatabaseService();
  });

  it('should maintain referential integrity on event delete', () => {
    // This is handled by database FOREIGN KEY ON DELETE CASCADE
    mockRunSync.mockReturnValueOnce({ changes: 1 });

    const result = service.deleteEvent(mockEvent.id);

    expect(result).toBe(true);
    // Attendees should be automatically deleted by database
  });

  it('should maintain accurate attendee counts', () => {
    const attendeeData = { name: 'Test Attendee' };
    mockWithTransactionSync.mockImplementationOnce((callback) => callback());
    mockRunSync.mockReturnValue({ changes: 1 });

    service.addAttendee(mockEvent.id, attendeeData);

    // Verify that SQL operations were called (insert attendee and update event count)
    expect(mockRunSync).toHaveBeenCalled();
    expect(mockRunSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO attendees'),
      expect.any(Array)
    );
    expect(mockRunSync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE events SET attendees_count'),
      expect.any(Array)
    );
  });

  it('should maintain accurate check-in counts', () => {
    const mockAttendeeRaw = { ...mockAttendee, checked_in: 0 };
    mockGetFirstSync.mockReturnValueOnce(mockAttendeeRaw);
    mockWithTransactionSync.mockImplementationOnce((callback) => callback());
    mockRunSync.mockReturnValue({ changes: 1 });

    service.checkInAttendee(mockAttendee.id, mockEvent.id);

    // Verify both check-in update and count update were called
    expect(mockRunSync).toHaveBeenCalledTimes(2);
  });
});
