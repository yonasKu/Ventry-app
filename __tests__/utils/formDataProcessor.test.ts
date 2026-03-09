import {
  extractBasicFields,
  extractCategoryData,
  mergeFormData,
  parseCategoryData,
} from '../../utils/formDataProcessor';

describe('formDataProcessor', () => {
  describe('extractBasicFields', () => {
    it('should extract basic event fields', () => {
      const formData = {
        title: 'Tech Summit',
        location: 'Convention Center',
        date: new Date('2026-06-15'),
        time: new Date('2026-06-15T09:00'),
        expected_attendees: 150,
        keynote_speakers: 'John Doe',
        session_topics: ['AI', 'Tech'],
      };

      const result = extractBasicFields(formData);

      expect(result).toEqual({
        title: 'Tech Summit',
        location: 'Convention Center',
        date: formData.date,
        time: formData.time,
        expected_attendees: 150,
      });
    });
  });

  describe('extractCategoryData', () => {
    it('should extract category-specific fields', () => {
      const formData = {
        title: 'Tech Summit',
        location: 'Convention Center',
        date: new Date('2026-06-15'),
        time: new Date('2026-06-15T09:00'),
        keynote_speakers: 'John Doe',
        session_topics: ['AI', 'Tech'],
        networking_events: true,
      };

      const result = extractCategoryData(formData);

      expect(result).toEqual({
        keynote_speakers: 'John Doe',
        session_topics: ['AI', 'Tech'],
        networking_events: true,
      });
    });

    it('should return empty object when no category data', () => {
      const formData = {
        title: 'Simple Event',
        location: 'Venue',
        date: new Date(),
        time: new Date(),
      };

      const result = extractCategoryData(formData);
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('mergeFormData', () => {
    it('should merge basic and category data for database', () => {
      const basicFields = {
        title: 'Tech Summit',
        location: 'Convention Center',
        date: new Date('2026-06-15'),
        time: new Date('2026-06-15T09:00'),
        expected_attendees: 150,
      };

      const categoryData = {
        keynote_speakers: 'John Doe',
        session_topics: ['AI', 'Tech'],
      };

      const result = mergeFormData(basicFields, categoryData, 'Conference');

      expect(result.title).toBe('Tech Summit');
      expect(result.date).toBe('2026-06-15');
      expect(result.time).toBe('09:00');
      expect(result.category).toBe('Conference');
      expect(result.category_data).toBe(JSON.stringify(categoryData));
    });

    it('should handle null/undefined values', () => {
      const basicFields = {
        title: 'Event',
        location: '',
        date: new Date('2026-06-15'),
        time: new Date('2026-06-15T09:00'),
        expected_attendees: undefined,
      };

      const result = mergeFormData(basicFields, {}, 'Conference');

      expect(result.location).toBeNull();
      expect(result.expected_attendees).toBeNull();
    });
  });

  describe('parseCategoryData', () => {
    it('should parse valid JSON string', () => {
      const jsonString = JSON.stringify({
        keynote_speakers: 'John Doe',
        session_topics: ['AI', 'Tech'],
      });

      const result = parseCategoryData(jsonString);

      expect(result).toEqual({
        keynote_speakers: 'John Doe',
        session_topics: ['AI', 'Tech'],
      });
    });

    it('should return empty object for null input', () => {
      const result = parseCategoryData(null);
      expect(result).toEqual({});
    });

    it('should return empty object for invalid JSON', () => {
      const result = parseCategoryData('invalid json {');
      expect(result).toEqual({});
    });

    it('should handle empty string', () => {
      const result = parseCategoryData('');
      expect(result).toEqual({});
    });
  });
});
