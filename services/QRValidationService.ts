import { Attendee, Event } from './DatabaseService';

// QR code data interfaces
export interface BaseQRData {
  type: string;
  version: string;
  id: string;
  timestamp: string;
}

export interface AttendeeQRData extends BaseQRData {
  type: 'ventry-attendee';
  eventId: string;
  name?: string;
}

export interface EventQRData extends BaseQRData {
  type: 'ventry-event';
  title?: string;
}

export type QRData = AttendeeQRData | EventQRData;

// Validation result interface
export interface ValidationResult {
  valid: boolean;
  code?: string;
  message?: string;
  details?: Record<string, any>;
  data?: QRData;
}

/**
 * Validates a QR code and returns a validation result
 * @param qrString The raw QR code string to validate
 * @param currentEventId The current event ID to validate against
 * @returns ValidationResult object
 */
export function validateQRCode(qrString: string, currentEventId: string): ValidationResult {
  // First, try to parse the QR data
  try {
    const qrData = JSON.parse(qrString);
    return validateQRData(qrData, currentEventId);
  } catch (error) {
    return {
      valid: false,
      code: 'PARSE_ERROR',
      message: 'Invalid QR code format. Could not parse JSON data.'
    };
  }
}

/**
 * Validates parsed QR data
 * @param qrData The parsed QR data to validate
 * @param currentEventId The current event ID to validate against
 * @returns ValidationResult object
 */
export function validateQRData(qrData: any, currentEventId: string): ValidationResult {
  // Basic structure check
  if (!qrData || typeof qrData !== 'object') {
    return {
      valid: false,
      code: 'INVALID_FORMAT',
      message: 'Invalid QR code format. Not a valid object.'
    };
  }

  // Check if it has required fields
  if (!qrData.id) {
    return {
      valid: false,
      code: 'MISSING_ID',
      message: 'Invalid QR code. Missing ID field.'
    };
  }

  // If it's not a Ventry QR code but has an ID, we can still use it
  if (!qrData.type) {
    return {
      valid: true,
      code: 'GENERIC_QR',
      message: 'Generic QR code with ID.',
      data: {
        type: 'ventry-attendee',
        version: '1.0',
        id: qrData.id,
        eventId: currentEventId,
        timestamp: new Date().toISOString()
      } as AttendeeQRData
    };
  }

  // Validate based on QR code type
  switch (qrData.type) {
    case 'ventry-attendee':
      return validateAttendeeQR(qrData, currentEventId);
    case 'ventry-event':
      return validateEventQR(qrData, currentEventId);
    default:
      // Unknown type but has ID - treat as generic attendee QR
      return {
        valid: true,
        code: 'UNKNOWN_TYPE',
        message: 'Unknown QR code type, but contains valid ID.',
        data: {
          type: 'ventry-attendee',
          version: '1.0',
          id: qrData.id,
          eventId: currentEventId,
          timestamp: new Date().toISOString()
        } as AttendeeQRData
      };
  }
}

/**
 * Validates an attendee QR code
 * @param qrData The parsed QR data to validate
 * @param currentEventId The current event ID to validate against
 * @returns ValidationResult object
 */
function validateAttendeeQR(qrData: any, currentEventId: string): ValidationResult {
  // Check for required fields
  if (!qrData.eventId) {
    // Missing event ID, but we can use the current event ID
    return {
      valid: true,
      code: 'MISSING_EVENT_ID',
      message: 'QR code missing event ID. Using current event.',
      data: {
        ...qrData,
        eventId: currentEventId,
        version: qrData.version || '1.0',
        timestamp: qrData.timestamp || new Date().toISOString()
      } as AttendeeQRData
    };
  }

  // Check if event ID matches current event
  if (qrData.eventId !== currentEventId) {
    return {
      valid: false,
      code: 'WRONG_EVENT',
      message: 'This QR code is for a different event.',
      details: {
        qrEventId: qrData.eventId,
        currentEventId: currentEventId
      }
    };
  }

  // Valid attendee QR code
  return {
    valid: true,
    data: {
      ...qrData,
      version: qrData.version || '1.0',
      timestamp: qrData.timestamp || new Date().toISOString()
    } as AttendeeQRData
  };
}

/**
 * Validates an event QR code
 * @param qrData The parsed QR data to validate
 * @param currentEventId The current event ID to validate against
 * @returns ValidationResult object
 */
function validateEventQR(qrData: any, currentEventId: string): ValidationResult {
  // For event QR codes, the ID should match the current event
  if (qrData.id !== currentEventId) {
    return {
      valid: false,
      code: 'WRONG_EVENT',
      message: 'This QR code is for a different event.',
      details: {
        qrEventId: qrData.id,
        currentEventId: currentEventId
      }
    };
  }

  // Valid event QR code
  return {
    valid: true,
    data: {
      ...qrData,
      version: qrData.version || '1.0',
      timestamp: qrData.timestamp || new Date().toISOString()
    } as EventQRData
  };
}

/**
 * Generates QR code data for an attendee
 * @param attendee The attendee to generate QR data for
 * @param eventId The event ID the attendee belongs to
 * @returns QR code data as a string
 */
export function generateAttendeeQRData(attendee: Attendee, eventId: string): string {
  const qrData: AttendeeQRData = {
    type: 'ventry-attendee',
    version: '1.0',
    id: attendee.id,
    eventId: eventId,
    name: attendee.name,
    timestamp: new Date().toISOString()
  };
  
  return JSON.stringify(qrData);
}

/**
 * Generates QR code data for an event
 * @param event The event to generate QR data for
 * @returns QR code data as a string
 */
export function generateEventQRData(event: Event): string {
  const qrData: EventQRData = {
    type: 'ventry-event',
    version: '1.0',
    id: event.id,
    title: event.title,
    timestamp: new Date().toISOString()
  };
  
  return JSON.stringify(qrData);
} 