import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Attendee } from '../services/DatabaseService';
import { generateAttendeeQRData } from '../services/QRValidationService';

interface AttendeeQRCodeProps {
  attendee: Attendee;
  eventId: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

/**
 * Component to display a QR code for an attendee
 * The QR code contains a standardized JSON object with the attendee's information
 */
const AttendeeQRCode: React.FC<AttendeeQRCodeProps> = ({
  attendee,
  eventId,
  size = 200,
  color = '#000000',
  backgroundColor = '#FFFFFF'
}) => {
  // Use the standardized QR data format from our validation service
  const qrData = generateAttendeeQRData(attendee, eventId);

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
