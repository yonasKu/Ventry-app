import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, EventSummary } from '../models/Event';
import { nanoid } from 'nanoid';

interface EventState {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadEvents: () => Promise<void>;
  addEvent: (eventData: Omit<Event, 'id' | 'attendees' | 'createdAt' | 'updatedAt'>) => Promise<Event>;
  updateEvent: (event: Event) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEventById: (id: string) => Event | undefined;
  getEventSummaries: () => EventSummary[];
}

const STORAGE_KEY = 'ventry_events';

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,

  loadEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const storedEvents = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedEvents) {
        // Parse dates which are stored as strings in AsyncStorage
        const parsedEvents = JSON.parse(storedEvents, (key, value) => {
          if (key === 'date' || key === 'time' || key === 'createdAt' || key === 'updatedAt' || key === 'checkInTime') {
            return value ? new Date(value) : null;
          }
          return value;
        });
        set({ events: parsedEvents });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load events' });
    } finally {
      set({ isLoading: false });
    }
  },

  addEvent: async (eventData) => {
    const newEvent: Event = {
      id: nanoid(),
      ...eventData,
      attendees: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({ events: [...state.events, newEvent] }));
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().events));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save event' });
    }
    
    return newEvent;
  },

  updateEvent: async (updatedEvent) => {
    set((state) => ({
      events: state.events.map((event) => 
        event.id === updatedEvent.id 
          ? { ...updatedEvent, updatedAt: new Date() } 
          : event
      ),
    }));
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().events));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update event' });
    }
  },

  deleteEvent: async (id) => {
    set((state) => ({
      events: state.events.filter((event) => event.id !== id),
    }));
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().events));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete event' });
    }
  },

  getEventById: (id) => {
    return get().events.find((event) => event.id === id);
  },

  getEventSummaries: () => {
    return get().events.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      attendeesCount: event.attendees.length,
      checkedInCount: event.attendees.filter((attendee) => attendee.checkedIn).length,
    }));
  },
}));
