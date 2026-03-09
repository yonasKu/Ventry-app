import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { EventCategory, FormFieldValue } from '../types/FormTypes';
import { parseCategoryData } from '../utils/formDataProcessor';

interface CategoryDataDisplayProps {
  category: EventCategory | string;
  categoryDataJson: string | null;
}

export const CategoryDataDisplay: React.FC<CategoryDataDisplayProps> = ({
  category,
  categoryDataJson,
}) => {
  const theme = useTheme();
  const categoryData = parseCategoryData(categoryDataJson);

  if (!categoryDataJson || Object.keys(categoryData).length === 0) {
    return null;
  }

  const formatFieldLabel = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatFieldValue = (value: FormFieldValue): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        {category} Details
      </Text>
      
      <View style={styles.fieldsContainer}>
        {Object.entries(categoryData).map(([key, value]) => (
          <View key={key} style={[styles.fieldRow, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
              {formatFieldLabel(key)}
            </Text>
            <Text style={[styles.fieldValue, { color: theme.colors.textPrimary }]}>
              {formatFieldValue(value)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  fieldsContainer: {
    gap: 12,
  },
  fieldRow: {
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '500',
  },
});
