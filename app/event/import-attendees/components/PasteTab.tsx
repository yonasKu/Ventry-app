import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { ClipboardText, FileArrowUp } from 'phosphor-react-native';

type PasteTabProps = {
  theme: any;
  importText: string;
  setImportText: (text: string) => void;
  importFormat: 'csv' | 'simple';
  handleImportFormat: (format: 'csv' | 'simple') => void;
  handlePaste: () => void;
  parseAttendees: () => void;
};

const PasteTab = ({ 
  theme, 
  importText, 
  setImportText, 
  importFormat, 
  handleImportFormat, 
  handlePaste, 
  parseAttendees 
}: PasteTabProps) => (
  <View style={[styles.tabContent, { backgroundColor: theme.colors.backgroundPrimary, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }]}>
    {/* Format Selector */}
    <View style={styles.formatSelector}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        Import Format
      </Text>
      <View style={styles.formatButtons}>
        <TouchableOpacity
          style={[
            styles.formatButton,
            importFormat === 'simple' ? [styles.activeFormat, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }] : { borderColor: 'rgba(0,0,0,0.1)' }
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
            importFormat === 'csv' ? [styles.activeFormat, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }] : { borderColor: 'rgba(0,0,0,0.1)' }
          ]}
          onPress={() => handleImportFormat('csv')}
        >
          <Text style={[
            styles.formatButtonText,
            { color: importFormat === 'csv' ? theme.colors.primary : theme.colors.textSecondary }
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
            ? "name,email,phone\nJohn Doe,john@example.com,123-456-7890"
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
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
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
    backgroundColor: '#009688',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  pasteButtonText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 6,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: '#f9f9f9',
  },
  actionButtonContainer: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#009688',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 14,
  },
});

export default PasteTab;
