import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Users, CheckCircle, XCircle } from 'phosphor-react-native';

type AttendeePreviewProps = {
  parsedAttendees: {
    isValid: boolean;
  }[];
  theme: any;
};

const AttendeePreview = ({ parsedAttendees, theme }: AttendeePreviewProps) => (
  <View style={[
    styles.previewSection, 
    { backgroundColor: theme.colors.cardBackground },
    {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }
  ]}>
    <View style={styles.previewHeader}>
      <View style={styles.previewHeaderLeft}>
        <Users size={20} color={theme.colors.primary} weight="duotone" />
        <Text style={[styles.previewTitle, { color: theme.colors.textPrimary }]}>
          Attendees Preview
        </Text>
      </View>
      <View style={styles.previewStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statCount, { color: theme.colors.success }]}>
            {parsedAttendees.filter(a => a.isValid).length}
          </Text>
          <CheckCircle size={16} color={theme.colors.success} weight="fill" />
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statCount, { color: theme.colors.error }]}>
            {parsedAttendees.filter(a => !a.isValid).length}
          </Text>
          <XCircle size={16} color={theme.colors.error} weight="fill" />
        </View>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  previewSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  previewStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  statCount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
});

export default AttendeePreview;
