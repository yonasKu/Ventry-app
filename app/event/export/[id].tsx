import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { FileArrowDown, Users, CalendarCheck, Lock, FileJs, FileCode, FilePdf } from 'phosphor-react-native';
import { Paths, File } from 'expo-file-system';
import { useTheme } from '../../../context/ThemeContext';
import { useEvents } from '../../../context/EventContext';
import ExportService, { ExportFormat } from '../../../services/ExportService';
import PDFService from '../../../services/PDFService';
import AppHeader from '../../../components/AppHeader';

export default function ExportScreen() {
  const theme = useTheme();
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const { getEventById } = useEvents();
  const exportService = ExportService;

  const [event, setEvent] = useState<any>(null);
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

  const loadEvent = async () => {
    if (!eventId) {
      Alert.alert('Error', 'Event ID is missing.');
      setIsLoading(false);
      router.back();
      return;
    }
    try {
      const eventData = await getEventById(eventId);
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

  const handleExportAttendees = async (includeCheckInStatus: boolean = true, action: 'download' | 'share' = 'share') => {
    if (!event) return;
    
    try {
      setIsExporting(true);
      
      // Check if event has attendees
      if (!event.attendees || event.attendees.length === 0) {
        Alert.alert('No Attendees', 'There are no attendees to export for this event.');
        setIsExporting(false);
        return;
      }
      
      // Get selected format
      const selectedFormat = exportFormats[selectedFormatIndex];
      let exportFormat: ExportFormat;
      
      // Map UI format to ExportFormat enum
      switch (selectedFormat) {
        case 'CSV':
          exportFormat = ExportFormat.CSV;
          break;
        case 'JSON':
          exportFormat = ExportFormat.JSON;
          break;
        case 'Excel':
          exportFormat = ExportFormat.EXCEL;
          break;
        case 'PDF':
          exportFormat = ExportFormat.PDF;
          break;
        default:
          exportFormat = ExportFormat.CSV;
      }
      
      // Export using ExportService
      const filePath = await exportService.exportAttendees(eventId, {
        format: exportFormat,
        includeCheckInStatus,
        password: isPasswordProtected && password.trim() ? password : undefined
      });
      
      // Handle PDF differently - show download or share option
      if (exportFormat === ExportFormat.PDF) {
        if (action === 'download') {
          const savedPath = await PDFService.savePDFToDevice(filePath);
          Alert.alert(
            'PDF Saved', 
            `Attendee list PDF has been saved to your device.\n\nFile: ${savedPath.split('/').pop()}`,
            [{ text: 'OK' }]
          );
        } else {
          await PDFService.sharePDF(filePath);
        }
      } else {
        // For other formats, use the regular share
        await exportService.shareFile(filePath, `Export ${event.attendees.length} Attendees`);
      }
      
    } catch (error: any) {
      console.error('Error exporting attendees:', error);
      Alert.alert('Export Error', `Failed to export attendees: ${error.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportEvent = async (action: 'download' | 'share' = 'share') => {
    if (!event) return;
    
    try {
      setIsExporting(true);
      
      // Get selected format
      const selectedFormat = exportFormats[selectedFormatIndex];
      let exportFormat: ExportFormat;
      
      // Map UI format to ExportFormat enum
      switch (selectedFormat) {
        case 'CSV':
          exportFormat = ExportFormat.CSV;
          break;
        case 'JSON':
          exportFormat = ExportFormat.JSON;
          break;
        case 'Excel':
          exportFormat = ExportFormat.EXCEL;
          break;
        case 'PDF':
          exportFormat = ExportFormat.PDF;
          break;
        default:
          exportFormat = ExportFormat.CSV;
      }
      
      // Export using ExportService
      const filePath = await exportService.exportEvent(eventId, {
        format: exportFormat,
        password: isPasswordProtected && password.trim() ? password : undefined
      });
      
      // Handle PDF differently - show download or share option
      if (exportFormat === ExportFormat.PDF) {
        if (action === 'download') {
          const savedPath = await PDFService.savePDFToDevice(filePath);
          Alert.alert(
            'PDF Saved', 
            `Event report PDF has been saved to your device.\n\nFile: ${savedPath.split('/').pop()}`,
            [{ text: 'OK' }]
          );
        } else {
          await PDFService.sharePDF(filePath);
        }
      } else {
        // For other formats, use the regular share
        await exportService.shareFile(filePath, 'Export Event Details');
      }
      
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
        <AppHeader title="Export Data" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>Loading event...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
      <AppHeader title="Export Data" />

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
            {selectedFormatIndex === 3 ? ( // PDF format selected
              <>
                <TouchableOpacity
                  style={[styles.exportButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleExportAttendees(true, 'download')}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <FilePdf size={18} color="#fff" weight="regular" />
                      <Text style={styles.exportButtonText}>Download PDF</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.exportButton, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}
                  onPress={() => handleExportAttendees(true, 'share')}
                  disabled={isExporting}
                >
                  <FilePdf size={18} color={theme.colors.primary} weight="regular" />
                  <Text style={[styles.exportButtonText, { color: theme.colors.primary }]}>Share PDF</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
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
              </>
            )}
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
          {selectedFormatIndex === 3 ? ( // PDF format selected
            <View style={styles.exportButtonsContainer}>
              <TouchableOpacity
                style={[styles.exportButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => handleExportEvent('download')}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <FilePdf size={18} color="#fff" weight="regular" />
                    <Text style={styles.exportButtonText}>Download PDF</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exportButton, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}
                onPress={() => handleExportEvent('share')}
                disabled={isExporting}
              >
                <FilePdf size={18} color={theme.colors.primary} weight="regular" />
                <Text style={[styles.exportButtonText, { color: theme.colors.primary }]}>Share PDF</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleExportEvent()}
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
          )}
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
            Export detailed event statistics and visualizations as PDF report.
          </Text>
          <View style={styles.exportButtonsContainer}>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: theme.colors.primary }]}
              onPress={async () => {
                try {
                  setIsExporting(true);
                  const filePath = await PDFService.generateStatisticsReport('all', {
                    title: `${event?.title} - Statistics Report`,
                    subtitle: `Generated on ${new Date().toLocaleDateString()}`
                  });
                  const savedPath = await PDFService.savePDFToDevice(filePath);
                  Alert.alert(
                    'PDF Saved', 
                    `Statistics report has been saved to your device.\n\nFile: ${savedPath.split('/').pop()}`,
                    [{ text: 'OK' }]
                  );
                } catch (error: any) {
                  Alert.alert('Export Error', `Failed to export statistics: ${error.message}`);
                } finally {
                  setIsExporting(false);
                }
              }}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FilePdf size={18} color="#fff" weight="regular" />
                  <Text style={styles.exportButtonText}>Download PDF</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}
              onPress={async () => {
                try {
                  setIsExporting(true);
                  const filePath = await PDFService.generateStatisticsReport('all', {
                    title: `${event?.title} - Statistics Report`,
                    subtitle: `Generated on ${new Date().toLocaleDateString()}`
                  });
                  await PDFService.sharePDF(filePath);
                } catch (error: any) {
                  Alert.alert('Export Error', `Failed to export statistics: ${error.message}`);
                } finally {
                  setIsExporting(false);
                }
              }}
              disabled={isExporting}
            >
              <FilePdf size={18} color={theme.colors.primary} weight="regular" />
              <Text style={[styles.exportButtonText, { color: theme.colors.primary }]}>Share PDF</Text>
            </TouchableOpacity>
          </View>
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

