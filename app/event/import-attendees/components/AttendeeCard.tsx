import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Trash } from 'phosphor-react-native';

type AttendeeCardProps = {
  attendee: {
    name: string;
    email?: string;
    phone?: string;
    isValid: boolean;
    errorMessage?: string;
  };
  index: number;
  theme: any;
  handleUpdateAttendee: (index: number, field: string, value: string) => void;
  handleRemoveAttendee: (index: number) => void;
};

const AttendeeCard = ({ 
  attendee, 
  index, 
  theme, 
  handleUpdateAttendee, 
  handleRemoveAttendee 
}: AttendeeCardProps) => (
  <View 
    style={[
      styles.attendeeCard,
      { 
        backgroundColor: theme.colors.cardBackground,
        borderLeftColor: attendee.isValid ? theme.colors.success : theme.colors.error 
      },
      theme.shadows.sm
    ]}
  >
    <View style={styles.attendeeCardContent}>
      <View style={styles.attendeeFormRow}>
        <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>Name*</Text>
        <TextInput
          style={[
            styles.formInput,
            { 
              color: theme.colors.textPrimary,
              backgroundColor: theme.colors.inputBackground,
              borderColor: theme.colors.border
            }
          ]}
          placeholder="Full Name"
          placeholderTextColor={theme.colors.textTertiary}
          value={attendee.name}
          onChangeText={(text) => {
            handleUpdateAttendee(index, 'name', text);
            handleUpdateAttendee(index, 'isValid', text.trim() ? 'true' : 'false');
            handleUpdateAttendee(index, 'errorMessage', text.trim() ? '' : 'Name is required');
          }}
        />
      </View>
      
      <View style={styles.attendeeFormRow}>
        <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>Email</Text>
        <TextInput
          style={[
            styles.formInput,
            { 
              color: theme.colors.textPrimary,
              backgroundColor: theme.colors.inputBackground,
              borderColor: theme.colors.border
            }
          ]}
          placeholder="Email Address"
          placeholderTextColor={theme.colors.textTertiary}
          value={attendee.email}
          onChangeText={(text) => handleUpdateAttendee(index, 'email', text)}
          keyboardType="email-address"
        />
      </View>
      
      <View style={styles.attendeeFormRow}>
        <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>Phone</Text>
        <TextInput
          style={[
            styles.formInput,
            { 
              color: theme.colors.textPrimary,
              backgroundColor: theme.colors.inputBackground,
              borderColor: theme.colors.border
            }
          ]}
          placeholder="Phone Number"
          placeholderTextColor={theme.colors.textTertiary}
          value={attendee.phone}
          onChangeText={(text) => handleUpdateAttendee(index, 'phone', text)}
          keyboardType="phone-pad"
        />
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleRemoveAttendee(index)}
      >
        <Trash size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
    
    {!attendee.isValid && attendee.errorMessage && (
      <Text style={[styles.errorText, { color: theme.colors.error }]}>
        {attendee.errorMessage}
      </Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  attendeeCard: {
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  attendeeCardContent: {
    padding: 16,
  },
  attendeeFormRow: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  formInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});

export default AttendeeCard;
