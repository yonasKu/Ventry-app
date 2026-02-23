/**
 * FilterService Tests
 * 
 * Tests attendee filtering logic with various filter types.
 */

import FilterService from '../../services/FilterService';
import { FilterType } from '../../services/SearchService';
import { Attendee } from '../../services/DatabaseService';
import { createMockAttendees } from '../setup/mocks';

describe('FilterService - Filter Types', () => {
  describe('applyFilter - all', () => {
    it('should return all attendees', () => {
      const attendees = createMockAttendees(10, 'event-1');
      
      const result = FilterService.applyFilter(attendees, 'all');

      expect(result).toHaveLength(10);
      expect(result).toEqual(attendees);
    });

    it('should return empty array for empty input', () => {
      const result = FilterService.applyFilter([], 'all');

      expect(result).toEqual([]);
    });
  });

  describe('applyFilter - checked-in', () => {
    it('should return only checked-in attendees', () => {
      const attendees = createMockAttendees(10, 'event-1');
      
      const result = FilterService.applyFilter(attendees, 'checked-in');

      expect(result.every(a => a.checkedIn === true)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array if no checked-in attendees', () => {
      const attendees = createMockAttendees(10, 'event-1').map(a => ({
        ...a,
        checkedIn: false,
      }));
      
      const result = FilterService.applyFilter(attendees, 'checked-in');

      expect(result).toEqual([]);
    });
  });

  describe('applyFilter - not-checked-in', () => {
    it('should return only not-checked-in attendees', () => {
      const attendees = createMockAttendees(10, 'event-1');
      
      const result = FilterService.applyFilter(attendees, 'not-checked-in');

      expect(result.every(a => a.checkedIn !== true)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array if all checked-in', () => {
      const attendees = createMockAttendees(10, 'event-1').map(a => ({
        ...a,
        checkedIn: true,
      }));
      
      const result = FilterService.applyFilter(attendees, 'not-checked-in');

      expect(result).toEqual([]);
    });
  });

  describe('applyFilter - added-this-week', () => {
    it('should return attendees added in last 7 days', () => {
      const now = new Date();
      const attendees: Attendee[] = [
        {
          id: '1',
          event_id: 'event-1',
          name: 'Recent',
          email: null,
          phone: null,
          checked_in: false,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
        {
          id: '2',
          event_id: 'event-1',
          name: 'Old',
          email: null,
          phone: null,
          checked_in: false,
          created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      
      const result = FilterService.applyFilter(attendees, 'added-this-week');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Recent');
    });

    it('should return empty array if no recent attendees', () => {
      const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const attendees: Attendee[] = [
        {
          id: '1',
          event_id: 'event-1',
          name: 'Old',
          email: null,
          phone: null,
          checked_in: false,
          created_at: oldDate.toISOString(),
          updated_at: oldDate.toISOString(),
        },
      ];
      
      const result = FilterService.applyFilter(attendees, 'added-this-week');

      expect(result).toEqual([]);
    });
  });

  describe('applyFilter - missing-info', () => {
    it('should return attendees with missing name', () => {
      const attendees: Attendee[] = [
        {
          id: '1',
          event_id: 'event-1',
          name: '',
          email: 'test@example.com',
          phone: null,
          checked_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      const result = FilterService.applyFilter(attendees, 'missing-info');

      expect(result).toHaveLength(1);
    });

    it('should return attendees with missing email', () => {
      const attendees: Attendee[] = [
        {
          id: '1',
          event_id: 'event-1',
          name: 'John Doe',
          email: '',
          phone: null,
          checked_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      const result = FilterService.applyFilter(attendees, 'missing-info');

      expect(result).toHaveLength(1);
    });

    it('should not return attendees with complete info', () => {
      const attendees: Attendee[] = [
        {
          id: '1',
          event_id: 'event-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          checked_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      const result = FilterService.applyFilter(attendees, 'missing-info');

      expect(result).toEqual([]);
    });
  });

  describe('applyFilter - error handling', () => {
    it('should exclude attendees that cause predicate errors', () => {
      const attendees: Attendee[] = [
        {
          id: '1',
          event_id: 'event-1',
          name: 'Valid',
          email: 'test@example.com',
          phone: null,
          checked_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          event_id: 'event-1',
          name: 'Invalid',
          email: null,
          phone: null,
          checked_in: false,
          created_at: 'invalid-date', // This might cause error
          updated_at: new Date().toISOString(),
        },
      ];
      
      // Should not throw error
      expect(() => FilterService.applyFilter(attendees, 'added-this-week')).not.toThrow();
    });
  });
});

describe('FilterService - Combined Filters', () => {
  describe('combineFilters', () => {
    it('should combine text search with filter', () => {
      const attendees = createMockAttendees(10, 'event-1');
      
      const result = FilterService.combineFilters(attendees, 'Attendee 1', 'all');

      expect(result.length).toBeGreaterThan(0);
      expect(result.every(a => a.name.includes('Attendee 1'))).toBe(true);
    });

    it('should search by name', () => {
      const attendees: Attendee[] = [
        {
          id: '1',
          event_id: 'event-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: null,
          checked_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      const result = FilterService.combineFilters(attendees, 'john', 'all');

      expect(result).toHaveLength(1);
    });

    it('should search by email', () => {
      const attendees: Attendee[] = [
        {
          id: '1',
          event_id: 'event-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: null,
          checked_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      const result = FilterService.combineFilters(attendees, 'example.com', 'all');

      expect(result).toHaveLength(1);
    });

    it('should search by phone', () => {
      const attendees: Attendee[] = [
        {
          id: '1',
          event_id: 'event-1',
          name: 'John Doe',
          email: null,
          phone: '+1234567890',
          checked_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      const result = FilterService.combineFilters(attendees, '1234', 'all');

      expect(result).toHaveLength(1);
    });

    it('should be case-insensitive', () => {
      const attendees: Attendee[] = [
        {
          id: '1',
          event_id: 'event-1',
          name: 'John Doe',
          email: 'JOHN@EXAMPLE.COM',
          phone: null,
          checked_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      const result = FilterService.combineFilters(attendees, 'john', 'all');

      expect(result).toHaveLength(1);
    });

    it('should return all matching filter if query is empty', () => {
      const attendees = createMockAttendees(10, 'event-1');
      
      const result = FilterService.combineFilters(attendees, '', 'checked-in');

      expect(result.every(a => a.checkedIn === true)).toBe(true);
    });

    it('should apply filter before text search', () => {
      const attendees = createMockAttendees(10, 'event-1');
      
      const result = FilterService.combineFilters(attendees, 'Attendee', 'checked-in');

      expect(result.every(a => a.checkedIn === true)).toBe(true);
      expect(result.every(a => a.name.includes('Attendee'))).toBe(true);
    });

    it('should handle null/undefined values gracefully', () => {
      const attendees: Attendee[] = [
        {
          id: '1',
          event_id: 'event-1',
          name: 'John',
          email: null,
          phone: null,
          checked_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      expect(() => FilterService.combineFilters(attendees, 'test', 'all')).not.toThrow();
    });

    it('should trim query before searching', () => {
      const attendees: Attendee[] = [
        {
          id: '1',
          event_id: 'event-1',
          name: 'John Doe',
          email: null,
          phone: null,
          checked_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      const result = FilterService.combineFilters(attendees, '  john  ', 'all');

      expect(result).toHaveLength(1);
    });

    it('should handle errors gracefully', () => {
      const attendees: Attendee[] = [
        {
          id: '1',
          event_id: 'event-1',
          name: 'Valid',
          email: null,
          phone: null,
          checked_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      expect(() => FilterService.combineFilters(attendees, 'test', 'all')).not.toThrow();
    });
  });
});

describe('FilterService - Filter Counts', () => {
  describe('getFilterCount', () => {
    it('should return count of filtered attendees', () => {
      const attendees = createMockAttendees(10, 'event-1');
      
      const count = FilterService.getFilterCount(attendees, 'all');

      expect(count).toBe(10);
    });

    it('should return correct count for checked-in filter', () => {
      const attendees = createMockAttendees(10, 'event-1');
      const checkedInCount = attendees.filter(a => a.checkedIn).length;
      
      const count = FilterService.getFilterCount(attendees, 'checked-in');

      expect(count).toBe(checkedInCount);
    });

    it('should return 0 for empty array', () => {
      const count = FilterService.getFilterCount([], 'all');

      expect(count).toBe(0);
    });

    it('should return 0 if no matches', () => {
      const attendees = createMockAttendees(10, 'event-1').map(a => ({
        ...a,
        checkedIn: false,
      }));
      
      const count = FilterService.getFilterCount(attendees, 'checked-in');

      expect(count).toBe(0);
    });
  });
});

describe('FilterService - Filter Configuration', () => {
  describe('getFilterConfig', () => {
    it('should return config for all filter', () => {
      const config = FilterService.getFilterConfig('all');

      expect(config).toBeDefined();
      expect(config.type).toBe('all');
      expect(config.label).toBe('All');
      expect(config.predicate).toBeDefined();
    });

    it('should return config for checked-in filter', () => {
      const config = FilterService.getFilterConfig('checked-in');

      expect(config.type).toBe('checked-in');
      expect(config.label).toBe('Checked In');
    });

    it('should return config for not-checked-in filter', () => {
      const config = FilterService.getFilterConfig('not-checked-in');

      expect(config.type).toBe('not-checked-in');
      expect(config.label).toBe('Not Checked In');
    });

    it('should return config for added-this-week filter', () => {
      const config = FilterService.getFilterConfig('added-this-week');

      expect(config.type).toBe('added-this-week');
      expect(config.label).toBe('Added This Week');
    });

    it('should return config for missing-info filter', () => {
      const config = FilterService.getFilterConfig('missing-info');

      expect(config.type).toBe('missing-info');
      expect(config.label).toBe('Missing Info');
    });
  });

  describe('getAllFilterTypes', () => {
    it('should return all filter types', () => {
      const types = FilterService.getAllFilterTypes();

      expect(types).toContain('all');
      expect(types).toContain('checked-in');
      expect(types).toContain('not-checked-in');
      expect(types).toContain('added-this-week');
      expect(types).toContain('missing-info');
      expect(types.length).toBe(5);
    });
  });

  describe('getAllFilterConfigs', () => {
    it('should return all filter configurations', () => {
      const configs = FilterService.getAllFilterConfigs();

      expect(configs).toHaveLength(5);
      expect(configs.every(c => c.type && c.label && c.predicate)).toBe(true);
    });
  });
});
