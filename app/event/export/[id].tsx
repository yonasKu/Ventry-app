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
  Switch,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, FileArrowDown, Users, CalendarCheck, Lock, FileJs, FileCode, FilePdf } from 'phosphor-react-native';
import * as FileSystem from 'expo-file-system';
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
  const [selectedFormatIndex, setSelectedFormatIndex] = useState(0);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const exportFormats = ['CSV', 'JSON', 'Excel', 'PDF'];
  const exportIcons = [FileArrowDown, FileCode, FileJs, FilePdf];

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
      
      // Get selected format
      const selectedFormat = exportFormats[selectedFormatIndex];
      let filePath = '';
      
      // Export based on selected format
      switch (selectedFormat) {
        case 'CSV':
          filePath = await CsvService.exportAttendeesToCsv(attendees, event, includeCheckInStatus);
          break;
          
        case 'JSON':
          // Convert to JSON
          const jsonData = JSON.stringify(attendees.map(attendee => {
            const attendeeData: Record<string, any> = {
              name: attendee.name,
              email: attendee.email || '',
              phone: attendee.phone || ''
            };
            
            if (includeCheckInStatus) {
              attendeeData.checked_in = attendee.checked_in;
              attendeeData.check_in_time = attendee.check_in_time || '';
            }
            
            return attendeeData;
          }), null, 2);
          
          // Create filename
          const sanitizedEventName = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `${sanitizedEventName}_attendees_${timestamp}.json`;
          
          // Save to file
          filePath = `${FileSystem.documentDirectory}${filename}`;
          await FileSystem.writeAsStringAsync(filePath, jsonData, {
            encoding: FileSystem.EncodingType.UTF8
          });
          break;
          
        case 'Excel':
        case 'PDF':
          // For now, we'll use CSV as a fallback and inform the user
          Alert.alert('Feature Coming Soon', `${selectedFormat} export will be available in the next update. Using CSV format for now.`);
          filePath = await CsvService.exportAttendeesToCsv(attendees, event, includeCheckInStatus);
          break;
          
        default:
          filePath = await CsvService.exportAttendeesToCsv(attendees, event, includeCheckInStatus);
      }
      
      // If password protection is enabled, add a simple header (in a real app, use proper encryption)
      if (isPasswordProtected && password.trim()) {
        const fileContent = await FileSystem.readAsStringAsync(filePath);
        const protectedContent = `PROTECTED:${password}\n${fileContent}`;
        await FileSystem.writeAsStringAsync(filePath, protectedContent);
      }
      
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
      
      // Get selected format
      const selectedFormat = exportFormats[selectedFormatIndex];
      let filePath = '';
      
      // Export based on selected format
      switch (selectedFormat) {
        case 'CSV':
          filePath = await CsvService.exportEventToCsv(event);
          break;
          
        case 'JSON':
          // Convert to JSON
          const jsonData = JSON.stringify({
            id: event.id,
            title: event.title,
            date: event.date,
            time: event.time,
            location: event.location || '',
            notes: event.notes || '',
            expected_attendees: event.expected_attendees || '',
            attendees_count: event.attendees_count || 0,
            checked_in_count: event.checked_in_count || 0,
            created_at: event.created_at,
            updated_at: event.updated_at
          }, null, 2);
          
          // Create filename
          const sanitizedEventName = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `${sanitizedEventName}_details_${timestamp}.json`;
          
          // Save to file
          filePath = `${FileSystem.documentDirectory}${filename}`;
          await FileSystem.writeAsStringAsync(filePath, jsonData, {
            encoding: FileSystem.EncodingType.UTF8
          });
          break;
          
        case 'Excel':
        case 'PDF':
          // For now, we'll use CSV as a fallback and inform the user
          Alert.alert('Feature Coming Soon', `${selectedFormat} export will be available in the next update. Using CSV format for now.`);
          filePath = await CsvService.exportEventToCsv(event);
          break;
          
        default:
          filePath = await CsvService.exportEventToCsv(event);
      }
      
      // If password protection is enabled, add a simple header (in a real app, use proper encryption)
      if (isPasswordProtected && password.trim()) {
        const fileContent = await FileSystem.readAsStringAsync(filePath);
        const protectedContent = `PROTECTED:${password}\n${fileContent}`;
        await FileSystem.writeAsStringAsync(filePath, protectedContent);
      }
      
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

        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Export Format</Text>
        
        {/* Format Selector */}
        <View style={[styles.formatCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <View style={styles.formatSelectorContainer}>
            {exportFormats.map((format, index) => {
              const FormatIcon = exportIcons[index];
              const isSelected = selectedFormatIndex === index;
              return (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.formatButton,
                    isSelected ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.backgroundSecondary }
                  ]}
                  onPress={() => setSelectedFormatIndex(index)}
                >
                  <FormatIcon 
                    size={20} 
                    color={isSelected ? '#fff' : theme.colors.textSecondary} 
                  />
                  <Text 
                    style={[
                      styles.formatButtonText, 
                      isSelected ? { color: '#fff' } : { color: theme.colors.textSecondary }
                    ]}
                  >
                    {format}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Security Options */}
          <View style={styles.securityOptionsContainer}>
            <View style={styles.securityToggleRow}>
              <Lock size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.securityLabel, { color: theme.colors.textSecondary }]}>
                Password protect this export
              </Text>
              <Switch 
                value={isPasswordProtected} 
                onValueChange={setIsPasswordProtected}
                trackColor={{ false: theme.colors.backgroundSecondary, true: theme.colors.primary }}
              />
            </View>
            
            {isPasswordProtected && (
              <TextInput
                style={[styles.passwordInput, { 
                  backgroundColor: theme.colors.backgroundSecondary,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border
                }]}
                placeholder="Enter password"
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            )}
          </View>
        </View>

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
            Export all attendees for this event. You can include or exclude check-in status.
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
                  {exportIcons[selectedFormatIndex]({ size: 18, color: '#fff', weight: 'regular' })}
                  <Text style={styles.exportButtonText}>With Check-in Status</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}
              onPress={() => handleExportAttendees(false)}
              disabled={isExporting}
            >
              {exportIcons[selectedFormatIndex]({ size: 18, color: theme.colors.primary, weight: 'regular' })}
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
            Export this event's details, including date, time, location, and attendance statistics.
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
                {exportIcons[selectedFormatIndex]({ size: 18, color: '#fff', weight: 'regular' })}
                <Text style={styles.exportButtonText}>Export Event Details</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Statistics Card */}
        <View style={[styles.exportCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <View style={styles.exportCardHeader}>
            <CalendarCheck size={20} color={theme.colors.primary} />
            <Text style={[styles.exportCardTitle, { color: theme.colors.textPrimary }]}>
              Export Statistics
            </Text>
          </View>
          <Text style={[styles.exportCardDescription, { color: theme.colors.textSecondary }]}>
            Coming soon: Export detailed event statistics and visualizations.
          </Text>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}
            disabled={true}
          >
            <FilePdf size={18} color={theme.colors.textSecondary} weight="regular" />
            <Text style={[styles.exportButtonText, { color: theme.colors.textSecondary }]}>Coming Soon</Text>
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
  // Format selector styles
  formatCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  formatSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formatButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  formatButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  // Security options styles
  securityOptionsContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 16,
  },
  securityToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  securityLabel: {
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
  passwordInput: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
});

