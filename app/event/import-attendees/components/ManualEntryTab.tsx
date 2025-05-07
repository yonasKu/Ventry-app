import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Plus, UserPlus } from 'phosphor-react-native';

type ManualEntryTabProps = {
  theme: any;
  parsedAttendees: any[];
  handleAddAttendee: () => void;
};

const ManualEntryTab = ({ theme, parsedAttendees, handleAddAttendee }: ManualEntryTabProps) => (
  <View style={[styles.tabContent, { backgroundColor: theme.colors.backgroundPrimary, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }]}>
    <View style={styles.manualEntryHeader}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        Manual Entry
      </Text>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddAttendee}
      >
        <Plus size={16} color="#fff" weight="regular" />
        <Text style={styles.addButtonText}>Add Attendee</Text>
      </TouchableOpacity>
    </View>
    
    {parsedAttendees.length === 0 ? (
      <View style={styles.emptyState}>
        <UserPlus size={48} color={`${theme.colors.textTertiary}80`} weight="thin" />
        <Text style={[styles.emptyStateText, { color: theme.colors.textTertiary }]}>
          No attendees added yet. Click "Add Attendee" to get started.
        </Text>
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  tabContent: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  manualEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 6,
    backgroundColor: '#f9f9f9',
  },
  emptyStateText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: '#777',
  },
});

export default ManualEntryTab;
