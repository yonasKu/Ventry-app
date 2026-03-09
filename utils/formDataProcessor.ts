import { FormFieldValue } from '../types/FormTypes';

/**
 * Extract basic event fields from form data
 */
export const extractBasicFields = (formData: Record<string, FormFieldValue>) => {
  return {
    title: formData.title as string,
    location: formData.location as string,
    date: formData.date as Date,
    time: formData.time as Date,
    expected_attendees: formData.expected_attendees as number,
  };
};

/**
 * Extract category-specific data from form data
 */
export const extractCategoryData = (formData: Record<string, FormFieldValue>) => {
  const basicFields = ['title', 'location', 'date', 'time', 'expected_attendees'];
  const categoryData: Record<string, FormFieldValue> = {};
  
  Object.keys(formData).forEach(key => {
    if (!basicFields.includes(key)) {
      categoryData[key] = formData[key];
    }
  });
  
  return categoryData;
};

/**
 * Merge basic fields and category data for event creation
 */
export const mergeFormData = (
  basicFields: ReturnType<typeof extractBasicFields>,
  categoryData: Record<string, FormFieldValue>,
  category: string
) => {
  const dateString = basicFields.date.toISOString().split('T')[0];
  const timeString = basicFields.time.toTimeString().split(' ')[0].substring(0, 5);
  
  return {
    title: basicFields.title,
    date: dateString,
    time: timeString,
    location: basicFields.location || null,
    notes: null,
    expected_attendees: basicFields.expected_attendees || null,
    category: category || null,
    category_data: JSON.stringify(categoryData),
  };
};

/**
 * Parse category data from JSON string
 */
export const parseCategoryData = (categoryDataJson: string | null): Record<string, FormFieldValue> => {
  if (!categoryDataJson) return {};
  
  try {
    return JSON.parse(categoryDataJson);
  } catch (error) {
    console.error('Error parsing category data:', error);
    return {};
  }
};
