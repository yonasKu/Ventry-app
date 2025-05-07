import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Share } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft, Share as ShareIcon, PencilSimple, Trash, CheckCircle, XCircle } from 'phosphor-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useEvents } from '../../../context/EventContext';
import AttendeeQRCode from '../../../components/AttendeeQRCode';
import * as Clipboard from 'expo-clipboard';

export default function AttendeeDetailsScreen() {
  const theme = useTheme();
  const { id, attendeeId } = useLocalSearchParams<{ id: string, attendeeId: string }>();
  const { getEventById, checkInAttendee, deleteAttendee } = useEvents();
  
  const [event, setEvent] = useState<any>(null);
  const [attendee, setAttendee] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEventAndAttendee();
  }, [id, attendeeId]);

  const loadEventAndAttendee = async () => {
    if (!id || !attendeeId) return;
    
    setIsLoading(true);
    
    try {
      const eventData = await getEventById(id);
      setEvent(eventData);
      
      if (eventData && eventData.attendees) {
        const foundAttendee = eventData.attendees.find(a => a.id === attendeeId);
        if (foundAttendee) {
          setAttendee(foundAttendee);
        } else {
          setError('Attendee not found');
        }
      } else {
        setError('No attendees found for this event');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendee details');
      console.error('Error loading attendee details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCheckIn = async () => {
    if (!attendee) return;
    
    try {
      const success = await checkInAttendee(attendee.id);
      if (success) {
        // Update the local state to reflect the toggled status
        const newCheckedInStatus = !attendee.checked_in;
        setAttendee({
          ...attendee,
          checked_in: newCheckedInStatus,
          check_in_time: newCheckedInStatus ? new Date().toISOString() : null
        });
        
        // Show a toast or alert to confirm the action
        Alert.alert(
          'Success', 
          newCheckedInStatus ? 'Attendee checked in successfully' : 'Attendee check-in status removed'
        );
      }
    } catch (error) {
      console.error('Error toggling check-in status:', error);
      Alert.alert('Error', 'Failed to update check-in status');
    }
  };

  const handleEditAttendee = () => {
    router.push(`/event/edit-attendee/${id}?attendeeId=${attendeeId}`);
  };

  const handleDeleteAttendee = () => {
    Alert.alert(
      'Delete Attendee',
      'Are you sure you want to remove this attendee from the event?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteAttendee(attendeeId);
              if (success) {
                Alert.alert('Success', 'Attendee deleted successfully');
                router.back();
              } else {
                Alert.alert('Error', 'Failed to delete attendee');
              }
            } catch (error) {
              console.error('Error deleting attendee:', error);
              Alert.alert('Error', 'Failed to delete attendee');
            }
          }
        }
      ]
    );
  };

  const handleShareQRCode = async () => {
    if (!attendee) return;
    
    try {
      const result = await Share.share({
        message: `Attendee: ${attendee.name}\nEvent: ${event?.title}\nID: ${attendee.id}`,
        title: `${attendee.name} - QR Code`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <CaretLeft size={24} color={theme.colors.textPrimary} weight="bold" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Attendee Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (error || !attendee) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <CaretLeft size={24} color={theme.colors.textPrimary} weight="bold" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Attendee Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error || 'Attendee not found'}</Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <CaretLeft size={24} color={theme.colors.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Attendee Details</Text>
        <TouchableOpacity onPress={handleShareQRCode} style={styles.shareButton}>
          <ShareIcon size={24} color={theme.colors.textPrimary} weight="bold" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.qrCodeContainer, { backgroundColor: theme.colors.surface }]}>
          <AttendeeQRCode 
            attendee={attendee} 
            eventId={id} 
            size={200} 
            color={theme.colors.textPrimary}
            backgroundColor={theme.colors.surface}
          />
        </View>
        
        <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.infoTitle, { color: theme.colors.textPrimary }]}>Attendee Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Name:</Text>
            <TouchableOpacity onPress={() => copyToClipboard(attendee.name, 'Name')}>
              <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{attendee.name}</Text>
            </TouchableOpacity>
          </View>
          
          {attendee.email && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Email:</Text>
              <TouchableOpacity onPress={() => copyToClipboard(attendee.email, 'Email')}>
                <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{attendee.email}</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {attendee.phone && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Phone:</Text>
              <TouchableOpacity onPress={() => copyToClipboard(attendee.phone, 'Phone')}>
                <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{attendee.phone}</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Check-in Status:</Text>
            <View style={styles.checkInStatusContainer}>
              {attendee.checked_in ? (
                <>
                  <CheckCircle size={20} color={theme.colors.success} weight="fill" />
                  <Text style={[styles.checkInStatusText, { color: theme.colors.success }]}>Checked In</Text>
                </>
              ) : (
                <>
                  <XCircle size={20} color={theme.colors.error} weight="fill" />
                  <Text style={[styles.checkInStatusText, { color: theme.colors.error }]}>Not Checked In</Text>
                </>
              )}
            </View>
          </View>
          
          {attendee.checked_in && attendee.check_in_time && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Check-in Time:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                {new Date(attendee.check_in_time).toLocaleString()}
              </Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>ID:</Text>
            <TouchableOpacity onPress={() => copyToClipboard(attendee.id, 'ID')}>
              <Text style={[styles.infoValue, { color: theme.colors.textPrimary, fontSize: 12 }]}>{attendee.id}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { 
              backgroundColor: attendee.checked_in ? '#FFA500' : theme.colors.success 
            }]}
            onPress={handleToggleCheckIn}
          >
            {attendee.checked_in ? (
              <>
                <XCircle size={20} color="#FFFFFF" weight="bold" />
                <Text style={styles.actionButtonText}>Uncheck</Text>
              </>
            ) : (
              <>
                <CheckCircle size={20} color="#FFFFFF" weight="bold" />
                <Text style={styles.actionButtonText}>Check In</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleEditAttendee}
          >
            <PencilSimple size={20} color="#FFFFFF" weight="bold" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
            onPress={handleDeleteAttendee}
          >
            <Trash size={20} color="#FFFFFF" weight="bold" />
            <Text style={styles.actionButtonText}>Delete</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
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
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  qrCodeContainer: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  checkInStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkInStatusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
