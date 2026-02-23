import { nanoid } from 'nanoid/non-secure';
import { openDatabaseSync } from 'expo-sqlite';

// Define interfaces
export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string | null;
  notes?: string | null;
  expected_attendees?: number | null;
  category?: string | null; // Event category (Corporate Event, Conference, etc.)
  created_at: string;
  updated_at: string;
  attendees_count?: number;
  checked_in_count?: number;
}

// Define Attendee interface
export interface Attendee {
  id: string;
  event_id: string; // Foreign key linking to Event
  name: string;
  email: string | null; // Optional email field
  phone: string | null; // Optional phone field
  checked_in: boolean; // Use 0 for false, 1 for true in SQLite
  check_in_time?: string; // Optional timestamp when checked in
  created_at: string;
  updated_at: string;
}

// SQLite raw data interface for attendees (SQLite stores booleans as integers)
interface AttendeeRaw extends Omit<Attendee, 'checked_in'> {
  checked_in: number; // 0 for false, 1 for true
}

// Import SQLite types from expo-sqlite
import { SQLiteBindParams, SQLiteDatabase } from 'expo-sqlite';

// SQLite query result type
interface SQLiteResult {
  lastInsertRowId: number;
  changes: number;
}

// CRUD operations
export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLiteDatabase;
  private migrated: boolean = false;

  private constructor(dbName: string = 'ventry.db') {
    console.log('Opening SQLite database...');
    this.db = openDatabaseSync(dbName);
    console.log('SQLite database opened successfully');
    this.initDatabase();
    this.migrateDatabase();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public closeSync(): void {
    try {
      if (this.db) {
        this.db.closeSync();
        console.log('Database closed successfully');
      }
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }

  // Check if a column exists in a table
  private columnExists(tableName: string, columnName: string): boolean {
    try {
      const result = this.db.getFirstSync<{ name: string }>(
        `PRAGMA table_info(${tableName})`,
      );
      if (!result) return false;
      
      const columns = this.db.getAllSync<{ name: string }>(
        `PRAGMA table_info(${tableName})`,
      );
      return columns.some((col: { name: string }) => col.name === columnName);
    } catch (error) {
      console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error);
      return false;
    }
  }

  // Migrate database schema
  private migrateDatabase(): void {
    if (this.migrated) return; // Skip if already migrated
    
    try {
      // Check if email column exists in attendees table
      if (!this.columnExists('attendees', 'email')) {
        console.log('Adding email column to attendees table');
        this.db.runSync('ALTER TABLE attendees ADD COLUMN email TEXT;');
      }
      
      // Check if phone column exists in attendees table
      if (!this.columnExists('attendees', 'phone')) {
        console.log('Adding phone column to attendees table');
        this.db.runSync('ALTER TABLE attendees ADD COLUMN phone TEXT;');
      }
      
      // Check if check_in_time column exists in attendees table
      if (!this.columnExists('attendees', 'check_in_time')) {
        console.log('Adding check_in_time column to attendees table');
        this.db.runSync('ALTER TABLE attendees ADD COLUMN check_in_time TEXT;');
      }
      
      // Check if category column exists in events table
      if (!this.columnExists('events', 'category')) {
        console.log('Adding category column to events table');
        this.db.runSync('ALTER TABLE events ADD COLUMN category TEXT;');
      }
      
      this.migrated = true;
      console.log('Database migration completed successfully');
    } catch (error) {
      console.error('Error migrating database:', error);
      // Don't throw error here, just log it to prevent app crashes
    }
  }

  // Initialize database
  private initDatabase(): void {
    console.log('initDatabase function called');
    try {
      console.log('Creating events table if not exists...');
      // Use runSync for non-query statements
      this.db.runSync(
        `CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          location TEXT,
          notes TEXT,
          expected_attendees INTEGER,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          attendees_count INTEGER DEFAULT 0,
          checked_in_count INTEGER DEFAULT 0
        );`
      );
      console.log('Creating attendees table if not exists...');
      // Create attendees table if it doesn't exist
      this.db.runSync(
        `CREATE TABLE IF NOT EXISTS attendees (
          id TEXT PRIMARY KEY NOT NULL,
          event_id TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          checked_in INTEGER DEFAULT 0, -- 0 for false, 1 for true
          check_in_time TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        );`
      );
      
      // Create indexes if they don't exist
      this.db.runSync('CREATE INDEX IF NOT EXISTS idx_event_date_time ON events (date, time);');
      this.db.runSync('CREATE INDEX IF NOT EXISTS idx_event_created_at ON events (created_at);');
      
      // Add indexes for foreign keys (CRITICAL FIX #3)
      this.db.runSync('CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees (event_id);');
      this.db.runSync('CREATE INDEX IF NOT EXISTS idx_attendees_checked_in ON attendees (checked_in);');

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  // Validation methods (CRITICAL FIX #2)
  private validateEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'attendees_count' | 'checked_in_count'>): void {
    if (!eventData.title || eventData.title.trim() === '') {
      throw new Error('Please enter an event name');
    }
    
    if (eventData.title.length > 255) {
      throw new Error('Event name is too long (maximum 255 characters)');
    }
    
    if (!eventData.date || !this.isValidDate(eventData.date)) {
      throw new Error('Please select a valid date for your event');
    }
    
    if (!eventData.time || !this.isValidTime(eventData.time)) {
      throw new Error('Please select a valid time for your event');
    }
  }

  private isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  private isValidTime(time: string): boolean {
    // Accept both HH:MM and HH:MM:SS formats
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
    return timeRegex.test(time);
  }

  private validateAttendee(attendeeData: { name: string; email?: string; phone?: string }): void {
    if (!attendeeData.name || attendeeData.name.trim() === '') {
      throw new Error('Please enter the attendee name');
    }
    
    if (attendeeData.name.length > 255) {
      throw new Error('Attendee name is too long (maximum 255 characters)');
    }
    
    if (attendeeData.email && !this.isValidEmail(attendeeData.email)) {
      throw new Error('Please enter a valid email address');
    }
    
    if (attendeeData.phone && !this.isValidPhone(attendeeData.phone)) {
      throw new Error('Please enter a valid phone number');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  // --- Synchronous methods ---

  // Create (Add) Event - Synchronous
  addEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'attendees_count' | 'checked_in_count'>): Event {
    // Validate input (CRITICAL FIX #2)
    this.validateEvent(eventData);
    
    const newId = nanoid();
    const now = new Date().toISOString();
    const newEvent: Event = {
      ...eventData,
      id: newId,
      created_at: now,
      updated_at: now,
      attendees_count: 0,
      checked_in_count: 0,
      location: eventData.location || null,
      notes: eventData.notes || null,
      expected_attendees: eventData.expected_attendees || null,
      category: eventData.category || null
    };

    try {
      // Prepare parameters with proper type safety
      const params: SQLiteBindParams = [
        newEvent.id,
        newEvent.title,
        newEvent.date,
        newEvent.time,
        newEvent.location || null,  // Ensure null not undefined
        newEvent.notes || null,     // Ensure null not undefined
        newEvent.expected_attendees || null,  // Ensure null not undefined
        newEvent.category || null,  // Ensure null not undefined
        newEvent.created_at,
        newEvent.updated_at,
        newEvent.attendees_count || 0,  // Default to 0
        newEvent.checked_in_count || 0, // Default to 0
      ];
      
      // Execute the SQL query
      const result = this.db.runSync(
        `INSERT INTO events (id, title, date, time, location, notes, expected_attendees, category, created_at, updated_at, attendees_count, checked_in_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        params
      ) as SQLiteResult;
      return newEvent; // Directly return the new event object
    } catch (error) {
      console.error('Error adding event:', error);
      throw error; // Re-throw the error for the caller to handle
    }
  }

  // Read (Get All) Events - Synchronous
  getEvents(): Event[] {
    try {
      // Use getAllSync for SELECT queries returning multiple rows
      const results = this.db.getAllSync<Event>(
        'SELECT * FROM events ORDER BY date DESC, time DESC;'
      );
      return results;
    } catch (error) {
      console.error('Error getting events:', error);
      throw error;
    }
  }

  // Read (Get Single) Event by ID - Synchronous
  getEventById(id: string): (Event & { attendees?: Attendee[] }) | null {
    try {
      // Use getFirstSync for SELECT queries expecting one row or null
      const result = this.db.getFirstSync<Event>(
        'SELECT * FROM events WHERE id = ?;',
        [id]
      );
      
      if (!result) {
        return null; // Event not found
      }
      
      // Fetch attendees for this event
      try {
        const attendees = this.getAttendees(id);
        
        // Return event with attendees included
        return {
          ...result,
          attendees: attendees
        };
      } catch (attendeesError) {
        console.warn('Error fetching attendees for event, returning event without attendees:', attendeesError);
        return result; // Return event without attendees if there was an error fetching them
      }
    } catch (error) {
      console.error('Error getting event by ID:', error);
      throw error;
    }
  }

  // Update Event - Synchronous
  updateEvent(id: string, eventData: Partial<Omit<Event, 'id' | 'created_at' | 'updated_at'>>): boolean {
    const now = new Date().toISOString();
    // Construct the SET part of the query dynamically
    const fields = Object.keys(eventData).filter(key => key !== 'id' && key !== 'created_at');
    
    if (fields.length === 0) {
      // No fields to update
      return true;
    }
    
    let setClause = '';
    // Initialize values array with proper typing
    const values: SQLiteBindParams = [];

    // Add field update values with null checks
    fields.forEach(key => {
      const value = eventData[key as keyof typeof eventData];
      // Ensure we don't pass undefined to SQLite
      values.push(value === undefined ? null : value);
      setClause += `${key} = ?, `;
    });
    
    // Remove trailing comma and space
    setClause = setClause.slice(0, -2);

    // Add updated_at and id values
    values.push(now); // Add updated_at value
    values.push(id); // Add id for the WHERE clause

    try {
      // Use the correct SQLite API - this.db.runSync takes SQL string and parameters array
      const result = this.db.runSync(
        `UPDATE events SET ${setClause}, updated_at = ? WHERE id = ?;`,
        values
      ) as SQLiteResult;
      return result.changes > 0; // Check if any rows were affected
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  // Delete Event - Synchronous (CRITICAL FIX #3 - Explicit cascade delete)
  deleteEvent(id: string): boolean {
    try {
      let success = false;
      
      this.db.withTransactionSync(() => {
        // 1. Delete custom field values for all attendees
        this.db.runSync(
          `DELETE FROM custom_field_values 
           WHERE attendee_id IN (
             SELECT id FROM attendees WHERE event_id = ?
           );`,
          [id]
        );
        
        // 2. Delete custom fields for this event
        this.db.runSync(
          'DELETE FROM custom_fields WHERE event_id = ?;',
          [id]
        );
        
        // 3. Delete attendees
        this.db.runSync(
          'DELETE FROM attendees WHERE event_id = ?;',
          [id]
        );
        
        // 4. Finally delete the event
        const result = this.db.runSync(
          'DELETE FROM events WHERE id = ?;',
          [id]
        );
        
        success = result.changes > 0;
      });
      
      return success;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // --- Asynchronous wrapper methods ---

  // Async wrapper for addEvent
  async addEventAsync(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'attendees_count' | 'checked_in_count'>): Promise<Event> {
    return new Promise((resolve, reject) => {
      // Use setTimeout to make it non-blocking
      setTimeout(() => {
        try {
          const result = this.addEvent(eventData);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
  }

  // Async wrapper for getEvents
  async getEventsAsync(): Promise<Event[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const result = this.getEvents();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
  }

  // Async wrapper for getEventById
  async getEventByIdAsync(id: string): Promise<(Event & { attendees?: Attendee[] }) | null> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const result = this.getEventById(id);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
  }

  // Async wrapper for updateEvent
  async updateEventAsync(id: string, eventData: Partial<Omit<Event, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const result = this.updateEvent(id, eventData);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
  }

  // Async wrapper for deleteEvent
  async deleteEventAsync(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const result = this.deleteEvent(id);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
  }

  // --- Attendee related methods using SQLite (Synchronous) ---

  // Add Attendee to an Event - Synchronous
  addAttendee(eventId: string, attendeeData: { name: string, email?: string, phone?: string }): Attendee {
    // Validate input (CRITICAL FIX #2)
    this.validateAttendee(attendeeData);
    
    const newId = nanoid();
    const now = new Date().toISOString();
    const newAttendee: Attendee = {
      id: newId,
      event_id: eventId,
      name: attendeeData.name,
      email: attendeeData.email || null,
      phone: attendeeData.phone || null,
      checked_in: false,
      created_at: now,
      updated_at: now,
    };

    try {
      this.db.withTransactionSync(() => {
        try {
          // Try to insert with all columns
          this.db.runSync(
            'INSERT INTO attendees (id, event_id, name, email, phone, checked_in, check_in_time, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
            [
              newAttendee.id,
              newAttendee.event_id,
              newAttendee.name,
              newAttendee.email || null, // Use null for undefined values
              newAttendee.phone || null, // Use null for undefined values
              0, // Store false as 0
              null, // check_in_time is initially null
              newAttendee.created_at,
              newAttendee.updated_at,
            ]
          );
        } catch (error) {
          // Fallback to basic insert if the columns don't exist
          console.warn('Falling back to basic attendee insert:', error);
          this.db.runSync(
            'INSERT INTO attendees (id, event_id, name, checked_in, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?);',
            [
              newAttendee.id,
              newAttendee.event_id,
              newAttendee.name,
              0, // Store false as 0
              newAttendee.created_at,
              newAttendee.updated_at,
            ]
          );
        }
        // Increment the attendee count for the event
        this.db.runSync(
          'UPDATE events SET attendees_count = attendees_count + 1, updated_at = ? WHERE id = ?;',
          [now, eventId]
        );
      });
      return newAttendee;
    } catch (error) {
      console.error('Error adding attendee:', error);
      throw error;
    }
  }

  // Get all Attendees for an Event
  getAttendees(eventId: string): Attendee[] {
    try {
      // Fetch raw data, checked_in will be 0 or 1
      const rawAttendees = this.db.getAllSync<AttendeeRaw>('SELECT * FROM attendees WHERE event_id = ? ORDER BY name COLLATE NOCASE;', [eventId]);

      // Map raw data to the Attendee interface with boolean checked_in
      const attendees = rawAttendees.map((att: AttendeeRaw) => ({
        ...att,
        checked_in: att.checked_in === 1, // Convert 1 to true, 0 to false
      }));

      return attendees;
    } catch (error) {
      console.error('Error getting attendees:', error);
      throw error;
    }
  }

  // Get a single Attendee by ID - Synchronous
  getAttendeeById(attendeeId: string): Attendee | null {
    try {
      const rawAttendee = this.db.getFirstSync<AttendeeRaw>(
        'SELECT * FROM attendees WHERE id = ?;',
        [attendeeId]
      );

      if (!rawAttendee) {
        return null;
      }

      return {
        ...rawAttendee,
        checked_in: rawAttendee.checked_in === 1,
      };
    } catch (error) {
      console.error(`Error getting attendee by ID ${attendeeId}:`, error);
      throw error;
    }
  }

  // Async wrapper for getAttendeeById
  async getAttendeeByIdAsync(attendeeId: string): Promise<Attendee | null> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const result = this.getAttendeeById(attendeeId);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
  }

  // Check-in an Attendee for an Event - Synchronous
  checkInAttendee(attendeeId: string, eventIdFromQR?: string): Attendee | null {
    const now = new Date().toISOString();
    
    try {
      console.log(`DatabaseService.checkInAttendee called with attendeeId: ${attendeeId}, eventIdFromQR: ${eventIdFromQR}`);
      
      // Fetch the attendee using the new getAttendeeById method
      const existingAttendee = this.getAttendeeById(attendeeId);

      if (!existingAttendee) {
        console.warn(`Attendee with ID ${attendeeId} not found for check-in.`);
        return null; // Attendee not found
      }

      console.log(`Found attendee: ${existingAttendee.name}, event_id: ${existingAttendee.event_id}`);
      
      // If event ID provided, validate attendee belongs to that event
      if (eventIdFromQR && existingAttendee.event_id !== eventIdFromQR) {
        throw new Error(
          `Attendee ${attendeeId} is not registered for event ${eventIdFromQR}`
        );
      }

      if (existingAttendee.checked_in) {
        console.log(`Attendee ${attendeeId} is already checked in at ${existingAttendee.check_in_time}.`);
        return existingAttendee; // Already checked in, return current status
      }

      let successfulCheckIn = false;
      this.db.withTransactionSync(() => {
        const updateResult = this.db.runSync(
          'UPDATE attendees SET checked_in = ?, check_in_time = ?, updated_at = ? WHERE id = ?;',
          [1, now, now, attendeeId] // 1 for true
        );

        if (updateResult.changes > 0) {
          this.db.runSync(
            'UPDATE events SET checked_in_count = checked_in_count + 1, updated_at = ? WHERE id = ?;',
            [now, existingAttendee.event_id]
          );
          successfulCheckIn = true;
        } else {
           console.warn(`Failed to update check-in status for attendee ${attendeeId}. No rows affected.`);
        }
      });
      
      if (successfulCheckIn) {
        // Return the updated attendee object
        return {
          ...existingAttendee,
          checked_in: true,
          check_in_time: now,
          updated_at: now,
        };
      } else {
        return null; // Check-in failed
      }
    } catch (error) {
      console.error(`Error checking in attendee ${attendeeId}:`, error);
      throw error;
    }
  }

  // Delete an Attendee from an Event
  deleteAttendee(attendeeId: string): boolean {
    const now = new Date().toISOString();
    let success = false;
    try {
      // Fetch attendee first to get event_id and checked_in status for count updates
      const attendee = this.db.getFirstSync<AttendeeRaw>('SELECT event_id, checked_in FROM attendees WHERE id = ?;', [attendeeId]);

      if (!attendee) {
         console.warn(`Attendee with ID ${attendeeId} not found for deletion.`);
         return false; // Attendee doesn't exist
      }

      this.db.withTransactionSync(() => {
         // Delete the attendee
         const deleteResult = this.db.runSync('DELETE FROM attendees WHERE id = ?;', [attendeeId]);

         if (deleteResult.changes > 0) {
           // Decrement the total attendee count for the event
           this.db.runSync(
             'UPDATE events SET attendees_count = attendees_count - 1, updated_at = ? WHERE id = ?;',
             [now, attendee.event_id]
           );

           // If the attendee was checked in, decrement the checked_in count as well
           if (attendee.checked_in === 1) {
             this.db.runSync(
               'UPDATE events SET checked_in_count = checked_in_count - 1, updated_at = ? WHERE id = ?;',
               [now, attendee.event_id]
             );
           }
           success = true;
         }
      });
      return success;
    } catch (error) {
      console.error('Error deleting attendee:', error);
      throw error;
    }
  }

  // --- Asynchronous Attendee Methods ---

  // Async wrapper for addAttendee
  async addAttendeeAsync(eventId: string, attendeeData: { name: string, email?: string, phone?: string }): Promise<Attendee> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const result = this.addAttendee(eventId, attendeeData);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
  }

  // Async wrapper for getAttendees - especially important for large attendee lists
  async getAttendeesAsync(eventId: string): Promise<Attendee[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const result = this.getAttendees(eventId);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
  }

  // Async wrapper for checkInAttendee
  async checkInAttendeeAsync(attendeeId: string, eventIdFromQR: string): Promise<Attendee | null> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Ensure the synchronous version is called with both arguments
          const result = this.checkInAttendee(attendeeId, eventIdFromQR);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
  }

  // Async wrapper for deleteAttendee
  async deleteAttendeeAsync(attendeeId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const result = this.deleteAttendee(attendeeId);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
  }
}


// Export singleton instance
export const dbService = DatabaseService.getInstance();

// Backward compatibility: export initDatabase function
export function initDatabase(): void {
  // This is now handled by the DatabaseService constructor
  // Keeping this for backward compatibility
  DatabaseService.getInstance();
}
