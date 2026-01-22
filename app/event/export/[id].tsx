import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, FileArrowDown, FileCsv, Users, CheckSquare } from 'phosphor-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useEvents } from '../../../context/EventContext';
import { ExportService } from '../../../services/ExportService';

export default function ExportScreen() {
  const theme = useTheme();
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const { getEventById } = useEvents();
  
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<string | null>(null);
  
  const exportService = new ExportService();

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    if (!eventId) return;
    
    setIsLoading(true);
    try {
      const eventData = await getEventById(eventId);
      if (eventData) {
        setEvent(eventData);
      } else {
        Alert.alert('Error', 'Event not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (type: 'attendees' | 'checkin-report') => {
    if (!event || !eventId) return;
    
    setIsExporting(true);
    setExportType(type);
    
    try {
      if (type === 'attendees') {
        await exportService.exportAndShareEventAttendees(eventId, event.title);
        Alert.alert('Success', 'Attendee list exported successfully!');
      } else if (type === 'checkin-report') {
        await exportService.exportAndShareCheckInReport(eventId, event.title);
        Alert.alert('Success', 'Check-in report exported successfully!');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      Alert.alert('Export Failed', 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <CaretLeft size={24} color="white" weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: 'white' }]}>Export Data</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>
            Loading event...
          </Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return null;
  }

  const totalAttendees = event.attendees_count || 0;
  const checkedInCount = event.checked_in_count || 0;
  const checkInRate = totalAttendees > 0 
    ? ((checkedInCount / totalAttendees) * 100).toFixed(1)
    : '0';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <CaretLeft size={24} color="white" weight="regular" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: 'white' }]}>Export Data</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Info Card */}
        <View style={[styles.eventCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <Text style={[styles.eventName, { color: theme.colors.textPrimary }]}>
            {event.title}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Users size={20} color={theme.colors.primary} weight="fill" />
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {totalAttendees}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Total
              </Text>
            </View>
            <View style={styles.statItem}>
              <CheckSquare size={20} color={theme.colors.success} weight="fill" />
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {checkedInCount}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Checked In
              </Text>
            </View>
            <View style={styles.statItem}>
              <FileArrowDown size={20} color={theme.colors.accent} weight="fill" />
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {checkInRate}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Rate
              </Text>
            </View>
          </View>
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Export Options
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Choose what data you want to export
          </Text>
        </View>

        {/* Attendee List Export */}
        <TouchableOpacity
          style={[styles.exportCard, { backgroundColor: theme.colors.backgroundPrimary }]}
          onPress={() => handleExport('attendees')}
          disabled={isExporting}
        >
          <View style={[styles.exportIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
            <Users size={32} color={theme.colors.primary} weight="fill" />
          </View>
          <View style={styles.exportInfo}>
            <Text style={[styles.exportTitle, { color: theme.colors.textPrimary }]}>
              Attendee List
            </Text>
            <Text style={[styles.exportDescription, { color: theme.colors.textSecondary }]}>
              Export complete list of all attendees with their details and check-in status
            </Text>
            <View style={styles.exportMeta}>
              <FileCsv size={16} color={theme.colors.textTertiary} weight="regular" />
              <Text style={[styles.exportFormat, { color: theme.colors.textTertiary }]}>
                CSV Format • {totalAttendees} attendees
              </Text>
            </View>
          </View>
          {isExporting && exportType === 'attendees' ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <FileArrowDown size={24} color={theme.colors.primary} weight="regular" />
          )}
        </TouchableOpacity>

        {/* Check-in Report Export */}
        <TouchableOpacity
          style={[styles.exportCard, { backgroundColor: theme.colors.backgroundPrimary }]}
          onPress={() => handleExport('checkin-report')}
          disabled={isExporting}
        >
          <View style={[styles.exportIcon, { backgroundColor: `${theme.colors.success}15` }]}>
            <CheckSquare size={32} color={theme.colors.success} weight="fill" />
          </View>
          <View style={styles.exportInfo}>
            <Text style={[styles.exportTitle, { color: theme.colors.textPrimary }]}>
              Check-in Report
            </Text>
            <Text style={[styles.exportDescription, { color: theme.colors.textSecondary }]}>
              Export summary report with check-in statistics and detailed check-in list
            </Text>
            <View style={styles.exportMeta}>
              <FileCsv size={16} color={theme.colors.textTertiary} weight="regular" />
              <Text style={[styles.exportFormat, { color: theme.colors.textTertiary }]}>
                CSV Format • {checkedInCount} checked in
              </Text>
            </View>
          </View>
          {isExporting && exportType === 'checkin-report' ? (
            <ActivityIndicator size="small" color={theme.colors.success} />
          ) : (
            <FileArrowDown size={24} color={theme.colors.success} weight="regular" />
          )}
        </TouchableOpacity>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: `${theme.colors.primary}10` }]}>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            💡 Exported files will be saved to your device and can be shared via email, messaging apps, or cloud storage.
          </Text>
        </View>
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
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  eventCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
  },
  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  exportIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  exportInfo: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exportDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  exportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportFormat: {
    fontSize: 12,
    marginLeft: 6,
  },
  infoBox: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
