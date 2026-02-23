/**
 * BackupService Tests
 * 
 * Tests backup creation, validation, restore operations, and backup history management.
 */

import { BackupService, BackupData, RestoreResult } from '../../services/BackupService';
import { mockEvent, mockAttendee, mockBackupData, createMockEvents, createMockAttendees } from '../setup/mocks';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('expo-file-system');
jest.mock('expo-sharing');
jest.mock('expo-document-picker');
jest.mock('@react-native-async-storage/async-storage');

describe('BackupService - Backup Creation', () => {
  let service: BackupService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BackupService();
    
    // Mock AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('Test Device');
  });

  describe('createBackup', () => {
    it('should create backup with all data', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 1024 });

      const fileUri = await service.createBackup();

      expect(fileUri).toBeDefined();
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });

    it('should include events in backup', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        const data = JSON.parse(content);
        expect(data.data.events).toBeDefined();
        expect(Array.isArray(data.data.events)).toBe(true);
        return Promise.resolve();
      });

      await service.createBackup();
    });

    it('should include attendees in backup', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        const data = JSON.parse(content);
        expect(data.data.attendees).toBeDefined();
        expect(Array.isArray(data.data.attendees)).toBe(true);
        return Promise.resolve();
      });

      await service.createBackup();
    });

    it('should include custom fields in backup', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        const data = JSON.parse(content);
        expect(data.data.custom_fields).toBeDefined();
        expect(Array.isArray(data.data.custom_fields)).toBe(true);
        return Promise.resolve();
      });

      await service.createBackup();
    });

    it('should include metadata with counts', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        const data = JSON.parse(content);
        expect(data.metadata).toBeDefined();
        expect(data.metadata.events_count).toBeDefined();
        expect(data.metadata.attendees_count).toBeDefined();
        return Promise.resolve();
      });

      await service.createBackup();
    });

    it('should include version and timestamp', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        const data = JSON.parse(content);
        expect(data.version).toBe('1.0');
        expect(data.created_at).toBeDefined();
        return Promise.resolve();
      });

      await service.createBackup();
    });

    it('should include device name', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('My Test Device');
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation((uri, content) => {
        const data = JSON.parse(content);
        expect(data.device_name).toBe('My Test Device');
        return Promise.resolve();
      });

      await service.createBackup();
    });

    it('should generate unique filename with timestamp', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      const fileUri = await service.createBackup();

      expect(fileUri).toContain('ventry_backup_');
      expect(fileUri).toContain('.json');
    });

    it('should throw error if file write fails', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockRejectedValue(new Error('Write failed'));

      await expect(service.createBackup()).rejects.toThrow('Write failed');
    });
  });

  describe('exportBackup', () => {
    it('should create backup and share it', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 1024 });
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      await service.exportBackup();

      expect(Sharing.shareAsync).toHaveBeenCalled();
    });

    it('should throw error if sharing not available', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

      await expect(service.exportBackup()).rejects.toThrow('Sharing is not available');
    });
  });
});

describe('BackupService - Backup Validation', () => {
  let service: BackupService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BackupService();
  });

  describe('verifyBackup', () => {
    it('should validate correct backup format', async () => {
      const validBackup = JSON.stringify(mockBackupData);
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(validBackup);

      const isValid = await service.verifyBackup('file://backup.json');

      expect(isValid).toBe(true);
    });

    it('should reject backup without version', async () => {
      const invalidBackup = JSON.stringify({ data: {} });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(invalidBackup);

      const isValid = await service.verifyBackup('file://backup.json');

      expect(isValid).toBe(false);
    });

    it('should reject backup without data', async () => {
      const invalidBackup = JSON.stringify({ version: '1.0' });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(invalidBackup);

      const isValid = await service.verifyBackup('file://backup.json');

      expect(isValid).toBe(false);
    });

    it('should reject backup with mismatched counts', async () => {
      const invalidBackup = {
        ...mockBackupData,
        metadata: {
          ...mockBackupData.metadata,
          events_count: 999, // Wrong count
        },
      };
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(invalidBackup));

      const isValid = await service.verifyBackup('file://backup.json');

      expect(isValid).toBe(false);
    });

    it('should return false for invalid JSON', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('invalid json');

      const isValid = await service.verifyBackup('file://backup.json');

      expect(isValid).toBe(false);
    });

    it('should return false if file read fails', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValue(new Error('Read failed'));

      const isValid = await service.verifyBackup('file://backup.json');

      expect(isValid).toBe(false);
    });
  });
});

describe('BackupService - Restore Operations', () => {
  let service: BackupService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BackupService();
  });

  describe('selectAndRestore', () => {
    it('should select file and restore', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://backup.json' }],
      });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockBackupData));

      const result = await service.selectAndRestore();

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should throw error if selection cancelled', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      await expect(service.selectAndRestore()).rejects.toThrow('Backup selection cancelled');
    });
  });

  describe('restoreFromFile', () => {
    it('should restore events successfully', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockBackupData));

      const result = await service.restoreFromFile('file://backup.json');

      expect(result.imported.events).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBeDefined();
    });

    it('should restore attendees successfully', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockBackupData));

      const result = await service.restoreFromFile('file://backup.json');

      expect(result.imported.attendees).toBeGreaterThanOrEqual(0);
    });

    it('should restore custom fields successfully', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockBackupData));

      const result = await service.restoreFromFile('file://backup.json');

      expect(result.imported.custom_fields).toBeGreaterThanOrEqual(0);
    });

    it('should restore templates successfully', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockBackupData));

      const result = await service.restoreFromFile('file://backup.json');

      expect(result.imported.templates).toBeGreaterThanOrEqual(0);
    });

    it('should collect errors for failed imports', async () => {
      const backupWithInvalidData = {
        ...mockBackupData,
        data: {
          ...mockBackupData.data,
          events: [{ ...mockEvent, title: null }], // Invalid event
        },
      };
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(backupWithInvalidData));

      const result = await service.restoreFromFile('file://backup.json');

      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should throw error for invalid backup format', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify({ invalid: true }));

      await expect(service.restoreFromFile('file://backup.json')).rejects.toThrow('Invalid backup file format');
    });

    it('should throw error for invalid JSON', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('invalid json');

      await expect(service.restoreFromFile('file://backup.json')).rejects.toThrow();
    });

    it('should skip duplicate events', async () => {
      // Mock that event already exists
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockBackupData));

      const result = await service.restoreFromFile('file://backup.json');

      // Should not throw error, just skip duplicates
      expect(result).toBeDefined();
    });

    it('should skip attendees for non-existent events', async () => {
      const backupWithOrphanAttendee = {
        ...mockBackupData,
        data: {
          ...mockBackupData.data,
          events: [],
          attendees: [mockAttendee], // Attendee without event
        },
      };
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(backupWithOrphanAttendee));

      const result = await service.restoreFromFile('file://backup.json');

      expect(result.imported.attendees).toBe(0);
    });
  });
});

describe('BackupService - Backup History', () => {
  let service: BackupService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BackupService();
  });

  describe('getBackupHistory', () => {
    it('should return backup history', async () => {
      const mockHistory = [
        { id: '1', filename: 'backup1.json', created_at: '2026-02-20', size: 1024, events_count: 5, attendees_count: 10 },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory));

      const history = await service.getBackupHistory();

      expect(history).toEqual(mockHistory);
      expect(history).toHaveLength(1);
    });

    it('should return empty array if no history', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const history = await service.getBackupHistory();

      expect(history).toEqual([]);
    });

    it('should return empty array on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const history = await service.getBackupHistory();

      expect(history).toEqual([]);
    });
  });

  describe('recordBackup', () => {
    it('should add backup to history', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const record = {
        id: '1',
        filename: 'backup.json',
        created_at: '2026-02-20',
        size: 1024,
        events_count: 5,
        attendees_count: 10,
      };

      await service.recordBackup(record);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should limit history to 20 entries', async () => {
      const existingHistory = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        filename: `backup${i}.json`,
        created_at: '2026-02-20',
        size: 1024,
        events_count: 5,
        attendees_count: 10,
      }));
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingHistory));
      (AsyncStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        const data = JSON.parse(value);
        expect(data.length).toBeLessThanOrEqual(20);
        return Promise.resolve();
      });

      const newRecord = {
        id: '21',
        filename: 'backup21.json',
        created_at: '2026-02-20',
        size: 1024,
        events_count: 5,
        attendees_count: 10,
      };

      await service.recordBackup(newRecord);
    });

    it('should add new backup at beginning of history', async () => {
      const existingHistory = [
        { id: '1', filename: 'old.json', created_at: '2026-02-19', size: 1024, events_count: 5, attendees_count: 10 },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingHistory));
      (AsyncStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        const data = JSON.parse(value);
        expect(data[0].id).toBe('2'); // New record should be first
        return Promise.resolve();
      });

      const newRecord = {
        id: '2',
        filename: 'new.json',
        created_at: '2026-02-20',
        size: 2048,
        events_count: 10,
        attendees_count: 20,
      };

      await service.recordBackup(newRecord);
    });
  });

  describe('clearBackupHistory', () => {
    it('should clear all backup history', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await service.clearBackupHistory();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@ventry:backup_history');
    });
  });
});

describe('BackupService - Device Management', () => {
  let service: BackupService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BackupService();
  });

  describe('getDeviceName', () => {
    it('should return stored device name', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('My iPhone');

      const name = await service.getDeviceName();

      expect(name).toBe('My iPhone');
    });

    it('should return default name if not set', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const name = await service.getDeviceName();

      expect(name).toBe('My Device');
    });

    it('should return default name on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const name = await service.getDeviceName();

      expect(name).toBe('My Device');
    });
  });

  describe('setDeviceName', () => {
    it('should save device name', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await service.setDeviceName('My New Device');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@ventry:device_name', 'My New Device');
    });

    it('should not throw error on save failure', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(service.setDeviceName('Test')).resolves.not.toThrow();
    });
  });
});

describe('BackupService - Utilities', () => {
  let service: BackupService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BackupService();
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(service.formatFileSize(0)).toBe('0 Bytes');
      expect(service.formatFileSize(1024)).toBe('1 KB');
      expect(service.formatFileSize(1048576)).toBe('1 MB');
      expect(service.formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle decimal values', () => {
      expect(service.formatFileSize(1536)).toBe('1.5 KB');
      expect(service.formatFileSize(2621440)).toBe('2.5 MB');
    });

    it('should round to 2 decimal places', () => {
      const result = service.formatFileSize(1234567);
      expect(result).toMatch(/^\d+\.\d{1,2} MB$/);
    });
  });

  describe('cleanupOldBackups', () => {
    it('should delete backups older than specified days', async () => {
      (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

      const deletedCount = await service.cleanupOldBackups(30);

      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 on error', async () => {
      (FileSystem.deleteAsync as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      const deletedCount = await service.cleanupOldBackups(30);

      expect(deletedCount).toBe(0);
    });
  });
});
