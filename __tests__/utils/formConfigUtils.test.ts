import { getFormConfig, validateFormData, processFormData } from '../../utils/formConfigUtils';
import { EventCategory } from '../../types/FormTypes';

describe('formConfigUtils', () => {
  describe('getFormConfig', () => {
    it('should return conference form config', () => {
      const config = getFormConfig(EventCategory.CONFERENCE);
      expect(config).toBeDefined();
      expect(config.category).toBe(EventCategory.CONFERENCE);
      expect(config.sections).toBeDefined();
      expect(config.sections.length).toBeGreaterThan(0);
    });

    it('should return restaurant form config', () => {
      const config = getFormConfig(EventCategory.RESTAURANT);
      expect(config).toBeDefined();
      expect(config.category).toBe(EventCategory.RESTAURANT);
    });

    it('should return wedding form config', () => {
      const config = getFormConfig(EventCategory.WEDDING);
      expect(config).toBeDefined();
      expect(config.category).toBe(EventCategory.WEDDING);
    });

    it('should return workshop form config', () => {
      const config = getFormConfig(EventCategory.WORKSHOP);
      expect(config).toBeDefined();
      expect(config.category).toBe(EventCategory.WORKSHOP);
    });

    it('should return sports form config', () => {
      const config = getFormConfig(EventCategory.SPORTS);
      expect(config).toBeDefined();
      expect(config.category).toBe(EventCategory.SPORTS);
    });

    it('should throw error for invalid category', () => {
      expect(() => getFormConfig('InvalidCategory' as EventCategory)).toThrow();
    });
  });

  describe('validateFormData', () => {
    const config = getFormConfig(EventCategory.CONFERENCE);

    it('should validate required fields', () => {
      const validData = {
        title: 'Tech Summit 2026',
        location: 'Convention Center',
        date: new Date('2026-06-15'),
        time: new Date('2026-06-15T09:00'),
      };

      const result = validateFormData(validData, config);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should fail validation for missing required fields', () => {
      const invalidData = {
        title: '',
        location: 'Convention Center',
      };

      const result = validateFormData(invalidData, config);
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBeDefined();
    });

    it('should validate minLength rule', () => {
      const invalidData = {
        title: 'AB', // Too short (min 3 chars)
        location: 'Convention Center',
        date: new Date(),
        time: new Date(),
      };

      const result = validateFormData(invalidData, config);
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toContain('at least 3 characters');
    });

    it('should allow optional fields to be empty', () => {
      const validData = {
        title: 'Tech Summit 2026',
        location: 'Convention Center',
        date: new Date('2026-06-15'),
        time: new Date('2026-06-15T09:00'),
        // keynote_speakers is optional, not included
      };

      const result = validateFormData(validData, config);
      expect(result.isValid).toBe(true);
    });
  });

  describe('processFormData', () => {
    it('should separate basic and category-specific data', () => {
      const formData = {
        title: 'Tech Summit 2026',
        location: 'Convention Center',
        date: new Date('2026-06-15'),
        time: new Date('2026-06-15T09:00'),
        keynote_speakers: 'John Doe - AI in Healthcare',
        session_topics: ['Technology', 'AI'],
      };

      const result = processFormData(formData);
      
      expect(result.basicFields).toEqual({
        title: 'Tech Summit 2026',
        location: 'Convention Center',
        date: formData.date,
        time: formData.time,
      });

      expect(result.categoryData).toEqual({
        keynote_speakers: 'John Doe - AI in Healthcare',
        session_topics: ['Technology', 'AI'],
      });
    });

    it('should handle data with only basic fields', () => {
      const formData = {
        title: 'Simple Event',
        location: 'Venue',
        date: new Date(),
        time: new Date(),
      };

      const result = processFormData(formData);
      
      expect(result.basicFields).toBeDefined();
      expect(Object.keys(result.categoryData).length).toBe(0);
    });
  });
});
