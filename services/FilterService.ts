import { Attendee } from './DatabaseService';
import { FilterType, FilterConfig } from './SearchService';

// ==================== Filter Configurations ====================

const FILTER_CONFIGS: Record<FilterType, FilterConfig> = {
  'all': {
    type: 'all',
    label: 'All',
    predicate: () => true,
  },
  'checked-in': {
    type: 'checked-in',
    label: 'Checked In',
    predicate: (attendee) => attendee.checked_in === true,
  },
  'not-checked-in': {
    type: 'not-checked-in',
    label: 'Not Checked In',
    predicate: (attendee) => attendee.checked_in !== true,
  },
  'added-this-week': {
    type: 'added-this-week',
    label: 'Added This Week',
    predicate: (attendee) => {
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const createdAt = attendee.created_at ? new Date(attendee.created_at).getTime() : 0;
      return createdAt >= weekAgo;
    },
  },
  'missing-info': {
    type: 'missing-info',
    label: 'Missing Info',
    predicate: (attendee) => {
      // Check if name or email is missing
      if (!attendee.name?.trim() || !attendee.email?.trim()) {
        return true;
      }
      // Future: Check custom fields when implemented
      return false;
    },
  },
};

// ==================== FilterService Class ====================

export class FilterService {
  /**
   * Apply a filter to attendees
   */
  applyFilter(attendees: Attendee[], filterType: FilterType): Attendee[] {
    const config = this.getFilterConfig(filterType);
    
    return attendees.filter(attendee => {
      try {
        return config.predicate(attendee);
      } catch (error) {
        console.error('Filter predicate error:', error, attendee);
        return false; // Exclude from results on error
      }
    });
  }

  /**
   * Combine text search with filter
   */
  combineFilters(
    attendees: Attendee[], 
    query: string, 
    filterType: FilterType
  ): Attendee[] {
    const normalizedQuery = query.toLowerCase().trim();
    const filterConfig = this.getFilterConfig(filterType);
    
    return attendees.filter(attendee => {
      try {
        // Apply filter predicate first
        if (!filterConfig.predicate(attendee)) {
          return false;
        }
        
        // If no query, return all that pass filter
        if (!normalizedQuery) {
          return true;
        }
        
        // Text search on name, email, phone
        const searchableText = [
          attendee.name || '',
          attendee.email || '',
          attendee.phone || '',
        ].join(' ').toLowerCase();
        
        return searchableText.includes(normalizedQuery);
      } catch (error) {
        console.error('Combined filter error:', error, attendee);
        return false;
      }
    });
  }

  /**
   * Get count of attendees matching a filter
   */
  getFilterCount(attendees: Attendee[], filterType: FilterType): number {
    return this.applyFilter(attendees, filterType).length;
  }

  /**
   * Get filter configuration
   */
  getFilterConfig(filterType: FilterType): FilterConfig {
    return FILTER_CONFIGS[filterType];
  }

  /**
   * Get all filter types
   */
  getAllFilterTypes(): FilterType[] {
    return Object.keys(FILTER_CONFIGS) as FilterType[];
  }

  /**
   * Get all filter configurations
   */
  getAllFilterConfigs(): FilterConfig[] {
    return Object.values(FILTER_CONFIGS);
  }
}

// Export singleton instance
export default new FilterService();
