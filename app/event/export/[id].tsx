import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, FileArrowDown, Users, CalendarCheck } from 'phosphor-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { DatabaseService, Event } from '../../../services/DatabaseService';
import CsvService from '../../../services/CsvService';

export default function ExportScreen() {
  const theme = useTheme();
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const db = new DatabaseService();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = () => {
    if (!eventId) {
      Alert.alert('Error', 'Event ID is missing.');
      setIsLoading(false);
      router.back();
      return;
    }
    try {
      const eventData = db.getEventById(eventId);
      if (eventData) {
        setEvent(eventData);
      } else {
        Alert.alert('Error', 'Event not found.');
        router.back();
      }
    } catch (err) {
      console.error('Error loading event:', err);
      Alert.alert('Error', 'Failed to load event data.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAttendees = async (includeCheckInStatus: boolean = true) => {
    if (!event) return;
    
    try {
      setIsExporting(true);
      
      // Get attendees for this event
      const attendees = db.getAttendees(eventId);
      
      if (attendees.length === 0) {
        Alert.alert('No Attendees', 'There are no attendees to export for this event.');
        setIsExporting(false);
        return;
      }
      
      // Export to CSV
      const filePath = await CsvService.exportAttendeesToCsv(attendees, event, includeCheckInStatus);
      
      // Share the file
      await CsvService.shareCsvFile(filePath, `Export ${attendees.length} Attendees`);
      
    } catch (error: any) {
      console.error('Error exporting attendees:', error);
      Alert.alert('Export Error', `Failed to export attendees: ${error.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportEvent = async () => {
    if (!event) return;
    
    try {
      setIsExporting(true);
      
      // Export event to CSV
      const filePath = await CsvService.exportEventToCsv(event);
      
      // Share the file
      await CsvService.shareCsvFile(filePath, 'Export Event Details');
      
    } catch (error: any) {
      console.error('Error exporting event:', error);
      Alert.alert('Export Error', `Failed to export event: ${error.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={() => router.back()}
          >
            <CaretLeft size={20} color={theme.colors.textPrimary} weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Export Data</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>Loading event...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.backgroundSecondary }]}
          onPress={() => router.back()}
        >
          <CaretLeft size={20} color={theme.colors.textPrimary} weight="regular" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Export Data</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView style={styles.contentScroll}>
        {/* Event Info Card */}
        {event && (
          <View style={[styles.eventInfoCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
            <Text style={[styles.eventName, { color: theme.colors.textPrimary }]}>{event.title}</Text>
            <View style={styles.eventMetaContainer}>
              <View style={styles.eventMetaItem}>
                <CalendarCheck size={16} color={theme.colors.textSecondary} style={styles.eventMetaIcon} />
                <Text style={[styles.eventMetaText, { color: theme.colors.textSecondary }]}>
                  {event.date} at {event.time}
                </Text>
              </View>
              <View style={styles.eventMetaItem}>
                <Users size={16} color={theme.colors.textSecondary} style={styles.eventMetaIcon} />
                <Text style={[styles.eventMetaText, { color: theme.colors.textSecondary }]}>
                  {event.attendees_count || 0} attendees, {event.checked_in_count || 0} checked in
                </Text>
              </View>
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Export Options</Text>

        {/* Export Attendees Card */}
        <View style={[styles.exportCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <View style={styles.exportCardHeader}>
            <Users size={20} color={theme.colors.primary} />
            <Text style={[styles.exportCardTitle, { color: theme.colors.textPrimary }]}>
              Attendees
            </Text>
          </View>
          <Text style={[styles.exportCardDescription, { color: theme.colors.textSecondary }]}>
            Export all attendees for this event to a CSV file. You can include or exclude check-in status.
          </Text>
          <View style={styles.exportButtonsContainer}>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleExportAttendees(true)}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FileArrowDown size={18} color="#fff" weight="regular" />
                  <Text style={styles.exportButtonText}>With Check-in Status</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}
              onPress={() => handleExportAttendees(false)}
              disabled={isExporting}
            >
              <FileArrowDown size={18} color={theme.colors.primary} weight="regular" />
              <Text style={[styles.exportButtonText, { color: theme.colors.primary }]}>Basic Info Only</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Export Event Card */}
        <View style={[styles.exportCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <View style={styles.exportCardHeader}>
            <CalendarCheck size={20} color={theme.colors.primary} />
            <Text style={[styles.exportCardTitle, { color: theme.colors.textPrimary }]}>
              Event Details
            </Text>
          </View>
          <Text style={[styles.exportCardDescription, { color: theme.colors.textSecondary }]}>
            Export this event's details to a CSV file, including date, time, location, and attendance statistics.
          </Text>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleExportEvent}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <FileArrowDown size={18} color="#fff" weight="regular" />
                <Text style={styles.exportButtonText}>Export Event Details</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? (StatusBar.currentHeight || 0) + 10 : (StatusBar.currentHeight || 0) + 15,
    paddingBottom: 15,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  contentScroll: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  eventInfoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  eventName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventMetaContainer: {
    marginTop: 4,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  eventMetaIcon: {
    marginRight: 6,
  },
  eventMetaText: {
    fontSize: 14,
  },
  exportCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  exportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exportCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  exportCardDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  exportButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
});
