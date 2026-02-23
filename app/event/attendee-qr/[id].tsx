import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Share, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, ShareNetwork } from 'phosphor-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../../../context/ThemeContext';
import { useEvents } from '../../../context/EventContext';
import { Attendee } from '../../../services/DatabaseService';

export default function AttendeeQRScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getAttendeeById, getEventById } = useEvents();
  
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAttendeeAndEvent();
  }, [id]);

  const loadAttendeeAndEvent = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const attendeeData = await getAttendeeById(id);
      if (!attendeeData) {
        setError('Attendee not found');
        setIsLoading(false);
        return;
      }
      
      setAttendee(attendeeData);
      
      // Load event data
      const eventData = await getEventById(attendeeData.event_id);
      setEvent(eventData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendee');
      console.error('Error loading attendee:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!attendee || !event) return;
    
    try {
      const result = await Share.share({
        message: `Check-in QR code for ${attendee.name} at ${event.title}`,
        // In a real app, you would generate a shareable URL or image here
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  // Generate a QR code value that includes the attendee ID, event ID, and other relevant information
  const getQRValue = () => {
    if (!attendee || !event) return '';
    
    // Create a JSON object with attendee and event details
    const qrData = {
      type: 'ventry-attendee',
      id: attendee.id,
      eventId: event.id,
      name: attendee.name,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(qrData);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary }} edges={['top']}>
        <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary, borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Attendee QR Code</Text>
            <View style={styles.headerRight} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !attendee || !event) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary }} edges={['top']}>
        <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary, borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Attendee QR Code</Text>
            <View style={styles.headerRight} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error || 'Failed to load attendee information'}
            </Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={loadAttendeeAndEvent}
            >
              <Text style={[styles.retryButtonText, { color: theme.colors.backgroundPrimary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary }} edges={['top']}>
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <CaretLeft size={24} color={theme.colors.primary} weight="regular" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Attendee QR Code</Text>
          <TouchableOpacity 
            style={styles.shareButton} 
            onPress={handleShare}
          >
            <ShareNetwork size={24} color={theme.colors.primary} weight="regular" />
          </TouchableOpacity>
        </View>
        
        <View style={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary, borderColor: theme.colors.border }]}>
            <Text style={[styles.attendeeName, { color: theme.colors.textPrimary }]}>{attendee.name}</Text>
            <Text style={[styles.eventTitle, { color: theme.colors.textSecondary }]}>{event.title}</Text>
            
            <View style={styles.qrContainer}>
              <QRCode
                value={getQRValue()}
                size={200}
                color={theme.colors.textPrimary}
                backgroundColor={theme.colors.backgroundPrimary}
              />
            </View>
            
            <Text style={[styles.instructions, { color: theme.colors.textSecondary }]}>
              Present this QR code at the event check-in counter
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.shareButtonLarge, { backgroundColor: theme.colors.primary }]}
            onPress={handleShare}
          >
            <ShareNetwork size={20} color={theme.colors.backgroundPrimary} weight="regular" style={styles.shareIcon} />
            <Text style={[styles.shareButtonText, { color: theme.colors.backgroundPrimary }]}>Share QR Code</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
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
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
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
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 320,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  attendeeName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  eventTitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  shareButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
  },
  shareIcon: {
    marginRight: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
