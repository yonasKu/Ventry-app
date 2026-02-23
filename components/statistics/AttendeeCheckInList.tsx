import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { CheckCircle, XCircle, Clock } from 'phosphor-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Attendee } from '@/models/Attendee';
import { format, parseISO } from 'date-fns';

interface AttendeeCheckInListProps {
  attendees: Attendee[];
  maxItems?: number;
}

export default function AttendeeCheckInList({ attendees, maxItems = 10 }: AttendeeCheckInListProps) {
  const theme = useTheme();
  const [showAll, setShowAll] = useState(false);

  // Sort attendees: checked-in first (by time), then unchecked
  const sortedAttendees = useMemo(() => {
    const checkedIn = attendees
      .filter(a => a.checked_in)
      .sort((a, b) => {
        if (!a.check_in_time || !b.check_in_time) return 0;
        return parseISO(b.check_in_time).getTime() - parseISO(a.check_in_time).getTime();
      });
    
    const notCheckedIn = attendees
      .filter(a => !a.checked_in)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return [...checkedIn, ...notCheckedIn];
  }, [attendees]);

  const displayedAttendees = showAll ? sortedAttendees : sortedAttendees.slice(0, maxItems);
  const hasMore = sortedAttendees.length > maxItems;

  const formatCheckInTime = (timeString: string | null) => {
    if (!timeString) return 'Not checked in';
    try {
      const date = parseISO(timeString);
      return format(date, 'h:mm a');
    } catch (error) {
      return 'Invalid time';
    }
  };

  const renderAttendee = ({ item }: { item: Attendee }) => (
    <View style={[styles.attendeeItem, { borderBottomColor: theme.colors.border }]}>
      <View style={styles.attendeeInfo}>
        <View style={styles.attendeeHeader}>
          <Text style={[styles.attendeeName, { color: theme.colors.textPrimary }]}>
            {item.name}
          </Text>
          {item.checked_in ? (
            <CheckCircle size={20} color={theme.colors.success} weight="fill" />
          ) : (
            <XCircle size={20} color={theme.colors.textTertiary} weight="regular" />
          )}
        </View>
        
        <View style={styles.attendeeDetails}>
          <Clock size={14} color={theme.colors.textSecondary} weight="regular" />
          <Text style={[styles.checkInTime, { color: theme.colors.textSecondary }]}>
            {formatCheckInTime(item.check_in_time)}
          </Text>
        </View>
        
        {item.email && (
          <Text style={[styles.attendeeEmail, { color: theme.colors.textTertiary }]}>
            {item.email}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Attendee Check-ins
        </Text>
        <View style={[styles.badge, { backgroundColor: `${theme.colors.primary}20` }]}>
          <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
            {attendees.filter(a => a.checked_in).length} / {attendees.length}
          </Text>
        </View>
      </View>

      <FlatList
        data={displayedAttendees}
        renderItem={renderAttendee}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No attendees yet
            </Text>
          </View>
        }
      />

      {hasMore && !showAll && (
        <TouchableOpacity
          style={[styles.showMoreButton, { backgroundColor: `${theme.colors.primary}10` }]}
          onPress={() => setShowAll(true)}
        >
          <Text style={[styles.showMoreText, { color: theme.colors.primary }]}>
            Show all {sortedAttendees.length} attendees
          </Text>
        </TouchableOpacity>
      )}

      {showAll && hasMore && (
        <TouchableOpacity
          style={[styles.showMoreButton, { backgroundColor: `${theme.colors.primary}10` }]}
          onPress={() => setShowAll(false)}
        >
          <Text style={[styles.showMoreText, { color: theme.colors.primary }]}>
            Show less
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  attendeeItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  attendeeName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  attendeeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkInTime: {
    fontSize: 13,
    marginLeft: 6,
  },
  attendeeEmail: {
    fontSize: 12,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  showMoreButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
