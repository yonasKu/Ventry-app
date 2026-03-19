/**
 * Event Store using Zustand
 * 
 * This is a lightweight state management solution for events.
 * Use this for new features - no need to migrate EventContext!
 * 
 * Usage:
 *   import { useEventStore } from '@/store/useEventStore';
 *   
 *   // In component
 *   const events = useEventStore((state) => state.events);
 *   const addEvent = useEventStore((state) => state.addEvent);
 */

import { create } from 'zustand';
import { Event } from '@/models/Event';
import { Attendee } from '@/models/Attendee';

interface EventStore {
  // State
  events: Event[];
  selectedEvent: Event | null;
  loading: boolean;
  error: string | null;
  
  // Filter state (for statistics, reports, etc.)
  filters: {
    timeFilter: 'week' | 'month' | 'year' | 'all';
    category: string | null;
    status: 'upcoming' | 'past' | 'all';
  };
  
  // Actions - Events
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  setSelectedEvent: (event: Event | null) => void;
  
  // Actions - Loading & Error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions - Filters
  setTimeFilter: (filter: 'week' | 'month' | 'year' | 'all') => void;
  setCategory: (category: string | null) => void;
  setStatus: (status: 'upcoming' | 'past' | 'all') => void;
  resetFilters: () => void;
  
  // Computed/Derived state
  getEventById: (id: string) => Event | undefined;
  getUpcomingEvents: () => Event[];
  getPastEvents: () => Event[];
  getEventsByCategory: (category: string) => Event[];
}

export const useEventStore = create<EventStore>((set, get) => ({
  // Initial state
  events: [],
  selectedEvent: null,
  loading: false,
  error: null,
  filters: {
    timeFilter: 'all',
    category: null,
    status: 'all',
  },
  
  // Event actions
  setEvents: (events) => set({ events }),
  
  addEvent: (event) => set((state) => ({ 
    events: [...state.events, event] 
  })),
  
  updateEvent: (id, updates) => set((state) => ({
    events: state.events.map(e => 
      e.id === id ? { ...e, ...updates } : e
    ),
    // Update selected event if it's the one being updated
    selectedEvent: state.selectedEvent?.id === id 
      ? { ...state.selectedEvent, ...updates }
      : state.selectedEvent,
  })),
  
  deleteEvent: (id) => set((state) => ({
    events: state.events.filter(e => e.id !== id),
    // Clear selected event if it's the one being deleted
    selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
  })),
  
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  
  // Loading & Error actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Filter actions
  setTimeFilter: (timeFilter) => set((state) => ({
    filters: { ...state.filters, timeFilter }
  })),
  
  setCategory: (category) => set((state) => ({
    filters: { ...state.filters, category }
  })),
  
  setStatus: (status) => set((state) => ({
    filters: { ...state.filters, status }
  })),
  
  resetFilters: () => set({
    filters: {
      timeFilter: 'all',
      category: null,
      status: 'all',
    }
  }),
  
  // Computed/Derived state (these don't modify state, just return computed values)
  getEventById: (id) => {
    return get().events.find(e => e.id === id);
  },
  
  getUpcomingEvents: () => {
    const now = new Date();
    return get().events.filter(e => new Date(e.date) >= now);
  },
  
  getPastEvents: () => {
    const now = new Date();
    return get().events.filter(e => new Date(e.date) < now);
  },
  
  getEventsByCategory: (category) => {
    return get().events.filter(e => e.category === category);
  },
}));

// Selectors (optional - for better performance)
// Use these to select only the data you need
export const selectEvents = (state: EventStore) => state.events;
export const selectSelectedEvent = (state: EventStore) => state.selectedEvent;
export const selectLoading = (state: EventStore) => state.loading;
export const selectError = (state: EventStore) => state.error;
export const selectFilters = (state: EventStore) => state.filters;

// Example usage in components:
/*
// 1. Simple usage - get everything
const { events, addEvent, setLoading } = useEventStore();

// 2. Selective usage - only re-render when events change
const events = useEventStore((state) => state.events);
const addEvent = useEventStore((state) => state.addEvent);

// 3. Using selectors
const events = useEventStore(selectEvents);
const loading = useEventStore(selectLoading);

// 4. Computed values
const upcomingEvents = useEventStore((state) => state.getUpcomingEvents());

// 5. Multiple values
const { events, loading, error } = useEventStore((state) => ({
  events: state.events,
  loading: state.loading,
  error: state.error,
}));
*/
