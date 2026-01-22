import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, StatusBar, Vibration } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { CaretLeft, CheckCircle, XCircle, Warning } from 'phosphor-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useEvents } from '../../../context/EventContext';

export default function ScanQRScreen() {
  const theme = useTheme();
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const { getEventById, checkInAttendee } = useEvents();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [scanning, setScanning] = useState(true);
  const [lastScanResult, setLastScanResult] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    attendeeName?: string;
  } | null>(null);

  useEffect(() => {
    loadEvent();
  }, []);

  const loadEvent = async () => {
    if (!eventId) return;
    
    try {
      const eventData = await getEventById(eventId);
      if (eventData) {
        setEvent(eventData);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Error', 'Failed to load event details');
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || !scanning) return;
    
    setScanned(true);
    Vibration.vibrate(100);
    
    try {
      // Parse QR code data
      // Expected format: ventry://checkin/{eventId}/{attendeeId}
      // or JSON: {"eventId": "...", "attendeeId": "..."}
      
      let scannedEventId: string | null = null;
      let attendeeId: string | null = null;
      
      // Try to parse as URL
      if (data.startsWith('ventry://checkin/')) {
        const parts = data.replace('ventry://checkin/', '').split('/');
        scannedEventId = parts[0];
        attendeeId = parts[1];
      } 
      // Try to parse as JSON
      else {
        try {
          const parsed = JSON.parse(data);
          scannedEventId = parsed.eventId;
          attendeeId = parsed.attendeeId;
        } catch (e) {
          // Not JSON, might be just attendee ID
          attendeeId = data;
        }
      }

      // Validate event ID matches
      if (scannedEventId && scannedEventId !== eventId) {
        setLastScanResult({
          type: 'error',
          message: 'QR code is for a different event',
        });
        setTimeout(() => {
          setScanned(false);
          setLastScanResult(null);
        }, 2000);
        return;
      }

      // Find attendee in event
      const attendee = event?.attendees?.find((a: any) => a.id === attendeeId);
      
      if (!attendee) {
        setLastScanResult({
          type: 'error',
          message: 'Attendee not found in this event',
        });
        setTimeout(() => {
          setScanned(false);
          setLastScanResult(null);
        }, 2000);
        return;
      }

      // Check if already checked in
      if (attendee.checked_in) {
        setLastScanResult({
          type: 'warning',
          message: `${attendee.name} is already checked in`,
          attendeeName: attendee.name,
        });
        setTimeout(() => {
          setScanned(false);
          setLastScanResult(null);
        }, 2000);
        return;
      }

      // Perform check-in
      if (!eventId || !attendeeId) return;
      const success = await checkInAttendee(attendeeId, eventId);
      
      if (success) {
        setLastScanResult({
          type: 'success',
          message: 'Check-in successful!',
          attendeeName: attendee.name,
        });
        
        // Reload event to update counts
        await loadEvent();
        
        // Reset after 1.5 seconds to allow continuous scanning
        setTimeout(() => {
          setScanned(false);
          setLastScanResult(null);
        }, 1500);
      } else {
        setLastScanResult({
          type: 'error',
          message: 'Check-in failed. Please try again.',
        });
        setTimeout(() => {
          setScanned(false);
          setLastScanResult(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setLastScanResult({
        type: 'error',
        message: 'Failed to process QR code',
      });
      setTimeout(() => {
        setScanned(false);
        setLastScanResult(null);
      }, 2000);
    }
  };

  const toggleScanning = () => {
    setScanning(!scanning);
    setLastScanResult(null);
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <CaretLeft size={24} color="white" weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: 'white' }]}>QR Scanner</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={[styles.messageText, { color: theme.colors.textPrimary }]}>
            Requesting camera permission...
          </Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <CaretLeft size={24} color="white" weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: 'white' }]}>QR Scanner</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <XCircle size={64} color={theme.colors.error} weight="fill" />
          <Text style={[styles.messageText, { color: theme.colors.textPrimary, marginTop: 16 }]}>
            Camera permission denied
          </Text>
          <Text style={[styles.subMessageText, { color: theme.colors.textSecondary, marginTop: 8 }]}>
            Please enable camera access in your device settings to scan QR codes.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary, marginTop: 24 }]}
            onPress={requestPermission}
          >
            <Text style={styles.buttonText}>Request Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <CaretLeft size={24} color="white" weight="regular" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: 'white' }]}>Scan QR Code</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Event Info */}
      {event && (
        <View style={[styles.eventInfo, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <Text style={[styles.eventName, { color: theme.colors.textPrimary }]}>
            {event.title}
          </Text>
          <Text style={[styles.eventStats, { color: theme.colors.textSecondary }]}>
            Checked in: {event.checked_in_count || 0} / {event.attendees_count || 0}
          </Text>
        </View>
      )}

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          {/* Scanning Frame */}
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft, { borderColor: scanning ? theme.colors.primary : theme.colors.textTertiary }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: scanning ? theme.colors.primary : theme.colors.textTertiary }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: scanning ? theme.colors.primary : theme.colors.textTertiary }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: scanning ? theme.colors.primary : theme.colors.textTertiary }]} />
          </View>

          {/* Scan Result Overlay */}
          {lastScanResult && (
            <View style={[
              styles.resultOverlay,
              {
                backgroundColor: lastScanResult.type === 'success' 
                  ? theme.colors.success + 'E6'
                  : lastScanResult.type === 'warning'
                  ? theme.colors.accent + 'E6'
                  : theme.colors.error + 'E6'
              }
            ]}>
              {lastScanResult.type === 'success' && (
                <CheckCircle size={64} color="white" weight="fill" />
              )}
              {lastScanResult.type === 'warning' && (
                <Warning size={64} color="white" weight="fill" />
              )}
              {lastScanResult.type === 'error' && (
                <XCircle size={64} color="white" weight="fill" />
              )}
              
              {lastScanResult.attendeeName && (
                <Text style={styles.resultName}>{lastScanResult.attendeeName}</Text>
              )}
              <Text style={styles.resultMessage}>{lastScanResult.message}</Text>
            </View>
          )}
        </CameraView>
      </View>

      {/* Instructions */}
      <View style={[styles.instructions, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <Text style={[styles.instructionText, { color: theme.colors.textPrimary }]}>
          {scanning ? 'Position QR code within the frame' : 'Scanning paused'}
        </Text>
        
        <TouchableOpacity
          style={[styles.toggleButton, { 
            backgroundColor: scanning ? theme.colors.error : theme.colors.success 
          }]}
          onPress={toggleScanning}
        >
          <Text style={styles.toggleButtonText}>
            {scanning ? 'Pause Scanning' : 'Resume Scanning'}
          </Text>
        </TouchableOpacity>
      </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  subMessageText: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 300,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  eventInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventStats: {
    fontSize: 14,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  scanFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderWidth: 4,
  },
  topLeft: {
    top: '25%',
    left: '15%',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: '25%',
    right: '15%',
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: '25%',
    left: '15%',
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: '25%',
    right: '15%',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  resultMessage: {
    color: 'white',
    fontSize: 18,
    marginTop: 8,
    textAlign: 'center',
  },
  instructions: {
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  toggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
