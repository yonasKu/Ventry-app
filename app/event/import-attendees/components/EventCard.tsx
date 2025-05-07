import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Users } from 'phosphor-react-native';

type EventCardProps = {
  event: any;
  theme: any;
};

const EventCard = ({ event, theme }: EventCardProps) => (
  <View style={[styles.eventCard, { backgroundColor: theme.colors.cardBackground }, theme.shadows.md]}>
    <View style={styles.eventCardHeader}>
      <Users size={20} color={theme.colors.primary} weight="duotone" />
      <Text style={[styles.eventCardHeaderText, { color: theme.colors.textSecondary }]}>EVENT</Text>
    </View>
    <Text style={[styles.eventTitle, { color: theme.colors.textPrimary }]}>
      {event?.title || 'Event'}
    </Text>
    <Text style={[styles.eventDate, { color: theme.colors.textSecondary }]}>
      {event?.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  eventCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventCardHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 16,
  },
});

export default EventCard;
