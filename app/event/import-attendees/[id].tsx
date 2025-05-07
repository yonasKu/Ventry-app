import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, Users, MagnifyingGlass, QrCode, X, ClipboardText, UserPlus, Upload } from 'phosphor-react-native';
import { useTheme } from '../../../context/ThemeContext';
import * as Clipboard from 'expo-clipboard';
import Papa from 'papaparse';
import { BlurView } from 'expo-blur';
import { DatabaseService } from '../../../services/DatabaseService';
import * as _ from 'lodash';
import AttendeeQRCode from '../../../components/AttendeeQRCode';

// Import components from the components subfolder
import EventCard from './components/EventCard';
import TabSelector from './components/TabSelector';
import PasteTab from './components/PasteTab';
import ManualEntryTab from './components/ManualEntryTab';
import AttendeePreview from './components/AttendeePreview';
import ImportButton from './components/ImportButton';
import AttendeeCard from './components/AttendeeCard';

export type ImportAttendee = {
  id?: string; // Optional, if you plan to edit existing ones, but for import, usually new
  name: string;
  email?: string;
  phone?: string;
  isValid: boolean;
  errorMessage?: string;
};

export default function ImportAttendeesScreen() {
  const theme = useTheme();
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const db = useRef(new DatabaseService()).current;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const [event, setEvent] = useState<Event | null>(null);
  const [importText, setImportText] = useState('');
  const [parsedAttendees, setParsedAttendees] = useState<ImportAttendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importFormat, setImportFormat] = useState<'csv' | 'simple'>('simple');
  const [activeTab, setActiveTab] = useState<'paste' | 'manual'>('paste');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttendee, setSelectedAttendee] = useState<ImportAttendee | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  // Filter attendees based on search query using Lodash
  // IMPORTANT: Keep this hook at the top level, before any conditional returns
  const filteredAttendees = useMemo(() => {
    if (!searchQuery.trim()) {
      return parsedAttendees;
    }
    
    const normalizedQuery = _.deburr(_.toLower(searchQuery.trim()));
    
    return _.filter(parsedAttendees, (attendee) => {
      const nameMatch = attendee.name ? 
        _.includes(_.deburr(_.toLower(attendee.name)), normalizedQuery) : false;
      
      const emailMatch = attendee.email ? 
        _.includes(_.toLower(attendee.email), normalizedQuery) : false;
        
      const phoneMatch = attendee.phone ? 
        _.includes(attendee.phone, normalizedQuery) : false;
      
      return nameMatch || emailMatch || phoneMatch;
    });
  }, [parsedAttendees, searchQuery]);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [isLoading]);

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
      Alert.alert('Error', 'Failed to load event details.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const parseAttendees = () => {
    if (!importText.trim()) {
      setParsedAttendees([]);
      return;
    }

    let attendees: ImportAttendee[] = [];

    if (importFormat === 'csv') {
      try {
        const results = Papa.parse(importText.trim(), { header: true, skipEmptyLines: true });
        if (results.errors.length > 0) {
            console.error('CSV parsing errors:', results.errors);
            Alert.alert('CSV Parsing Error', `Problem with CSV data: ${results.errors[0].message}. Please check row ${results.errors[0].row}.`);
        }
        if (results.data && Array.isArray(results.data)) {
          attendees = results.data.map((row: any) => {
            const name = row.name || row.Name || '';
            const email = row.email || row.Email || '';
            const phone = row.phone || row.Phone || '';
            const isValid = !!name.trim();
            return {
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
              isValid,
              errorMessage: !isValid ? 'Name is required' : undefined,
            };
          });
        }
      } catch (error) {
        console.error('CSV parsing exception:', error);
        Alert.alert('Error', 'Failed to parse CSV data. Ensure it is valid CSV.');
      }
    } else { // Simple format
      attendees = importText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          const parts = line.split(',').map(part => part.trim());
          const name = parts[0] || '';
          const email = parts[1] || '';
          const phone = parts[2] || '';
          const isValid = !!name;
          return {
            name,
            email,
            phone,
            isValid,
            errorMessage: !isValid ? 'Name is required' : undefined,
          };
        });
    }
    setParsedAttendees(attendees);
    if (attendees.length === 0 && importText.trim().length > 0) {
        Alert.alert('No Attendees Parsed', 'Could not find any attendee data in the provided text. Please check the format.');
    }
  };

  const handleImportFormat = (format: 'csv' | 'simple') => {
    setImportFormat(format);
    setImportText(''); // Clear text when format changes
    setParsedAttendees([]);
  };

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      setImportText(text);
    } catch (error) {
      console.error('Error pasting from clipboard:', error);
      Alert.alert('Paste Error', 'Could not paste text from clipboard.');
    }
  };

  const handleAddAttendee = () => {
    setParsedAttendees(prev => [
      ...prev,
      { name: '', email: '', phone: '', isValid: false, errorMessage: 'Name is required' },
    ]);
    // If not already on manual, switch to it to see the new entry
    if(activeTab !== 'manual') setActiveTab('manual');
  };

  const handleRemoveAttendee = (index: number) => {
    setParsedAttendees(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAttendee = (index: number, field: keyof Omit<ImportAttendee, 'id' | 'isValid' | 'errorMessage'>, value: string) => {
    setParsedAttendees(prev =>
      prev.map((att, i) => {
        if (i === index) {
          const updatedAtt = { ...att, [field]: value };
          updatedAtt.isValid = !!updatedAtt.name.trim();
          updatedAtt.errorMessage = !updatedAtt.isValid ? 'Name is required' : undefined;
          return updatedAtt;
        }
        return att;
      })
    );
  };

  const handleImport = () => {
    if (!eventId) {
      Alert.alert('Error', 'Event ID is missing.');
      return;
    }
    const validAttendees = parsedAttendees.filter(a => a.isValid);
    if (validAttendees.length === 0) {
      Alert.alert('No Valid Attendees', 'There are no valid attendees to import. Please check your entries.');
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    const errors: string[] = [];

    try {
      for (const attendee of validAttendees) {
        // Type assertion for attendee data being passed to db.addAttendee
        const attendeeData: Omit<Attendee, 'id' | 'eventId' | 'isCheckedIn' | 'checkInTime'> = {
            name: attendee.name,
            email: attendee.email,
            phone: attendee.phone,
        };
        db.addAttendee(eventId, attendeeData);
        successCount++;
      }

      Alert.alert(
        'Import Successful',
        `Successfully imported ${successCount} attendees.`,
        [
          { text: 'View Attendees', onPress: () => router.replace(`/event/attendees/${eventId}`) },
          { text: 'Import More', onPress: () => {
              setImportText('');
              setParsedAttendees([]);
              // Potentially reset activeTab to 'paste' or keep as is
          }},
        ]
      );
      setImportText('');
      setParsedAttendees([]);

    } catch (error: any) {
      console.error('Error importing attendees:', error);
      Alert.alert('Import Error', `An error occurred during import after ${successCount} successful imports: ${error.message || 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>Loading event...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
         <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
        <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>Event not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.simpleButton}>
            <Text style={{color: theme.colors.primary}}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // filteredAttendees is defined at the top of the component

  return (
    <KeyboardAvoidingView
      style={[styles.screenContainer, { backgroundColor: theme.colors.backgroundSecondary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? (StatusBar.currentHeight || 0) + 44 : 0} // Adjust for header
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <CaretLeft size={24} color="white" weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: 'white' }]}>Import Attendees</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.contentScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Event Info Card */}
          <View style={[styles.eventInfoCard, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.sm]}>
            <Text style={[styles.eventName, { color: theme.colors.textPrimary }]}>{event.title}</Text>
            <View style={styles.eventMetaContainer}>
              <View style={styles.eventMetaItem}>
                <Users size={16} color={theme.colors.primary} weight="regular" style={styles.eventMetaIcon} />
                <Text style={[styles.eventMetaText, { color: theme.colors.textSecondary }]}>
                  {event.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'No date set'}
                </Text>
              </View>
            </View>
          </View>

          {/* Tab Selector */}
          <View style={[styles.tabContainer, { backgroundColor: theme.colors.backgroundPrimary }]}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'paste' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]]}
              onPress={() => setActiveTab('paste')}
            >
              <ClipboardText 
                size={18} 
                color={activeTab === 'paste' ? theme.colors.primary : theme.colors.textSecondary} 
                weight={activeTab === 'paste' ? "bold" : "regular"}
              />
              <Text style={[styles.tabText, { color: activeTab === 'paste' ? theme.colors.primary : theme.colors.textSecondary }]}>
                Paste Data
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'manual' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]]}
              onPress={() => setActiveTab('manual')}
            >
              <UserPlus 
                size={18} 
                color={activeTab === 'manual' ? theme.colors.primary : theme.colors.textSecondary} 
                weight={activeTab === 'manual' ? "bold" : "regular"}
              />
              <Text style={[styles.tabText, { color: activeTab === 'manual' ? theme.colors.primary : theme.colors.textSecondary }]}>
                Manual Entry
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'paste' && (
            <PasteTab
              theme={theme}
              importText={importText}
              setImportText={setImportText}
              importFormat={importFormat}
              handleImportFormat={handleImportFormat}
              handlePaste={handlePaste}
              parseAttendees={parseAttendees}
            />
          )}

          {activeTab === 'manual' && (
            <ManualEntryTab
              theme={theme}
              parsedAttendees={parsedAttendees}
              handleAddAttendee={handleAddAttendee}
            />
          )}
          
          {parsedAttendees.length > 0 && (
            <AttendeePreview
              parsedAttendees={parsedAttendees}
              theme={theme}
            />
          )}

          {/* Search Bar */}
          {parsedAttendees.length > 0 && (
            <View style={styles.searchContainer}>
              <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.sm]}>
                <MagnifyingGlass size={20} color={theme.colors.textSecondary} weight="regular" style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: theme.colors.textPrimary }]}
                  placeholder="Search by name, email or phone"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                    <X size={18} color={theme.colors.textSecondary} weight="regular" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          
          {/* Attendee Cards */}
          <View style={styles.attendeeListContainer}>
            {filteredAttendees.length === 0 && searchQuery.trim() !== '' ? (
              <View style={[styles.emptyStateContainer, { backgroundColor: theme.colors.backgroundPrimary }]}>
                <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                  No attendees match your search
                </Text>
              </View>
            ) : (
              filteredAttendees.map((attendee, index) => (
                <View key={index} style={[styles.attendeeCardWrapper, { backgroundColor: theme.colors.backgroundPrimary }]}>
                  <View style={styles.attendeeCardContainer}>
                    <View style={[styles.attendeeStatusIndicator, { backgroundColor: attendee.isValid ? theme.colors.success : theme.colors.error }]} />
                    <View style={styles.attendeeCardContent}>
                      <AttendeeCard
                        attendee={attendee}
                        index={index}
                        theme={theme}
                        handleUpdateAttendee={handleUpdateAttendee}
                        handleRemoveAttendee={handleRemoveAttendee}
                      />
                      <TouchableOpacity 
                        style={[styles.qrButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => {
                          setSelectedAttendee(attendee);
                          setQrModalVisible(true);
                        }}
                      >
                        <QrCode size={18} color="#fff" weight="regular" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </Animated.View>
      </ScrollView>
      
      {parsedAttendees.length > 0 && (
        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.importButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleImport}
            disabled={parsedAttendees.filter(a => a.isValid).length === 0 || isImporting}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Upload size={20} color="#fff" weight="bold" />
                <Text style={styles.importButtonText}>
                  Import {parsedAttendees.filter(a => a.isValid).length} Attendees
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
      
      {/* QR Code Modal */}
      <Modal
        visible={qrModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Attendee QR Code</Text>
              <TouchableOpacity onPress={() => setQrModalVisible(false)} style={styles.closeButton}>
                <X size={24} color={theme.colors.textPrimary} weight="bold" />
              </TouchableOpacity>
            </View>
            
            {selectedAttendee && eventId && (
              <View style={styles.qrContainer}>
                <AttendeeQRCode 
                  attendee={{
                    id: selectedAttendee.id || 'temp-' + Date.now(),
                    event_id: eventId,
                    name: selectedAttendee.name,
                    email: selectedAttendee.email || null,
                    phone: selectedAttendee.phone || null,
                    checked_in: false,
                    check_in_time: undefined,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }}
                  eventId={eventId}
                  size={250}
                  color={theme.colors.textPrimary}
                  backgroundColor={theme.colors.backgroundPrimary}
                />
                <Text style={[styles.qrNote, { color: theme.colors.textSecondary }]}>
                  This QR code can be used for check-in at the event.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
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
  // Event Info Card
  eventInfoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  // Tab Container
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 14,
  },
  // Search
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  // Attendee List
  attendeeListContainer: {
    marginBottom: 16,
  },
  attendeeCardWrapper: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 1,
  },
  attendeeCardContainer: {
    flexDirection: 'row',
  },
  attendeeStatusIndicator: {
    width: 4,
    height: '100%',
  },
  attendeeCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  qrButton: {
    padding: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  emptyStateContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  // Footer
  footer: {
    padding: 16,
    borderTopWidth: 1,
    backgroundColor: 'white',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  importButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 10,
  },
  qrNote: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  // Ensure your child components in './components/' have their own detailed styling.
  // Styles here are primarily for layout of the main screen.
});
