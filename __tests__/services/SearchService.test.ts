/**
 * SearchService Tests
 * 
 * Tests search history, saved searches, and AsyncStorage persistence.
 */

import { SearchService, RecentSearch, SavedSearch, FilterType } from '../../services/SearchService';
import { mockAttendee, createMockAttendees } from '../setup/mocks';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('SearchService - Search Operations', () => {
  let service: SearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SearchService();
  });

  describe('performSearch', () => {
    it('should search and filter attendees', () => {
      const attendees = createMockAttendees(10, 'event-1');
      
      const result = service.performSearch(attendees, 'Attendee 1', 'all');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return filtered results', () => {
      const attendees = createMockAttendees(10, 'event-1');
      
      const result = service.performSearch(attendees, '', 'checked-in');

      expect(result.every(a => a.checkedIn)).toBe(true);
    });

    it('should combine search query with filter', () => {
      const attendees = createMockAttendees(10, 'event-1');
      
      const result = service.performSearch(attendees, 'Attendee 2', 'all');

      expect(result.length).toBeGreaterThan(0);
      expect(result.every(a => a.name.includes('Attendee 2'))).toBe(true);
    });
  });
});

describe('SearchService - Recent Search History', () => {
  let service: SearchService;
  const eventId = 'test-event-1';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SearchService();
  });

  describe('getRecentSearches', () => {
    it('should return recent searches for event', async () => {
      const mockSearches: RecentSearch[] = [
        { id: '1', query: 'John', timestamp: Date.now(), eventId },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ searches: mockSearches })
      );

      const result = await service.getRecentSearches(eventId);

      expect(result).toEqual(mockSearches);
      expect(result).toHaveLength(1);
    });

    it('should return empty array if no searches', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await service.getRecentSearches(eventId);

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await service.getRecentSearches(eventId);

      expect(result).toEqual([]);
    });

    it('should use correct storage key', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await service.getRecentSearches(eventId);

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(`@ventry:recent_searches:${eventId}`);
    });
  });

  describe('saveRecentSearch', () => {
    it('should save search query', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ searches: [] }));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await service.saveRecentSearch(eventId, 'John Doe');

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should not save empty queries', async () => {
      await service.saveRecentSearch(eventId, '');

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should not save whitespace-only queries', async () => {
      await service.saveRecentSearch(eventId, '   ');

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should trim query before saving', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ searches: [] }));
      (AsyncStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        const data = JSON.parse(value);
        expect(data.searches[0].query).toBe('John');
        return Promise.resolve();
      });

      await service.saveRecentSearch(eventId, '  John  ');
    });

    it('should remove duplicate queries', async () => {
      const existingSearches: RecentSearch[] = [
        { id: '1', query: 'John', timestamp: Date.now() - 1000, eventId },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ searches: existingSearches })
      );
      (AsyncStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        const data = JSON.parse(value);
        expect(data.searches).toHaveLength(1);
        expect(data.searches[0].query).toBe('John');
        return Promise.resolve();
      });

      await service.saveRecentSearch(eventId, 'John');
    });

    it('should add new search at beginning', async () => {
      const existingSearches: RecentSearch[] = [
        { id: '1', query: 'Old', timestamp: Date.now() - 1000, eventId },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ searches: existingSearches })
      );
      (AsyncStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        const data = JSON.parse(value);
        expect(data.searches[0].query).toBe('New');
        return Promise.resolve();
      });

      await service.saveRecentSearch(eventId, 'New');
    });

    it('should limit to 10 recent searches', async () => {
      const existingSearches: RecentSearch[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        query: `Query ${i}`,
        timestamp: Date.now() - i * 1000,
        eventId,
      }));
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ searches: existingSearches })
      );
      (AsyncStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        const data = JSON.parse(value);
        expect(data.searches.length).toBeLessThanOrEqual(10);
        return Promise.resolve();
      });

      await service.saveRecentSearch(eventId, 'New Query');
    });

    it('should not throw on save error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ searches: [] }));
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(service.saveRecentSearch(eventId, 'Test')).resolves.not.toThrow();
    });
  });

  describe('deleteRecentSearch', () => {
    it('should delete specific search', async () => {
      const searches: RecentSearch[] = [
        { id: '1', query: 'John', timestamp: Date.now(), eventId },
        { id: '2', query: 'Jane', timestamp: Date.now(), eventId },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ searches })
      );
      (AsyncStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        const data = JSON.parse(value);
        expect(data.searches).toHaveLength(1);
        expect(data.searches[0].id).toBe('2');
        return Promise.resolve();
      });

      await service.deleteRecentSearch(eventId, '1');
    });

    it('should throw error on delete failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(service.deleteRecentSearch(eventId, '1')).rejects.toThrow();
    });
  });

  describe('clearRecentSearches', () => {
    it('should clear all recent searches', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await service.clearRecentSearches(eventId);

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(`@ventry:recent_searches:${eventId}`);
    });

    it('should throw error on clear failure', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(service.clearRecentSearches(eventId)).rejects.toThrow();
    });
  });
});

describe('SearchService - Saved Searches', () => {
  let service: SearchService;
  const eventId = 'test-event-1';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SearchService();
  });

  describe('getSavedSearches', () => {
    it('should return saved searches for event', async () => {
      const mockSearches: SavedSearch[] = [
        {
          id: '1',
          name: 'VIP Guests',
          query: 'VIP',
          filterType: 'all',
          eventId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ searches: mockSearches })
      );

      const result = await service.getSavedSearches(eventId);

      expect(result).toEqual(mockSearches);
    });

    it('should return empty array if no saved searches', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await service.getSavedSearches(eventId);

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await service.getSavedSearches(eventId);

      expect(result).toEqual([]);
    });
  });

  describe('saveSavedSearch', () => {
    it('should save new saved search', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ searches: [] }));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await service.saveSavedSearch(eventId, 'VIP Guests', 'VIP', 'all');

      expect(result).toBeDefined();
      expect(result.name).toBe('VIP Guests');
      expect(result.query).toBe('VIP');
      expect(result.filterType).toBe('all');
    });

    it('should throw error if name is empty', async () => {
      await expect(
        service.saveSavedSearch(eventId, '', 'query', 'all')
      ).rejects.toThrow('Search name cannot be empty');
    });

    it('should throw error if name is whitespace', async () => {
      await expect(
        service.saveSavedSearch(eventId, '   ', 'query', 'all')
      ).rejects.toThrow('Search name cannot be empty');
    });

    it('should throw error if max searches reached', async () => {
      const maxSearches: SavedSearch[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        name: `Search ${i}`,
        query: `query${i}`,
        filterType: 'all' as FilterType,
        eventId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ searches: maxSearches })
      );

      await expect(
        service.saveSavedSearch(eventId, 'New', 'query', 'all')
      ).rejects.toThrow('Maximum 20 saved searches reached');
    });

    it('should trim name and query', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ searches: [] }));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await service.saveSavedSearch(eventId, '  VIP  ', '  query  ', 'all');

      expect(result.name).toBe('VIP');
      expect(result.query).toBe('query');
    });

    it('should generate unique ID', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ searches: [] }));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await service.saveSavedSearch(eventId, 'Test', 'query', 'all');

      expect(result.id).toBeDefined();
      expect(result.id.length).toBeGreaterThan(0);
    });

    it('should set timestamps', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ searches: [] }));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await service.saveSavedSearch(eventId, 'Test', 'query', 'all');

      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('updateSavedSearchName', () => {
    it('should update search name', async () => {
      const searches: SavedSearch[] = [
        {
          id: '1',
          name: 'Old Name',
          query: 'query',
          filterType: 'all',
          eventId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ searches })
      );
      (AsyncStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        const data = JSON.parse(value);
        expect(data.searches[0].name).toBe('New Name');
        return Promise.resolve();
      });

      await service.updateSavedSearchName(eventId, '1', 'New Name');
    });

    it('should throw error if name is empty', async () => {
      await expect(
        service.updateSavedSearchName(eventId, '1', '')
      ).rejects.toThrow('Search name cannot be empty');
    });

    it('should throw error if search not found', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ searches: [] })
      );

      await expect(
        service.updateSavedSearchName(eventId, 'non-existent', 'New Name')
      ).rejects.toThrow('Saved search not found');
    });

    it('should update updatedAt timestamp', async () => {
      const oldTimestamp = Date.now() - 10000;
      const searches: SavedSearch[] = [
        {
          id: '1',
          name: 'Old',
          query: 'query',
          filterType: 'all',
          eventId,
          createdAt: oldTimestamp,
          updatedAt: oldTimestamp,
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ searches })
      );
      (AsyncStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        const data = JSON.parse(value);
        expect(data.searches[0].updatedAt).toBeGreaterThan(oldTimestamp);
        return Promise.resolve();
      });

      await service.updateSavedSearchName(eventId, '1', 'New');
    });
  });

  describe('deleteSavedSearch', () => {
    it('should delete saved search', async () => {
      const searches: SavedSearch[] = [
        {
          id: '1',
          name: 'Test',
          query: 'query',
          filterType: 'all',
          eventId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ searches })
      );
      (AsyncStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        const data = JSON.parse(value);
        expect(data.searches).toHaveLength(0);
        return Promise.resolve();
      });

      await service.deleteSavedSearch(eventId, '1');
    });

    it('should throw error on delete failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(service.deleteSavedSearch(eventId, '1')).rejects.toThrow();
    });
  });

  describe('exportSavedSearches', () => {
    it('should export searches as JSON', async () => {
      const searches: SavedSearch[] = [
        {
          id: '1',
          name: 'Test',
          query: 'query',
          filterType: 'all',
          eventId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ searches })
      );

      const result = await service.exportSavedSearches(eventId);

      expect(result).toBeDefined();
      const parsed = JSON.parse(result);
      expect(parsed.searches).toEqual(searches);
      expect(parsed.version).toBe('1.0');
      expect(parsed.exportedAt).toBeDefined();
    });
  });

  describe('importSavedSearches', () => {
    it('should import searches from JSON', async () => {
      const importData = {
        searches: [
          {
            id: '1',
            name: 'Imported',
            query: 'query',
            filterType: 'all' as FilterType,
            eventId: 'old-event',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        version: '1.0',
        exportedAt: Date.now(),
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ searches: [] })
      );
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await service.importSavedSearches(eventId, JSON.stringify(importData));

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should throw error for invalid import data', async () => {
      await expect(
        service.importSavedSearches(eventId, '{"invalid": true}')
      ).rejects.toThrow('Invalid import data format');
    });

    it('should skip duplicate names', async () => {
      const existing: SavedSearch[] = [
        {
          id: '1',
          name: 'Existing',
          query: 'query',
          filterType: 'all',
          eventId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      const importData = {
        searches: [
          {
            id: '2',
            name: 'Existing', // Duplicate name
            query: 'different',
            filterType: 'all' as FilterType,
            eventId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ searches: existing })
      );
      (AsyncStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        const data = JSON.parse(value);
        expect(data.searches).toHaveLength(1); // Should not add duplicate
        return Promise.resolve();
      });

      await service.importSavedSearches(eventId, JSON.stringify(importData));
    });

    it('should respect max searches limit', async () => {
      const existing: SavedSearch[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        name: `Search ${i}`,
        query: 'query',
        filterType: 'all' as FilterType,
        eventId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
      const importData = {
        searches: [
          {
            id: '21',
            name: 'New',
            query: 'query',
            filterType: 'all' as FilterType,
            eventId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ searches: existing })
      );
      (AsyncStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        const data = JSON.parse(value);
        expect(data.searches.length).toBeLessThanOrEqual(20);
        return Promise.resolve();
      });

      await service.importSavedSearches(eventId, JSON.stringify(importData));
    });
  });
});
