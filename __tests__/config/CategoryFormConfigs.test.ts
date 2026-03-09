import {
  CONFERENCE_FORM,
  RESTAURANT_FORM,
  WEDDING_FORM,
  WORKSHOP_FORM,
  SPORTS_FORM,
  getFormConfig,
  getCategoryInfo,
  getAllCategories,
} from '../../config/CategoryFormConfigs';
import { EventCategory } from '../../types/FormTypes';

describe('CategoryFormConfigs', () => {
  describe('Form Configurations', () => {
    it('should have valid conference form config', () => {
      expect(CONFERENCE_FORM.category).toBe(EventCategory.CONFERENCE);
      expect(CONFERENCE_FORM.sections.length).toBeGreaterThan(0);
      expect(CONFERENCE_FORM.displayName).toBe('Conference');
      
      // Check basic info section exists
      const basicSection = CONFERENCE_FORM.sections.find(s => s.id === 'basic_info');
      expect(basicSection).toBeDefined();
      expect(basicSection?.fields.length).toBeGreaterThan(0);
    });

    it('should have valid restaurant form config', () => {
      expect(RESTAURANT_FORM.category).toBe(EventCategory.RESTAURANT);
      expect(RESTAURANT_FORM.sections.length).toBeGreaterThan(0);
      expect(RESTAURANT_FORM.displayName).toBe('Restaurant/Club Event');
    });

    it('should have valid wedding form config', () => {
      expect(WEDDING_FORM.category).toBe(EventCategory.WEDDING);
      expect(WEDDING_FORM.sections.length).toBeGreaterThan(0);
      expect(WEDDING_FORM.displayName).toBe('Wedding');
    });

    it('should have valid workshop form config', () => {
      expect(WORKSHOP_FORM.category).toBe(EventCategory.WORKSHOP);
      expect(WORKSHOP_FORM.sections.length).toBeGreaterThan(0);
      expect(WORKSHOP_FORM.displayName).toBe('Workshop/Training');
    });

    it('should have valid sports form config', () => {
      expect(SPORTS_FORM.category).toBe(EventCategory.SPORTS);
      expect(SPORTS_FORM.sections.length).toBeGreaterThan(0);
      expect(SPORTS_FORM.displayName).toBe('Sports Tournament');
    });
  });

  describe('Required Fields', () => {
    it('should have required basic fields in all forms', () => {
      const forms = [CONFERENCE_FORM, RESTAURANT_FORM, WEDDING_FORM, WORKSHOP_FORM, SPORTS_FORM];
      
      forms.forEach(form => {
        const basicSection = form.sections.find(s => s.id === 'basic_info' || s.fields.some(f => f.id === 'title'));
        expect(basicSection).toBeDefined();
        
        const allFields = form.sections.flatMap(s => s.fields);
        const titleField = allFields.find(f => f.id === 'title');
        const locationField = allFields.find(f => f.id === 'location');
        const dateField = allFields.find(f => f.id === 'date');
        const timeField = allFields.find(f => f.id === 'time');
        
        expect(titleField?.required).toBe(true);
        expect(locationField?.required).toBe(true);
        expect(dateField?.required).toBe(true);
        expect(timeField?.required).toBe(true);
      });
    });
  });

  describe('getFormConfig', () => {
    it('should return correct config for each category', () => {
      expect(getFormConfig(EventCategory.CONFERENCE)).toEqual(CONFERENCE_FORM);
      expect(getFormConfig(EventCategory.RESTAURANT)).toEqual(RESTAURANT_FORM);
      expect(getFormConfig(EventCategory.WEDDING)).toEqual(WEDDING_FORM);
      expect(getFormConfig(EventCategory.WORKSHOP)).toEqual(WORKSHOP_FORM);
      expect(getFormConfig(EventCategory.SPORTS)).toEqual(SPORTS_FORM);
    });

    it('should throw error for invalid category', () => {
      expect(() => getFormConfig('Invalid' as EventCategory)).toThrow();
    });
  });

  describe('getCategoryInfo', () => {
    it('should return category info for valid category', () => {
      const info = getCategoryInfo(EventCategory.CONFERENCE);
      expect(info.id).toBe(EventCategory.CONFERENCE);
      expect(info.name).toBeDefined();
      expect(info.description).toBeDefined();
      expect(info.specialFields).toBeDefined();
      expect(info.estimatedTime).toBeDefined();
    });

    it('should throw error for invalid category', () => {
      expect(() => getCategoryInfo('Invalid' as EventCategory)).toThrow();
    });
  });

  describe('getAllCategories', () => {
    it('should return all 5 categories', () => {
      const categories = getAllCategories();
      expect(categories.length).toBe(5);
      
      const categoryIds = categories.map(c => c.id);
      expect(categoryIds).toContain(EventCategory.CONFERENCE);
      expect(categoryIds).toContain(EventCategory.RESTAURANT);
      expect(categoryIds).toContain(EventCategory.WEDDING);
      expect(categoryIds).toContain(EventCategory.WORKSHOP);
      expect(categoryIds).toContain(EventCategory.SPORTS);
    });

    it('should have complete info for each category', () => {
      const categories = getAllCategories();
      
      categories.forEach(category => {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.description).toBeDefined();
        expect(category.icon).toBeDefined();
        expect(category.specialFields.length).toBeGreaterThan(0);
        expect(category.estimatedTime).toBeDefined();
        expect(category.examples.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Field Validation Rules', () => {
    it('should have proper validation for required fields', () => {
      const config = CONFERENCE_FORM;
      const allFields = config.sections.flatMap(s => s.fields);
      const titleField = allFields.find(f => f.id === 'title');
      
      expect(titleField?.validation).toBeDefined();
      const requiredRule = titleField?.validation?.find(r => r.type === 'required');
      expect(requiredRule).toBeDefined();
      expect(requiredRule?.message).toBeDefined();
    });

    it('should have minLength validation for title', () => {
      const config = CONFERENCE_FORM;
      const allFields = config.sections.flatMap(s => s.fields);
      const titleField = allFields.find(f => f.id === 'title');
      
      const minLengthRule = titleField?.validation?.find(r => r.type === 'minLength');
      expect(minLengthRule).toBeDefined();
      expect(minLengthRule?.value).toBe(3);
    });
  });
});
