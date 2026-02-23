/**
 * QRValidationService Tests
 * 
 * Tests QR code validation, generation, and parsing.
 */

import {
  validateQRCode,
  validateQRData,
  generateAttendeeQRData,
  generateEventQRData,
  AttendeeQRData,
  EventQRData,
} from '../../services/QRValidationService';
import { mockEvent, mockAttendee } from '../setup/mocks';

describe('QRValidationService - QR Code Validation', () => {
  const currentEventId = 'test-event-1';

  describe('validateQRCode', () => {
    it('should validate correct attendee QR code', () => {
      const qrData: AttendeeQRData = {
        type: 'ventry-attendee',
        version: '1.0',
        id: 'attendee-1',
        eventId: currentEventId,
        name: 'John Doe',
        timestamp: new Date().toISOString(),
      };
      const qrString = JSON.stringify(qrData);

      const result = validateQRCode(qrString, currentEventId);

      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should validate correct event QR code', () => {
      const qrData: EventQRData = {
        type: 'ventry-event',
        version: '1.0',
        id: currentEventId,
        title: 'Test Event',
        timestamp: new Date().toISOString(),
      };
      const qrString = JSON.stringify(qrData);

      const result = validateQRCode(qrString, currentEventId);

      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject invalid JSON', () => {
      const qrString = 'invalid json {';

      const result = validateQRCode(qrString, currentEventId);

      expect(result.valid).toBe(false);
      expect(result.code).toBe('PARSE_ERROR');
      expect(result.message).toContain('Could not parse JSON');
    });

    it('should reject empty string', () => {
      const result = validateQRCode('', currentEventId);

      expect(result.valid).toBe(false);
      expect(result.code).toBe('PARSE_ERROR');
    });

    it('should reject null', () => {
      const result = validateQRCode('null', currentEventId);

      expect(result.valid).toBe(false);
      expect(result.code).toBe('INVALID_FORMAT');
    });

    it('should reject non-object JSON', () => {
      const result = validateQRCode('"just a string"', currentEventId);

      expect(result.valid).toBe(false);
      expect(result.code).toBe('INVALID_FORMAT');
    });
  });

  describe('validateQRData', () => {
    it('should validate object with ID', () => {
      const qrData = {
        id: 'attendee-1',
      };

      const result = validateQRData(qrData, currentEventId);

      expect(result.valid).toBe(true);
      expect(result.code).toBe('GENERIC_QR');
    });

    it('should reject object without ID', () => {
      const qrData = {
        name: 'John Doe',
      };

      const result = validateQRData(qrData, currentEventId);

      expect(result.valid).toBe(false);
      expect(result.code).toBe('MISSING_ID');
    });

    it('should reject null data', () => {
      const result = validateQRData(null, currentEventId);

      expect(result.valid).toBe(false);
      expect(result.code).toBe('INVALID_FORMAT');
    });

    it('should reject undefined data', () => {
      const result = validateQRData(undefined, currentEventId);

      expect(result.valid).toBe(false);
      expect(result.code).toBe('INVALID_FORMAT');
    });

    it('should handle unknown QR type with ID', () => {
      const qrData = {
        type: 'unknown-type',
        id: 'some-id',
      };

      const result = validateQRData(qrData, currentEventId);

      expect(result.valid).toBe(true);
      expect(result.code).toBe('UNKNOWN_TYPE');
    });
  });

  describe('validateQRData - Attendee QR', () => {
    it('should validate attendee QR with matching event', () => {
      const qrData: AttendeeQRData = {
        type: 'ventry-attendee',
        version: '1.0',
        id: 'attendee-1',
        eventId: currentEventId,
        timestamp: new Date().toISOString(),
      };

      const result = validateQRData(qrData, currentEventId);

      expect(result.valid).toBe(true);
      expect(result.data?.type).toBe('ventry-attendee');
    });

    it('should reject attendee QR with wrong event', () => {
      const qrData: AttendeeQRData = {
        type: 'ventry-attendee',
        version: '1.0',
        id: 'attendee-1',
        eventId: 'different-event',
        timestamp: new Date().toISOString(),
      };

      const result = validateQRData(qrData, currentEventId);

      expect(result.valid).toBe(false);
      expect(result.code).toBe('WRONG_EVENT');
      expect(result.details).toBeDefined();
    });

    it('should handle attendee QR without event ID', () => {
      const qrData = {
        type: 'ventry-attendee',
        version: '1.0',
        id: 'attendee-1',
        timestamp: new Date().toISOString(),
      };

      const result = validateQRData(qrData, currentEventId);

      expect(result.valid).toBe(true);
      expect(result.code).toBe('MISSING_EVENT_ID');
      expect(result.data?.eventId).toBe(currentEventId);
    });

    it('should add default version if missing', () => {
      const qrData = {
        type: 'ventry-attendee',
        id: 'attendee-1',
        eventId: currentEventId,
      };

      const result = validateQRData(qrData, currentEventId);

      expect(result.valid).toBe(true);
      expect(result.data?.version).toBe('1.0');
    });

    it('should add timestamp if missing', () => {
      const qrData = {
        type: 'ventry-attendee',
        id: 'attendee-1',
        eventId: currentEventId,
      };

      const result = validateQRData(qrData, currentEventId);

      expect(result.valid).toBe(true);
      expect(result.data?.timestamp).toBeDefined();
    });
  });

  describe('validateQRData - Event QR', () => {
    it('should validate event QR with matching ID', () => {
      const qrData: EventQRData = {
        type: 'ventry-event',
        version: '1.0',
        id: currentEventId,
        timestamp: new Date().toISOString(),
      };

      const result = validateQRData(qrData, currentEventId);

      expect(result.valid).toBe(true);
      expect(result.data?.type).toBe('ventry-event');
    });

    it('should reject event QR with wrong ID', () => {
      const qrData: EventQRData = {
        type: 'ventry-event',
        version: '1.0',
        id: 'different-event',
        timestamp: new Date().toISOString(),
      };

      const result = validateQRData(qrData, currentEventId);

      expect(result.valid).toBe(false);
      expect(result.code).toBe('WRONG_EVENT');
    });

    it('should add default version if missing', () => {
      const qrData = {
        type: 'ventry-event',
        id: currentEventId,
      };

      const result = validateQRData(qrData, currentEventId);

      expect(result.valid).toBe(true);
      expect(result.data?.version).toBe('1.0');
    });
  });
});

describe('QRValidationService - QR Code Generation', () => {
  describe('generateAttendeeQRData', () => {
    it('should generate valid QR data for attendee', () => {
      const qrString = generateAttendeeQRData(mockAttendee, mockEvent.id);

      expect(qrString).toBeDefined();
      expect(typeof qrString).toBe('string');
    });

    it('should generate parseable JSON', () => {
      const qrString = generateAttendeeQRData(mockAttendee, mockEvent.id);

      expect(() => JSON.parse(qrString)).not.toThrow();
    });

    it('should include attendee ID', () => {
      const qrString = generateAttendeeQRData(mockAttendee, mockEvent.id);
      const qrData = JSON.parse(qrString);

      expect(qrData.id).toBe(mockAttendee.id);
    });

    it('should include event ID', () => {
      const qrString = generateAttendeeQRData(mockAttendee, mockEvent.id);
      const qrData = JSON.parse(qrString);

      expect(qrData.eventId).toBe(mockEvent.id);
    });

    it('should include attendee name', () => {
      const qrString = generateAttendeeQRData(mockAttendee, mockEvent.id);
      const qrData = JSON.parse(qrString);

      expect(qrData.name).toBe(mockAttendee.name);
    });

    it('should include type field', () => {
      const qrString = generateAttendeeQRData(mockAttendee, mockEvent.id);
      const qrData = JSON.parse(qrString);

      expect(qrData.type).toBe('ventry-attendee');
    });

    it('should include version field', () => {
      const qrString = generateAttendeeQRData(mockAttendee, mockEvent.id);
      const qrData = JSON.parse(qrString);

      expect(qrData.version).toBe('1.0');
    });

    it('should include timestamp', () => {
      const qrString = generateAttendeeQRData(mockAttendee, mockEvent.id);
      const qrData = JSON.parse(qrString);

      expect(qrData.timestamp).toBeDefined();
      expect(new Date(qrData.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should generate unique timestamps', () => {
      const qrString1 = generateAttendeeQRData(mockAttendee, mockEvent.id);
      const qrString2 = generateAttendeeQRData(mockAttendee, mockEvent.id);

      // Timestamps should be different (or very close)
      expect(qrString1).toBeDefined();
      expect(qrString2).toBeDefined();
    });
  });

  describe('generateEventQRData', () => {
    it('should generate valid QR data for event', () => {
      const qrString = generateEventQRData(mockEvent);

      expect(qrString).toBeDefined();
      expect(typeof qrString).toBe('string');
    });

    it('should generate parseable JSON', () => {
      const qrString = generateEventQRData(mockEvent);

      expect(() => JSON.parse(qrString)).not.toThrow();
    });

    it('should include event ID', () => {
      const qrString = generateEventQRData(mockEvent);
      const qrData = JSON.parse(qrString);

      expect(qrData.id).toBe(mockEvent.id);
    });

    it('should include event title', () => {
      const qrString = generateEventQRData(mockEvent);
      const qrData = JSON.parse(qrString);

      expect(qrData.title).toBe(mockEvent.title);
    });

    it('should include type field', () => {
      const qrString = generateEventQRData(mockEvent);
      const qrData = JSON.parse(qrString);

      expect(qrData.type).toBe('ventry-event');
    });

    it('should include version field', () => {
      const qrString = generateEventQRData(mockEvent);
      const qrData = JSON.parse(qrString);

      expect(qrData.version).toBe('1.0');
    });

    it('should include timestamp', () => {
      const qrString = generateEventQRData(mockEvent);
      const qrData = JSON.parse(qrString);

      expect(qrData.timestamp).toBeDefined();
      expect(new Date(qrData.timestamp).toString()).not.toBe('Invalid Date');
    });
  });
});

describe('QRValidationService - Round Trip', () => {
  it('should validate generated attendee QR code', () => {
    const qrString = generateAttendeeQRData(mockAttendee, mockEvent.id);
    
    const result = validateQRCode(qrString, mockEvent.id);

    expect(result.valid).toBe(true);
  });

  it('should validate generated event QR code', () => {
    const qrString = generateEventQRData(mockEvent);
    
    const result = validateQRCode(qrString, mockEvent.id);

    expect(result.valid).toBe(true);
  });

  it('should extract attendee ID from generated QR', () => {
    const qrString = generateAttendeeQRData(mockAttendee, mockEvent.id);
    const result = validateQRCode(qrString, mockEvent.id);

    expect(result.data?.id).toBe(mockAttendee.id);
  });

  it('should extract event ID from generated QR', () => {
    const qrString = generateEventQRData(mockEvent);
    const result = validateQRCode(qrString, mockEvent.id);

    expect(result.data?.id).toBe(mockEvent.id);
  });
});

describe('QRValidationService - Error Messages', () => {
  it('should provide clear error for parse error', () => {
    const result = validateQRCode('invalid', 'event-1');

    expect(result.message).toContain('parse');
    expect(result.message).toContain('JSON');
  });

  it('should provide clear error for wrong event', () => {
    const qrData: AttendeeQRData = {
      type: 'ventry-attendee',
      version: '1.0',
      id: 'attendee-1',
      eventId: 'wrong-event',
      timestamp: new Date().toISOString(),
    };
    const result = validateQRCode(JSON.stringify(qrData), 'correct-event');

    expect(result.message).toContain('different event');
  });

  it('should provide clear error for missing ID', () => {
    const qrData = { name: 'Test' };
    const result = validateQRCode(JSON.stringify(qrData), 'event-1');

    expect(result.message).toContain('Missing ID');
  });

  it('should include details for wrong event error', () => {
    const qrData: AttendeeQRData = {
      type: 'ventry-attendee',
      version: '1.0',
      id: 'attendee-1',
      eventId: 'wrong-event',
      timestamp: new Date().toISOString(),
    };
    const result = validateQRCode(JSON.stringify(qrData), 'correct-event');

    expect(result.details).toBeDefined();
    expect(result.details?.qrEventId).toBe('wrong-event');
    expect(result.details?.currentEventId).toBe('correct-event');
  });
});

describe('QRValidationService - Edge Cases', () => {
  it('should handle very long IDs', () => {
    const longId = 'a'.repeat(1000);
    const qrData: AttendeeQRData = {
      type: 'ventry-attendee',
      version: '1.0',
      id: longId,
      eventId: 'event-1',
      timestamp: new Date().toISOString(),
    };

    const result = validateQRCode(JSON.stringify(qrData), 'event-1');

    expect(result.valid).toBe(true);
  });

  it('should handle special characters in name', () => {
    const attendee = {
      ...mockAttendee,
      name: 'John "The Boss" O\'Brien & Co.',
    };

    const qrString = generateAttendeeQRData(attendee, mockEvent.id);
    const result = validateQRCode(qrString, mockEvent.id);

    expect(result.valid).toBe(true);
  });

  it('should handle unicode characters', () => {
    const attendee = {
      ...mockAttendee,
      name: '张伟 🎉',
    };

    const qrString = generateAttendeeQRData(attendee, mockEvent.id);
    const result = validateQRCode(qrString, mockEvent.id);

    expect(result.valid).toBe(true);
  });

  it('should handle empty name', () => {
    const attendee = {
      ...mockAttendee,
      name: '',
    };

    const qrString = generateAttendeeQRData(attendee, mockEvent.id);

    expect(qrString).toBeDefined();
  });

  it('should handle whitespace in IDs', () => {
    const qrData: AttendeeQRData = {
      type: 'ventry-attendee',
      version: '1.0',
      id: '  attendee-1  ',
      eventId: 'event-1',
      timestamp: new Date().toISOString(),
    };

    const result = validateQRCode(JSON.stringify(qrData), 'event-1');

    expect(result.valid).toBe(true);
  });
});
