import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { X } from 'phosphor-react-native';

type ValidationErrorsProps = {
  theme: any;
  errors: Array<{
    message: string;
    row?: number;
    type?: string;
  }>;
  missingColumns: string[];
  onDismiss: () => void;
};

const ValidationErrors = ({ 
  theme, 
  errors, 
  missingColumns,
  onDismiss 
}: ValidationErrorsProps) => {
  if (errors.length === 0 && missingColumns.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.errorLight || '#FFEBEE' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.error || '#D32F2F' }]}>
          Import Validation Issues
        </Text>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <X size={18} color={theme.colors.error || '#D32F2F'} weight="bold" />
        </TouchableOpacity>
      </View>

      {missingColumns.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.error || '#D32F2F' }]}>
            Missing Required Columns:
          </Text>
          <View style={styles.columnList}>
            {missingColumns.map((column, index) => (
              <View 
                key={`column-${index}`} 
                style={[styles.columnTag, { backgroundColor: theme.colors.error || '#D32F2F' }]}
              >
                <Text style={styles.columnTagText}>{column}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {errors.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.error || '#D32F2F' }]}>
            {errors.length} {errors.length === 1 ? 'Error' : 'Errors'} Found:
          </Text>
          <ScrollView style={styles.errorList} contentContainerStyle={styles.errorListContent}>
            {errors.map((error, index) => (
              <View key={`error-${index}`} style={styles.errorItem}>
                <Text style={[styles.errorText, { color: theme.colors.textPrimary }]}>
                  {error.message}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
        Please fix these issues in your CSV file and try again. You can download a template for reference.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  columnList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  columnTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  columnTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  errorList: {
    maxHeight: 150,
  },
  errorListContent: {
    paddingBottom: 4,
  },
  errorItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 13,
  },
  helpText: {
    fontSize: 13,
    marginTop: 8,
  },
});

export default ValidationErrors;
