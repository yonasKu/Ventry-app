import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { useTheme } from '../../../context/ThemeContext';
import { useEvents } from '../../../context/EventContext';
import { Attendee } from '../../../services/DatabaseService';

export default function ScanScreen() {
  const theme = useTheme();
  const { id: eventIdFromParams } = useLocalSearchParams<{ id: string }>();
  const { checkInAttendee, getEventById } = useEvents();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'warning' | 'error' | null>(null);
  const [eventName, setEventName] = useState<string>('');

  // Request camera permissions on component mount
  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Load event name
  useEffect(() => {
    if (eventIdFromParams) {
      loadEventName();
    }
  }, [eventIdFromParams]);

  const loadEventName = async () => {
    try {
      const event = await getEventById(eventIdFromParams as string);
      if (event) {
        setEventName(event.title);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    }
  };

  // Handle barcode scanning
  const handleBarCodeScanned = useCallback(async ({ type, data }: BarCodeScannerResult) => {
    if (isProcessing || !eventIdFromParams) return;
    
    setScanned(true);
    setIsProcessing(true);
    
    try {
      // Parse QR code data
      const qrData = JSON.parse(data);
      console.log('Parsed QR data:', qrData);
      
      // Validate QR code format - only require attendee ID
      if (!qrData.id) {
        setFeedbackMessage('Invalid QR code format - missing attendee ID');
        setFeedbackType('error');
        setIsProcessing(false);
        return;
      }
      
      // Check if QR code has an event ID and if it's for the current event
      // If eventId is present in QR but doesn't match current event, show warning but continue
      if (qrData.eventId && qrData.eventId !== eventIdFromParams) {
        console.log(`QR event ID ${qrData.eventId} doesn't match current event ${eventIdFromParams}`);
        // We'll continue and use the current event ID instead
      }
      
      // Process check-in
      const attendeeIdFromQR = qrData.id;
      // Use the eventId from QR code or fall back to URL parameter if undefined
      const eventIdFromQR = qrData.eventId || eventIdFromParams;
      
      console.log(`Checking in attendee ID: ${attendeeIdFromQR} for event ID: ${eventIdFromQR}`);
      const result: Attendee | null = await checkInAttendee(attendeeIdFromQR, eventIdFromQR);
      
      if (result) {
        // Check if the attendee was already checked in
        if (result.check_in_time && result.check_in_time !== '') {
          setFeedbackMessage(`${result.name} was already checked in`);
          setFeedbackType('warning');
        } else {
          setFeedbackMessage(`${result.name} successfully checked in!`);
          setFeedbackType('success');
        }
      } else {
        setFeedbackMessage('Failed to check in attendee');
        setFeedbackType('error');
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setFeedbackMessage('Error processing QR code');
      setFeedbackType('error');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, eventIdFromParams, checkInAttendee]);

  // Reset scan state to scan again
  const handleScanAgain = () => {
    setScanned(false);
    setFeedbackMessage('');
    setFeedbackType(null);
  };

  // Handle permission denied
  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Scan QR Code</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.permissionContainer}>
          <Text style={[styles.permissionText, { color: theme.colors.textPrimary }]}>
            Camera permission is required to scan QR codes
          </Text>
          <TouchableOpacity 
            style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
            onPress={async () => {
              const { status } = await BarCodeScanner.requestPermissionsAsync();
              setHasPermission(status === 'granted');
            }}
          >
            <Text style={[styles.permissionButtonText, { color: theme.colors.backgroundPrimary }]}>
              Grant Permission
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Handle loading state
  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Scan QR Code</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>
            Requesting camera permission...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Camera View */}
      {!scanned && (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <CaretLeft size={24} color="#FFFFFF" weight="regular" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Scan QR Code</Text>
        <View style={styles.headerRight} />
      </View>
      
      {/* Event Info */}
      <View style={styles.eventInfoContainer}>
        <Text style={styles.eventInfoText}>
          Scanning for: {eventName}
        </Text>
      </View>
      
      {/* Scan Overlay */}
      {!scanned && (
        <View style={styles.scanOverlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanInstructions}>
            Align QR code within the frame
          </Text>
        </View>
      )}
      
      {/* Feedback Message */}
      {feedbackMessage && (
        <View style={[
          styles.feedbackContainer, 
          feedbackType === 'success' && { backgroundColor: 'rgba(46, 204, 113, 0.95)' },
          feedbackType === 'warning' && { backgroundColor: 'rgba(241, 196, 15, 0.95)' },
          feedbackType === 'error' && { backgroundColor: 'rgba(231, 76, 60, 0.95)' }
        ]}>
          <View style={styles.feedbackContent}>
            <Text style={styles.feedbackMessage}>{feedbackMessage}</Text>
            
            <TouchableOpacity 
              style={styles.scanAgainButton}
              onPress={handleScanAgain}
            >
              <Text style={styles.scanAgainText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Processing Indicator */}
      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  eventInfoContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  eventInfoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  scanInstructions: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  feedbackContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 0,
  },
  feedbackContent: {
    width: '100%',
    padding: 12,
    alignItems: 'center',
  },
  feedbackMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  scanAgainButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
  },
  scanAgainText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  processingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
});
