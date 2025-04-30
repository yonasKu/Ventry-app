import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, PencilSimple, Trash, UserPlus, QrCode, CheckCircle } from 'phosphor-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useEvents } from '../../context/EventContext';

export default function EventDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEventById, deleteEvent } = useEvents();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const eventData = await getEventById(id);
      setEvent(eventData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
      console.error('Error loading event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(id);
              router.back();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete event');
              console.error('Error deleting event:', err);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    // Format: HH:MM:SS
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Event Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Event Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error || 'Event not found'}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={loadEvent}
          >
            <Text style={[styles.retryButtonText, { color: 'white' }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Event Details</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push(`/event/edit/${id}`)}
        >
          <PencilSimple size={20} color={theme.colors.primary} weight="regular" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={[styles.eventHeader, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.eventStats}>
            <Text style={styles.eventStatText}>
              {event.attendees_count || 0} attendees • {event.checked_in_count || 0} checked in
            </Text>
          </View>
        </View>

        <View style={[styles.detailsCard, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.sm]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Date</Text>
            <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
              {formatDate(event.date)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Time</Text>
            <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
              {formatTime(event.time)}
            </Text>
          </View>
          
          {event.location && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Location</Text>
              <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                {event.location}
              </Text>
            </View>
          )}
          
          {event.expected_attendees && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Expected Attendees</Text>
              <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                {event.expected_attendees}
              </Text>
            </View>
          )}
          
          {event.notes && (
            <View style={styles.notesRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Notes</Text>
              <Text style={[styles.notesText, { color: theme.colors.textPrimary }]}>
                {event.notes}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push(`/event/check-in/${id}`)}
          >
            <CheckCircle size={20} color="white" weight="fill" style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>Check-In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.backgroundPrimary }]}
            onPress={() => router.push(`/event/attendees/${id}`)}
          >
            <UserPlus size={20} color={theme.colors.primary} weight="regular" style={styles.actionIcon} />
            <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Manage Attendees</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.backgroundPrimary }]}
            onPress={() => router.push(`/event/qr/${id}`)}
          >
            <QrCode size={20} color={theme.colors.primary} weight="regular" style={styles.actionIcon} />
            <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>QR Code</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.deleteButton, { borderColor: theme.colors.error }]}
          onPress={handleDeleteEvent}
        >
          <Trash size={20} color={theme.colors.error} weight="regular" style={styles.deleteIcon} />
          <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>Delete Event</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  editButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  eventHeader: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  eventStats: {
    flexDirection: 'row',
  },
  eventStatText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  detailsCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  notesRow: {
    marginBottom: 16,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 22,
  },
  actionButtonsContainer: {
    margin: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  actionIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 40,
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
