/**
 * Test Database Helper
 * 
 * Utilities for creating and managing test databases for integration tests.
 */

import { DatabaseService } from '../../../services/DatabaseService';

export class TestDatabaseHelper {
  /**
   * Create a fresh in-memory database for testing
   */
  static createTestDatabase(): DatabaseService {
    // Use in-memory database for fast tests
    const db = new DatabaseService(':memory:');
    return db;
  }

  /**
   * Seed database with sample data
   */
  static seedDatabase(db: DatabaseService) {
    // Create sample event
    const eventId = db.addEvent({
      title: 'Sample Event',
      date: '2026-03-01',
      time: '14:00',
      location: 'Test Location',
      notes: 'Test notes',
      expected_attendees: '100',
    });

    // Add sample attendees
    const attendeeIds: string[] = [];
    for (let i = 0; i < 10; i++) {
      const attendeeId = db.addAttendee(eventId, {
        name: `Attendee ${i}`,
        email: `attendee${i}@test.com`,
        phone: `+123456789${i}`,
      });
      attendeeIds.push(attendeeId);
    }

    // Check in half of the attendees
    for (let i = 0; i < 5; i++) {
      db.checkInAttendee(attendeeIds[i]);
    }

    return { eventId, attendeeIds };
  }

  /**
   * Create multiple events with attendees
   */
  static seedMultipleEvents(db: DatabaseService, count: number = 3) {
    const events = [];
    
    for (let i = 0; i < count; i++) {
      const eventId = db.addEvent({
        title: `Event ${i + 1}`,
        date: `2026-0${(i % 9) + 1}-15`,
        time: '14:00',
        location: `Location ${i + 1}`,
        expected_attendees: `${(i + 1) * 50}`,
      });

      const attendeeIds: string[] = [];
      const attendeeCount = (i + 1) * 5;
      
      for (let j = 0; j < attendeeCount; j++) {
        const attendeeId = db.addAttendee(eventId, {
          name: `Attendee ${j} for Event ${i + 1}`,
          email: `attendee${j}.event${i}@test.com`,
          phone: `+12345${i}${j}000`,
        });
        attendeeIds.push(attendeeId);
      }

      events.push({ eventId, attendeeIds });
    }

    return events;
  }

  /**
   * Clean up database
   */
  static cleanupDatabase(db: DatabaseService) {
    try {
      db.closeSync();
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }

  /**
   * Get database statistics
   */
  static getDatabaseStats(db: DatabaseService) {
    const events = db.getEvents();
    let totalAttendees = 0;
    let totalCheckedIn = 0;

    events.forEach(event => {
      totalAttendees += event.attendees_count || 0;
      totalCheckedIn += event.checked_in_count || 0;
    });

    return {
      eventCount: events.length,
      totalAttendees,
      totalCheckedIn,
      checkInRate: totalAttendees > 0 ? (totalCheckedIn / totalAttendees) * 100 : 0,
    };
  }
}
