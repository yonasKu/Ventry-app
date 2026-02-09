import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { nanoid } from 'nanoid/non-secure';
import { DatabaseService, Event, Attendee } from './DatabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface Device {
  id: string;
  name: string;
  type: 'primary' | 'secondary';
  created_at: string;
  last_sync_at: string;
}

export interface SyncMetadata {
  version: string;
  device_id: string;
  device_name: string;
  exported_at: string;
  data_hash: string;
  encryption: {
    enabled: boolean;
    algorithm?: string;
  };
}

export interface SyncPackage {
  format: string;
  version: string;
  metadata: SyncMetadata;
  data: {
    events: Event[];
    attendees: Attendee[];
  };
  device_info: Device;
}

export interface Conflict {
  type: 'event' | 'attendee';
  item_id: string;
  local_version: any;
  remote_version: any;
  local_updated_at: string;
  remote_updated_at: string;
}

export interface SyncResult {
  success: boolean;
  conflicts: Conflict[];
  imported: {
    events: number;
    attendees: number;
  };
  errors: string[];
}

export interface SyncRecord {
  id: string;
  device_id: string;
  device_name: string;
  synced_at: string;
  direction: 'import' | 'export';
  result: SyncResult;
}

export type MergeStrategy = 'last-write-wins' | 'manual' | 'merge-all';

export interface ExportOptions {
  includeEvents?: boolean;
  includeAttendees?: boolean;
  encrypt?: boolean;
  passphrase?: string;
}

export interface ImportOptions {
  strategy?: MergeStrategy;
  decrypt?: boolean;
  passphrase?: string;
  dryRun?: boolean;
}

export interface Resolution {
  conflict_id: string;
  choice: 'local' | 'remote' | 'merge';
  merged_data?: any;
}

// Storage keys
const DEVICE_INFO_KEY = '@ventry:device_info';
const PAIRED_DEVICES_KEY = '@ventry:paired_devices';
const SYNC_HISTORY_KEY = '@ventry:sync_history';

export class SyncService {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService();
  }

  // ==================== Device Management ====================

  /**
   * Get current device information
   */
  async getDeviceInfo(): Promise<Device> {
    try {
      const stored = await AsyncStorage.getItem(DEVICE_INFO_KEY);
      
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Create new device info
      const device: Device = {
        id: nanoid(),
        name: 'My Device',
        type: 'primary',
        created_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(device));
      return device;
    } catch (error) {
      console.error('Error getting device info:', error);
      throw error;
    }
  }

  /**
   * Update device name
   */
  async updateDeviceName(name: string): Promise<void> {
    try {
      const device = await this.getDeviceInfo();
      device.name = name;
      await AsyncStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(device));
    } catch (error) {
      console.error('Error updating device name:', error);
      throw error;
    }
  }

  /**
   * Get list of paired devices
   */
  async getPairedDevices(): Promise<Device[]> {
    try {
      const stored = await AsyncStorage.getItem(PAIRED_DEVICES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting paired devices:', error);
      return [];
    }
  }

  /**
   * Add a paired device
   */
  async addPairedDevice(device: Device): Promise<void> {
    try {
      const devices = await this.getPairedDevices();
      
      // Check if device already exists
      const existingIndex = devices.findIndex(d => d.id === device.id);
      
      if (existingIndex >= 0) {
        // Update existing device
        devices[existingIndex] = device;
      } else {
        // Add new device
        devices.push(device);
      }
      
      await AsyncStorage.setItem(PAIRED_DEVICES_KEY, JSON.stringify(devices));
    } catch (error) {
      console.error('Error adding paired device:', error);
      throw error;
    }
  }

  /**
   * Remove a paired device
   */
  async removePairedDevice(deviceId: string): Promise<void> {
    try {
      const devices = await this.getPairedDevices();
      const filtered = devices.filter(d => d.id !== deviceId);
      await AsyncStorage.setItem(PAIRED_DEVICES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing paired device:', error);
      throw error;
    }
  }

  // ==================== QR Code Pairing ====================

  /**
   * Generate pairing QR code data
   */
  async generatePairingQR(): Promise<string> {
    try {
      const device = await this.getDeviceInfo();
      const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const qrData = {
        protocol: 'ventry-sync',
        version: '1.0',
        device_id: device.id,
        device_name: device.name,
        pairing_code: pairingCode,
        timestamp: new Date().toISOString(),
      };
      
      return JSON.stringify(qrData);
    } catch (error) {
      console.error('Error generating pairing QR:', error);
      throw error;
    }
  }

  /**
   * Parse pairing QR code data
   */
  async parsePairingQR(qrData: string): Promise<Device> {
    try {
      const data = JSON.parse(qrData);
      
      // Validate protocol
      if (data.protocol !== 'ventry-sync') {
        throw new Error('Invalid QR code protocol');
      }
      
      // Create device object
      const device: Device = {
        id: data.device_id,
        name: data.device_name,
        type: 'secondary',
        created_at: data.timestamp,
        last_sync_at: data.timestamp,
      };
      
      return device;
    } catch (error) {
      console.error('Error parsing pairing QR:', error);
      throw new Error('Invalid pairing QR code');
    }
  }

  /**
   * Complete pairing process
   */
  async completePairing(device: Device): Promise<void> {
    try {
      await this.addPairedDevice(device);
    } catch (error) {
      console.error('Error completing pairing:', error);
      throw error;
    }
  }

  // ==================== Export ====================

  /**
   * Export data to sync file
   */
  async exportData(options: ExportOptions = {}): Promise<string> {
    try {
      const {
        includeEvents = true,
        includeAttendees = true,
      } = options;
      
      // Create sync package
      const syncPackage = await this.createSyncPackage(includeEvents, includeAttendees);
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `ventry-sync-${timestamp}.ventry`;
      const file = new File(Paths.document, filename);
      
      // Write to file
      await file.write(JSON.stringify(syncPackage, null, 2));
      
      // Record sync
      await this.recordSync({
        success: true,
        conflicts: [],
        imported: { events: 0, attendees: 0 },
        errors: [],
      }, 'export');
      
      // Share file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Sync File',
        });
      }
      
      return file.uri;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Create sync package
   */
  async createSyncPackage(includeEvents: boolean = true, includeAttendees: boolean = true): Promise<SyncPackage> {
    try {
      const device = await this.getDeviceInfo();
      
      // Gather data
      const events = includeEvents ? this.db.getEvents() : [];
      const attendees: Attendee[] = [];
      
      if (includeAttendees) {
        // Get all attendees for all events
        for (const event of events) {
          const eventAttendees = this.db.getAttendees(event.id);
          attendees.push(...eventAttendees);
        }
      }
      
      // Calculate data hash (simple implementation)
      const dataString = JSON.stringify({ events, attendees });
      const dataHash = this.simpleHash(dataString);
      
      // Create sync package
      const syncPackage: SyncPackage = {
        format: 'ventry-sync',
        version: '1.0',
        metadata: {
          version: '1.0',
          device_id: device.id,
          device_name: device.name,
          exported_at: new Date().toISOString(),
          data_hash: dataHash,
          encryption: {
            enabled: false,
          },
        },
        data: {
          events,
          attendees,
        },
        device_info: device,
      };
      
      return syncPackage;
    } catch (error) {
      console.error('Error creating sync package:', error);
      throw error;
    }
  }

  // ==================== Import ====================

  /**
   * Import data from sync file
   */
  async importData(fileUri: string, options: ImportOptions = {}): Promise<SyncResult> {
    try {
      const {
        strategy = 'last-write-wins',
        dryRun = false,
      } = options;
      
      // Parse sync package
      const syncPackage = await this.parseSyncPackage(fileUri);
      
      // Detect conflicts
      const conflicts = await this.detectConflicts(syncPackage);
      
      // If dry run, return conflicts without importing
      if (dryRun) {
        return {
          success: true,
          conflicts,
          imported: { events: 0, attendees: 0 },
          errors: [],
        };
      }
      
      // Merge data
      const result = await this.mergeData(syncPackage, strategy);
      
      // Add paired device
      await this.addPairedDevice(syncPackage.device_info);
      
      // Record sync
      await this.recordSync(result, 'import');
      
      return result;
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  /**
   * Parse sync package from file
   */
  async parseSyncPackage(fileUri: string): Promise<SyncPackage> {
    try {
      const file = new File(fileUri);
      const content = await file.text();
      
      const syncPackage = JSON.parse(content);
      
      // Validate format
      if (syncPackage.format !== 'ventry-sync') {
        throw new Error('Invalid sync file format');
      }
      
      // Verify data hash
      const dataString = JSON.stringify(syncPackage.data);
      const calculatedHash = this.simpleHash(dataString);
      
      if (calculatedHash !== syncPackage.metadata.data_hash) {
        throw new Error('Data integrity check failed');
      }
      
      return syncPackage;
    } catch (error) {
      console.error('Error parsing sync package:', error);
      throw error;
    }
  }

  // ==================== Conflict Resolution ====================

  /**
   * Detect conflicts between local and remote data
   */
  async detectConflicts(remote: SyncPackage): Promise<Conflict[]> {
    try {
      const conflicts: Conflict[] = [];
      
      // Check event conflicts
      for (const remoteEvent of remote.data.events) {
        const localEvent = this.db.getEventById(remoteEvent.id);
        
        if (localEvent) {
          // Compare timestamps
          if (localEvent.updated_at !== remoteEvent.updated_at) {
            conflicts.push({
              type: 'event',
              item_id: remoteEvent.id,
              local_version: localEvent,
              remote_version: remoteEvent,
              local_updated_at: localEvent.updated_at,
              remote_updated_at: remoteEvent.updated_at,
            });
          }
        }
      }
      
      // Check attendee conflicts
      for (const remoteAttendee of remote.data.attendees) {
        // Get local attendee (need to search through all events)
        const events = this.db.getEvents();
        let localAttendee: Attendee | null = null;
        
        for (const event of events) {
          const attendees = this.db.getAttendees(event.id);
          const found = attendees.find(a => a.id === remoteAttendee.id);
          if (found) {
            localAttendee = found;
            break;
          }
        }
        
        if (localAttendee) {
          // Compare timestamps
          if (localAttendee.updated_at !== remoteAttendee.updated_at) {
            conflicts.push({
              type: 'attendee',
              item_id: remoteAttendee.id,
              local_version: localAttendee,
              remote_version: remoteAttendee,
              local_updated_at: localAttendee.updated_at,
              remote_updated_at: remoteAttendee.updated_at,
            });
          }
        }
      }
      
      return conflicts;
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      throw error;
    }
  }

  /**
   * Merge remote data into local database
   */
  async mergeData(remote: SyncPackage, strategy: MergeStrategy): Promise<SyncResult> {
    try {
      const result: SyncResult = {
        success: true,
        conflicts: [],
        imported: { events: 0, attendees: 0 },
        errors: [],
      };
      
      // Detect conflicts
      const conflicts = await this.detectConflicts(remote);
      result.conflicts = conflicts;
      
      // Merge events
      for (const remoteEvent of remote.data.events) {
        try {
          const localEvent = this.db.getEventById(remoteEvent.id);
          
          if (!localEvent) {
            // New event, add it
            this.db.addEvent(remoteEvent);
            result.imported.events++;
          } else {
            // Event exists, check strategy
            if (strategy === 'last-write-wins') {
              // Compare timestamps
              if (new Date(remoteEvent.updated_at) > new Date(localEvent.updated_at)) {
                this.db.updateEvent(remoteEvent.id, remoteEvent);
                result.imported.events++;
              }
            }
            // For 'manual' strategy, conflicts are handled separately
          }
        } catch (error) {
          result.errors.push(`Failed to import event ${remoteEvent.id}: ${error}`);
        }
      }
      
      // Merge attendees
      for (const remoteAttendee of remote.data.attendees) {
        try {
          // Check if attendee exists
          const events = this.db.getEvents();
          let exists = false;
          
          for (const event of events) {
            const attendees = this.db.getAttendees(event.id);
            if (attendees.find(a => a.id === remoteAttendee.id)) {
              exists = true;
              break;
            }
          }
          
          if (!exists) {
            // New attendee, add it
            this.db.addAttendee(remoteAttendee.event_id, {
              name: remoteAttendee.name,
              email: remoteAttendee.email || undefined,
              phone: remoteAttendee.phone || undefined,
            });
            result.imported.attendees++;
          }
          // For existing attendees with conflicts, handle based on strategy
        } catch (error) {
          result.errors.push(`Failed to import attendee ${remoteAttendee.id}: ${error}`);
        }
      }
      
      result.success = result.errors.length === 0;
      return result;
    } catch (error) {
      console.error('Error merging data:', error);
      throw error;
    }
  }

  // ==================== Sync History ====================

  /**
   * Get sync history
   */
  async getSyncHistory(): Promise<SyncRecord[]> {
    try {
      const stored = await AsyncStorage.getItem(SYNC_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting sync history:', error);
      return [];
    }
  }

  /**
   * Record a sync operation
   */
  async recordSync(result: SyncResult, direction: 'import' | 'export'): Promise<void> {
    try {
      const device = await this.getDeviceInfo();
      const history = await this.getSyncHistory();
      
      const record: SyncRecord = {
        id: nanoid(),
        device_id: device.id,
        device_name: device.name,
        synced_at: new Date().toISOString(),
        direction,
        result,
      };
      
      // Add to history (keep last 50 records)
      history.unshift(record);
      const trimmed = history.slice(0, 50);
      
      await AsyncStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(trimmed));
      
      // Update device last sync time
      device.last_sync_at = new Date().toISOString();
      await AsyncStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(device));
    } catch (error) {
      console.error('Error recording sync:', error);
    }
  }

  // ==================== Utilities ====================

  /**
   * Simple hash function for data integrity
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
}
