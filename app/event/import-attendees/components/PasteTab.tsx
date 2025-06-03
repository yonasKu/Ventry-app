import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { ClipboardText, FileArrowUp } from 'phosphor-react-native';
import { CSV_TEMPLATES } from '../../../../services/CsvService';

type PasteTabProps = {
  theme: any;
  importText: string;
  setImportText: (text: string) => void;
  importFormat: 'csv' | 'simple';
  handleImportFormat: (format: 'csv' | 'simple') => void;
  handlePaste: () => void;
  parseAttendees: () => void;
  selectedTemplate: keyof typeof CSV_TEMPLATES;
  onTemplateChange?: (template: keyof typeof CSV_TEMPLATES) => void;
};

const PasteTab = ({ 
  theme, 
  importText, 
  setImportText, 
  importFormat, 
  handleImportFormat, 
  handlePaste, 
  parseAttendees,
  selectedTemplate,
  onTemplateChange
}: PasteTabProps) => (
  <View style={[
    styles.tabContent, 
    { 
      backgroundColor: theme.colors.backgroundPrimary, 
      borderWidth: 1, 
      borderColor: 'rgba(0,0,0,0.05)' 
    },
    {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }
  ]}>
    {/* Format Selector */}
    <View style={styles.formatSelector}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        Import Format
      </Text>
      <View style={styles.formatButtons}>
        <TouchableOpacity
          style={[
            styles.formatButton,
            importFormat === 'simple' ? 
              [styles.activeFormat, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }] : 
              { 
                backgroundColor: theme.colors.backgroundSecondary, 
                borderColor: 'rgba(0,0,0,0.05)' 
              }
          ]}
          onPress={() => handleImportFormat('simple')}
        >
          <Text style={[
            styles.formatButtonText,
            { color: importFormat === 'simple' ? 'white' : theme.colors.textSecondary }
          ]}>
            Simple
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.formatButton,
            importFormat === 'csv' ? 
              [styles.activeFormat, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }] : 
              { 
                backgroundColor: theme.colors.backgroundSecondary, 
                borderColor: 'rgba(0,0,0,0.05)' 
              }
          ]}
          onPress={() => handleImportFormat('csv')}
        >
          <Text style={[
            styles.formatButtonText,
            { color: importFormat === 'csv' ? 'white' : theme.colors.textSecondary }
          ]}>
            CSV
          </Text>
        </TouchableOpacity>
      </View>
    </View>
    
    {/* Text Input Area */}
    <View style={styles.textInputContainer}>
      <View style={styles.textInputHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Paste Attendee Data
        </Text>
        <TouchableOpacity
          style={[styles.pasteButton, { backgroundColor: theme.colors.primary }]}
          onPress={handlePaste}
        >
          <ClipboardText size={16} color="#fff" weight="regular" />
          <Text style={styles.pasteButtonText}>Paste</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={[
          styles.textInput,
          { 
            color: theme.colors.textPrimary,
            backgroundColor: theme.colors.inputBackground,
            borderColor: theme.colors.border
          }
        ]}
        multiline
        placeholder={
          importFormat === 'csv' 
            ? getTemplatePlaceholder(selectedTemplate)
            : "John Doe, john@example.com, 123-456-7890\nJane Smith, jane@example.com, 987-654-3210"
        }
        placeholderTextColor={theme.colors.textTertiary}
        value={importText}
        onChangeText={setImportText}
      />
      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={parseAttendees}
        >
          <FileArrowUp size={18} color="#fff" weight="regular" />
          <Text style={styles.actionButtonText}>Parse Attendees</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  tabContent: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  formatSelector: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  formatButtons: {
    flexDirection: 'row',
  },
  formatButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFormat: {
    borderWidth: 1,
  },
  formatButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textInputContainer: {
    marginBottom: 8,
  },
  textInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  pasteButtonText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    padding: 14,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 14,
    lineHeight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonContainer: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 14,
  },
});

// Helper function to generate placeholder text based on selected template
const getTemplatePlaceholder = (template: keyof typeof CSV_TEMPLATES): string => {
  const columns = CSV_TEMPLATES[template].join(',');
  
  let exampleRow = '';
  switch (template) {
    case 'STANDARD':
      exampleRow = 'John Doe,john@example.com,123-456-7890';
      break;
    case 'CONFERENCE':
      exampleRow = 'John Doe,john@example.com,123-456-7890,Acme Inc.,Software Developer';
      break;
    case 'WORKSHOP':
      exampleRow = 'John Doe,john@example.com,123-456-7890,intermediate';
      break;
    case 'NETWORKING':
      exampleRow = 'John Doe,john@example.com,123-456-7890,technology,networking';
      break;
    default:
      exampleRow = 'John Doe,john@example.com,123-456-7890';
  }
  
  return `${columns}\n${exampleRow}`;
};

export default PasteTab;
