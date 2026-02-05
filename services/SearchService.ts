import AsyncStorage from '@react-native-async-storage/async-storage';
import { Attendee } from './DatabaseService';
import FilterService from './FilterService';

// ==================== Types and Interfaces ====================

export interface RecentSearch {
  id: string;              // UUID
  query: string;           // Search text
  timestamp: number;       // Unix timestamp
  eventId: string;         // Event this search belongs to
}

export interface SavedSearch {
  id: string;              // UUID
  name: string;            // User-provided name
  query: string;           // Search text
  filterType: FilterType;  // Active filter when saved
  eventId: string;         // Event this search belongs to
  createdAt: number;       // Unix timestamp
  updatedAt: number;       // Unix timestamp
}

export type FilterType = 
  | 'all' 
  | 'checked-in' 
  | 'not-checked-in' 
  | 'added-this-week' 
  | 'missing-info';

export interface FilterConfig {
  type: FilterType;
  label: string;
  icon?: string;
  predicate: (attendee: Attendee) => boolean;
}

export interface SearchState {
  query: string;
  activeFilter: FilterType;
  recentSearches: RecentSearch[];
  savedSearches: SavedSearch[];
  isLoading: boolean;
}

// ==================== Constants ====================

const MAX_RECENT_SEARCHES = 10;
const MAX_SAVED_SEARCHES = 20;
const RECENT_SEARCHES_KEY_PREFIX = '@ventry:recent_searches:';
const SAVED_SEARCHES_KEY_PREFIX = '@ventry:saved_searches:';

// ==================== SearchService Class ====================

export class SearchService {
  // ==================== Search Operations ====================

  /**
   * Perform search and filter on attendees
   */
  performSearch(
    attendees: Attendee[], 
    query: string, 
    filterType: FilterType
  ): Attendee[] {
    return FilterService.combineFilters(attendees, query, filterType);
  }

  // ==================== Recent Search History ====================

  /**
   * Get recent searches for an event
   */
  async getRecentSearches(eventId: string): Promise<RecentSearch[]> {
    try {
      const key = `${RECENT_SEARCHES_KEY_PREFIX}${eventId}`;
      const data = await AsyncStorage.getItem(key);
      
      if (!data) {
        return [];
      }
      
      const parsed = JSON.parse(data);
      return parsed.searches || [];
    } catch (error) {
      console.error('Error loading recent searches:', error);
      return [];
    }
  }

  /**
   * Save a recent search (maintains max 10, removes oldest)
   */
  async saveRecentSearch(eventId: string, query: string): Promise<void> {
    try {
      if (!query.trim()) {
        return; // Don't save empty queries
      }

      const searches = await this.getRecentSearches(eventId);
      
      // Remove duplicate if exists
      const filtered = searches.filter(s => s.query !== query);
      
      // Add new search at the beginning
      const newSearch: RecentSearch = {
        id: this.generateId(),
        query: query.trim(),
        timestamp: Date.now(),
        eventId,
      };
      
      filtered.unshift(newSearch);
      
      // Keep only the most recent MAX_RECENT_SEARCHES
      const limited = filtered.slice(0, MAX_RECENT_SEARCHES);
      
      const key = `${RECENT_SEARCHES_KEY_PREFIX}${eventId}`;
      await AsyncStorage.setItem(key, JSON.stringify({ searches: limited }));
    } catch (error) {
      console.error('Error saving recent search:', error);
      // Don't throw - gracefully degrade
    }
  }

  /**
   * Delete a specific recent search
   */
  async deleteRecentSearch(eventId: string, searchId: string): Promise<void> {
    try {
      const searches = await this.getRecentSearches(eventId);
      const filtered = searches.filter(s => s.id !== searchId);
      
      const key = `${RECENT_SEARCHES_KEY_PREFIX}${eventId}`;
      await AsyncStorage.setItem(key, JSON.stringify({ searches: filtered }));
    } catch (error) {
      console.error('Error deleting recent search:', error);
      throw error;
    }
  }

  /**
   * Clear all recent searches for an event
   */
  async clearRecentSearches(eventId: string): Promise<void> {
    try {
      const key = `${RECENT_SEARCHES_KEY_PREFIX}${eventId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
      throw error;
    }
  }

  // ==================== Saved Searches ====================

  /**
   * Get saved searches for an event
   */
  async getSavedSearches(eventId: string): Promise<SavedSearch[]> {
    try {
      const key = `${SAVED_SEARCHES_KEY_PREFIX}${eventId}`;
      const data = await AsyncStorage.getItem(key);
      
      if (!data) {
        return [];
      }
      
      const parsed = JSON.parse(data);
      return parsed.searches || [];
    } catch (error) {
      console.error('Error loading saved searches:', error);
      return [];
    }
  }

  /**
   * Save a new saved search (max 20 per event)
   */
  async saveSavedSearch(
    eventId: string, 
    name: string, 
    query: string, 
    filterType: FilterType
  ): Promise<SavedSearch> {
    try {
      if (!name.trim()) {
        throw new Error('Search name cannot be empty');
      }

      const searches = await this.getSavedSearches(eventId);
      
      if (searches.length >= MAX_SAVED_SEARCHES) {
        throw new Error(`Maximum ${MAX_SAVED_SEARCHES} saved searches reached`);
      }
      
      const newSearch: SavedSearch = {
        id: this.generateId(),
        name: name.trim(),
        query: query.trim(),
        filterType,
        eventId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      searches.push(newSearch);
      
      const key = `${SAVED_SEARCHES_KEY_PREFIX}${eventId}`;
      await AsyncStorage.setItem(key, JSON.stringify({ searches }));
      
      return newSearch;
    } catch (error) {
      console.error('Error saving saved search:', error);
      throw error;
    }
  }

  /**
   * Update a saved search name
   */
  async updateSavedSearchName(
    eventId: string, 
    searchId: string, 
    newName: string
  ): Promise<void> {
    try {
      if (!newName.trim()) {
        throw new Error('Search name cannot be empty');
      }

      const searches = await this.getSavedSearches(eventId);
      const search = searches.find(s => s.id === searchId);
      
      if (!search) {
        throw new Error('Saved search not found');
      }
      
      search.name = newName.trim();
      search.updatedAt = Date.now();
      
      const key = `${SAVED_SEARCHES_KEY_PREFIX}${eventId}`;
      await AsyncStorage.setItem(key, JSON.stringify({ searches }));
    } catch (error) {
      console.error('Error updating saved search name:', error);
      throw error;
    }
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(eventId: string, searchId: string): Promise<void> {
    try {
      const searches = await this.getSavedSearches(eventId);
      const filtered = searches.filter(s => s.id !== searchId);
      
      const key = `${SAVED_SEARCHES_KEY_PREFIX}${eventId}`;
      await AsyncStorage.setItem(key, JSON.stringify({ searches: filtered }));
    } catch (error) {
      console.error('Error deleting saved search:', error);
      throw error;
    }
  }

  /**
   * Export saved searches as JSON string
   */
  async exportSavedSearches(eventId: string): Promise<string> {
    try {
      const searches = await this.getSavedSearches(eventId);
      return JSON.stringify({ searches, version: '1.0', exportedAt: Date.now() }, null, 2);
    } catch (error) {
      console.error('Error exporting saved searches:', error);
      throw error;
    }
  }

  /**
   * Import saved searches from JSON string
   */
  async importSavedSearches(eventId: string, data: string): Promise<void> {
    try {
      const parsed = JSON.parse(data);
      
      if (!parsed.searches || !Array.isArray(parsed.searches)) {
        throw new Error('Invalid import data format');
      }
      
      const currentSearches = await this.getSavedSearches(eventId);
      
      // Merge imported searches, avoiding duplicates by name
      const merged = [...currentSearches];
      
      for (const importedSearch of parsed.searches) {
        const exists = merged.some(s => s.name === importedSearch.name);
        if (!exists && merged.length < MAX_SAVED_SEARCHES) {
          merged.push({
            ...importedSearch,
            id: this.generateId(), // Generate new ID
            eventId, // Use current event ID
            updatedAt: Date.now(),
          });
        }
      }
      
      const key = `${SAVED_SEARCHES_KEY_PREFIX}${eventId}`;
      await AsyncStorage.setItem(key, JSON.stringify({ searches: merged }));
    } catch (error) {
      console.error('Error importing saved searches:', error);
      throw error;
    }
  }

  // ==================== Utility Methods ====================

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export default new SearchService();
