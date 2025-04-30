import { nanoid } from 'nanoid/non-secure';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define interfaces
export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string | null;
  notes?: string | null;
  expected_attendees?: number | null;
  created_at: string;
  updated_at: string;
  attendees_count?: number;
  checked_in_count?: number;
}

const STORAGE_KEY = 'ventry_events';
const ATTENDEES_KEY = 'ventry_attendees';

// Initialize database
export function initDatabase(): Promise<void> {
  return new Promise((resolve) => {
    console.log('Initializing in-memory database...');
    resolve();
  });
}

// Event operations
export const EventsDB = {
  // Get all events
  getEvents(): Promise<Event[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const storedEvents = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedEvents) {
          const events = JSON.parse(storedEvents) as Event[];
          console.log('Events fetched:', events);
          resolve(events);
        } else {
          resolve([]);
        }
      } catch (error: any) {
        console.error('Error in getEvents:', error);
        reject(error);
      }
    });
  },
  
  // Get event by ID
  getEventById(id: string): Promise<Event> {
    return new Promise(async (resolve, reject) => {
      try {
        const storedEvents = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedEvents) {
          const events = JSON.parse(storedEvents) as Event[];
          const event = events.find(e => e.id === id);
          if (event) {
            resolve(event);
          } else {
            reject(new Error(`Event with id ${id} not found`));
          }
        } else {
          reject(new Error(`Event with id ${id} not found`));
        }
      } catch (error: any) {
        console.error('Error in getEventById:', error);
        reject(error);
      }
    });
  },
  
  // Create a new event
  createEvent(event: {
    id: string;
    title: string;
    date: string;
    time: string;
    location?: string | null;
    notes?: string | null;
    expected_attendees?: number | null;
  }): Promise<Event> {
    return new Promise(async (resolve, reject) => {
      try {
        const now = new Date().toISOString();
        console.log('Creating event with data:', JSON.stringify(event, null, 2));
        
        const newEvent: Event = {
          ...event,
          created_at: now,
          updated_at: now,
          attendees_count: 0,
          checked_in_count: 0
        };
        
        const storedEvents = await AsyncStorage.getItem(STORAGE_KEY);
        let events: Event[] = [];
        
        if (storedEvents) {
          events = JSON.parse(storedEvents);
        }
        
        events.push(newEvent);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
        
        resolve(newEvent);
      } catch (error: any) {
        console.error('Error in createEvent:', error);
        reject(error);
      }
    });
  },
  
  // Update an event
  updateEvent(event: Event): Promise<Event> {
    return new Promise(async (resolve, reject) => {
      try {
        const now = new Date().toISOString();
        
        const storedEvents = await AsyncStorage.getItem(STORAGE_KEY);
        if (!storedEvents) {
          reject(new Error('No events found'));
          return;
        }
        
        let events: Event[] = JSON.parse(storedEvents);
        const index = events.findIndex(e => e.id === event.id);
        
        if (index === -1) {
          reject(new Error('Event not found'));
          return;
        }
        
        const updatedEvent: Event = {
          ...event,
          updated_at: now
        };
        
        events[index] = updatedEvent;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
        
        resolve(updatedEvent);
      } catch (error: any) {
        console.error('Error in updateEvent:', error);
        reject(error);
      }
    });
  },
  
  // Delete an event
  deleteEvent(id: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        const storedEvents = await AsyncStorage.getItem(STORAGE_KEY);
        if (!storedEvents) {
          resolve(false);
          return;
        }
        
        let events: Event[] = JSON.parse(storedEvents);
        const filteredEvents = events.filter(e => e.id !== id);
        
        if (filteredEvents.length === events.length) {
          resolve(false);
          return;
        }
        
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEvents));
        resolve(true);
      } catch (error: any) {
        console.error('Error in deleteEvent:', error);
        reject(error);
      }
    });
  }
};