import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Attendee } from '../services/DatabaseService';

interface AttendeeQRCodeProps {
  attendee: Attendee;
  eventId: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

/**
 * Component to display a QR code for an attendee
 * The QR code contains a JSON object with the attendee's information
 */
const AttendeeQRCode: React.FC<AttendeeQRCodeProps> = ({
  attendee,
  eventId,
  size = 200,
  color = '#000000',
  backgroundColor = '#FFFFFF'
}) => {
  // Create a data object with attendee information
  const qrData = JSON.stringify({
    id: attendee.id,
    eventId: eventId,
    name: attendee.name,
    email: attendee.email,
    phone: attendee.phone,
    timestamp: new Date().toISOString()
  });

  return (
    <View style={styles.container}>
      <QRCode
        value={qrData}
        size={size}
        color={color}
        backgroundColor={backgroundColor}
      />
      <Text style={styles.nameText}>{attendee.name}</Text>
      <Text style={styles.idText}>ID: {attendee.id}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  nameText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 'bold',
  },
  idText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  }
});

export default AttendeeQRCode;
