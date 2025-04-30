import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, ShareNetwork } from 'phosphor-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '@/context/ThemeContext';
import { useEvents } from '@/context/EventContext';

export default function EventQRScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEventById } = useEvents();
  
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

  const handleShare = async () => {
    if (!event) return;
    
    try {
      const result = await Share.share({
        message: `Join me at ${event.title}! Scan this QR code to check in.`,
        // In a real app, you would generate a shareable URL or image here
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Generate a QR code value that includes the event ID and any other relevant information
  const getQRValue = () => {
    if (!event) return '';
    
    // Create a JSON object with event details
    const qrData = {
      type: 'ventry-event',
      id: event.id,
      title: event.title,
      date: event.date,
    };
    
    return JSON.stringify(qrData);
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
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Event QR Code</Text>
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
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Event QR Code</Text>
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
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Event QR Code</Text>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <ShareNetwork size={24} color={theme.colors.primary} weight="regular" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.eventTitle, { color: theme.colors.textPrimary }]}>{event.title}</Text>
        
        <View style={[styles.qrContainer, { backgroundColor: 'white' }]}>
          <QRCode
            value={getQRValue()}
            size={250}
            color="black"
            backgroundColor="white"
          />
        </View>
        
        <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
          Have attendees scan this QR code to check in to your event
        </Text>
        
        <TouchableOpacity 
          style={[styles.shareButtonLarge, { backgroundColor: theme.colors.primary }]}
          onPress={handleShare}
        >
          <ShareNetwork size={20} color="white" weight="regular" style={styles.shareIcon} />
          <Text style={styles.shareButtonText}>Share QR Code</Text>
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
  shareButton: {
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
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  qrContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  shareButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  shareIcon: {
    marginRight: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
