# Multi-Device Sync Protocol Design

**Version:** 1.0  
**Last Updated:** January 22, 2026

---

## Overview

The Ventry sync protocol enables data synchronization between multiple devices without requiring a central server. It uses QR codes for device pairing and file-based sync for data transfer.

---

## Architecture

### Sync Methods

1. **QR Code Configuration Transfer**
   - Quick device pairing
   - Transfer device ID and sync settings
   - One-time setup

2. **File-Based Sync**
   - Export database to encrypted file
   - Import and merge data from other devices
   - Manual or automatic sync

3. **Conflict Resolution**
   - Last-write-wins strategy
   - Timestamp-based conflict detection
   - Manual conflict resolution UI

---

## Data Model

### Device Identity

```typescript
interface Device {
  id: string;              // Unique device identifier (UUID)
  name: string;            // User-friendly device name
  type: 'primary' | 'secondary';
  created_at: string;      // ISO timestamp
  last_sync_at: string;    // ISO timestamp
}
```

### Sync Metadata

```typescript
interface SyncMetadata {
  version: string;         // Sync protocol version
  device_id: string;       // Source device ID
  device_name: string;     // Source device name
  exported_at: string;     // Export timestamp
  data_hash: string;       // Data integrity hash
  encryption: {
    enabled: boolean;
    algorithm: string;     // e.g., 'AES-256-GCM'
  };
}
```

### Sync Package

```typescript
interface SyncPackage {
  metadata: SyncMetadata;
  events: Event[];
  attendees: Attendee[];
  custom_fields?: CustomField[];
  device_info: Device;
}
```

---

## Sync Protocol Flow

### 1. Device Pairing (QR Code)

```
Device A (Primary)                    Device B (Secondary)
     |                                        |
     |-- Generate QR Code with Device Info --|
     |                                        |
     |                    Scan QR Code <------|
     |                                        |
     |                    Parse Device Info --|
     |                                        |
     |                    Save Device Pair ---|
     |                                        |
     |<-- Confirmation (Optional) ------------|
```

**QR Code Format:**
```json
{
  "protocol": "ventry-sync",
  "version": "1.0",
  "device_id": "uuid-here",
  "device_name": "John's iPhone",
  "pairing_code": "6-digit-code",
  "timestamp": "2026-01-22T10:00:00Z"
}
```

### 2. Data Export

```
1. User initiates export
2. Gather all data (events, attendees, custom fields)
3. Add sync metadata
4. Optionally encrypt data
5. Generate sync file (.ventry format)
6. Calculate data hash for integrity
7. Save to device storage
8. Share via system share dialog
```

### 3. Data Import

```
1. User selects sync file
2. Validate file format and integrity
3. Decrypt if encrypted
4. Parse sync package
5. Detect conflicts
6. Show conflict resolution UI (if needed)
7. Merge data into local database
8. Update sync metadata
9. Show sync summary
```

### 4. Conflict Detection

```typescript
interface Conflict {
  type: 'event' | 'attendee' | 'custom_field';
  item_id: string;
  local_version: any;
  remote_version: any;
  local_updated_at: string;
  remote_updated_at: string;
}
```

**Conflict Detection Rules:**
1. Same ID exists on both devices
2. Different `updated_at` timestamps
3. Different data content

**Resolution Strategies:**
- **Automatic (Last-Write-Wins):** Use most recent `updated_at`
- **Manual:** Show UI for user to choose
- **Merge:** Combine non-conflicting fields

---

## File Format

### .ventry File Structure

```json
{
  "format": "ventry-sync",
  "version": "1.0",
  "metadata": {
    "device_id": "uuid",
    "device_name": "Device Name",
    "exported_at": "2026-01-22T10:00:00Z",
    "data_hash": "sha256-hash",
    "encryption": {
      "enabled": false
    }
  },
  "data": {
    "events": [...],
    "attendees": [...],
    "custom_fields": [...]
  },
  "device_info": {
    "id": "uuid",
    "name": "Device Name",
    "type": "primary",
    "created_at": "2026-01-22T10:00:00Z",
    "last_sync_at": "2026-01-22T10:00:00Z"
  }
}
```

---

## Security Considerations

### Encryption

- **Algorithm:** AES-256-GCM
- **Key Derivation:** PBKDF2 with user-provided passphrase
- **Salt:** Random 32-byte salt per file
- **IV:** Random 16-byte IV per encryption

### Data Integrity

- **Hash Algorithm:** SHA-256
- **Hash Scope:** All data content
- **Verification:** On import, verify hash matches

### Privacy

- No data sent to external servers
- All sync happens locally or via user-controlled channels
- Optional encryption for sensitive data

---

## API Design

### SyncService

```typescript
class SyncService {
  // Device Management
  async getDeviceInfo(): Promise<Device>
  async updateDeviceName(name: string): Promise<void>
  async getPairedDevices(): Promise<Device[]>
  async addPairedDevice(device: Device): Promise<void>
  async removePairedDevice(deviceId: string): Promise<void>
  
  // QR Code Pairing
  async generatePairingQR(): Promise<string>
  async parsePairingQR(qrData: string): Promise<Device>
  async completePairing(device: Device): Promise<void>
  
  // Export
  async exportData(options?: ExportOptions): Promise<string>
  async createSyncPackage(): Promise<SyncPackage>
  async encryptSyncPackage(pkg: SyncPackage, passphrase: string): Promise<string>
  
  // Import
  async importData(fileUri: string, options?: ImportOptions): Promise<SyncResult>
  async parseSyncPackage(fileUri: string): Promise<SyncPackage>
  async decryptSyncPackage(encrypted: string, passphrase: string): Promise<SyncPackage>
  
  // Conflict Resolution
  async detectConflicts(remote: SyncPackage): Promise<Conflict[]>
  async resolveConflicts(conflicts: Conflict[], resolutions: Resolution[]): Promise<void>
  async mergeData(remote: SyncPackage, strategy: MergeStrategy): Promise<void>
  
  // Sync History
  async getSyncHistory(): Promise<SyncRecord[]>
  async recordSync(result: SyncResult): Promise<void>
}
```

### Types

```typescript
interface ExportOptions {
  includeEvents?: boolean;
  includeAttendees?: boolean;
  includeCustomFields?: boolean;
  encrypt?: boolean;
  passphrase?: string;
}

interface ImportOptions {
  strategy?: MergeStrategy;
  decrypt?: boolean;
  passphrase?: string;
  dryRun?: boolean;
}

type MergeStrategy = 'last-write-wins' | 'manual' | 'merge-all';

interface SyncResult {
  success: boolean;
  conflicts: Conflict[];
  imported: {
    events: number;
    attendees: number;
    custom_fields: number;
  };
  errors: string[];
}

interface SyncRecord {
  id: string;
  device_id: string;
  device_name: string;
  synced_at: string;
  direction: 'import' | 'export';
  result: SyncResult;
}

interface Resolution {
  conflict_id: string;
  choice: 'local' | 'remote' | 'merge';
  merged_data?: any;
}
```

---

## UI Flow

### 1. Sync Settings Screen

```
┌─────────────────────────────────┐
│  Sync & Devices                 │
├─────────────────────────────────┤
│                                 │
│  This Device                    │
│  ┌───────────────────────────┐ │
│  │ 📱 John's iPhone          │ │
│  │ Primary Device            │ │
│  │ Last sync: 2 hours ago    │ │
│  └───────────────────────────┘ │
│                                 │
│  Paired Devices (2)             │
│  ┌───────────────────────────┐ │
│  │ 💻 John's iPad            │ │
│  │ Last sync: 1 day ago      │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │ 📱 Sarah's iPhone         │ │
│  │ Last sync: 3 days ago     │ │
│  └───────────────────────────┘ │
│                                 │
│  [+ Pair New Device]            │
│  [Export Data]                  │
│  [Import Data]                  │
│  [Sync History]                 │
│                                 │
└─────────────────────────────────┘
```

### 2. Pairing Flow

```
Step 1: Generate QR Code
┌─────────────────────────────────┐
│  Pair New Device                │
├─────────────────────────────────┤
│                                 │
│  Scan this QR code on the       │
│  device you want to pair        │
│                                 │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  │      [QR CODE HERE]       │ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  Or enter pairing code:         │
│  ┌───────────────────────────┐ │
│  │      1 2 3 - 4 5 6        │ │
│  └───────────────────────────┘ │
│                                 │
│  [Cancel]                       │
└─────────────────────────────────┘

Step 2: Scan QR Code (on other device)
┌─────────────────────────────────┐
│  Scan Pairing QR Code           │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  │   [CAMERA VIEW]           │ │
│  │                           │ │
│  │   Position QR code        │ │
│  │   within frame            │ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  Or enter pairing code manually │
│  [Enter Code]                   │
│                                 │
└─────────────────────────────────┘

Step 3: Confirm Pairing
┌─────────────────────────────────┐
│  Confirm Pairing                │
├─────────────────────────────────┤
│                                 │
│  Pair with this device?         │
│                                 │
│  📱 John's iPhone               │
│  Primary Device                 │
│                                 │
│  This will allow data sync      │
│  between devices.               │
│                                 │
│  [Cancel]  [Pair Device]        │
│                                 │
└─────────────────────────────────┘
```

### 3. Export Flow

```
┌─────────────────────────────────┐
│  Export Data                    │
├─────────────────────────────────┤
│                                 │
│  What to export:                │
│  ☑ Events (12)                  │
│  ☑ Attendees (145)              │
│  ☑ Custom Fields (3)            │
│                                 │
│  Security:                      │
│  ☐ Encrypt export file          │
│                                 │
│  [Cancel]  [Export]             │
│                                 │
└─────────────────────────────────┘
```

### 4. Import Flow with Conflicts

```
┌─────────────────────────────────┐
│  Import Data                    │
├─────────────────────────────────┤
│                                 │
│  Found 3 conflicts:             │
│                                 │
│  Event: "Team Meeting"          │
│  ┌───────────────────────────┐ │
│  │ Local: Updated 2 hours ago│ │
│  │ Remote: Updated 1 hour ago│ │
│  │ ○ Keep Local              │ │
│  │ ● Keep Remote (newer)     │ │
│  │ ○ Merge Both              │ │
│  └───────────────────────────┘ │
│                                 │
│  [Resolve All] [Import]         │
│                                 │
└─────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Basic Sync (Week 1-2)
- Device identity management
- Export to .ventry file
- Import from .ventry file
- Basic conflict detection (last-write-wins)

### Phase 2: QR Pairing (Week 3)
- QR code generation
- QR code scanning
- Device pairing flow
- Paired devices management

### Phase 3: Conflict Resolution (Week 4)
- Advanced conflict detection
- Manual conflict resolution UI
- Merge strategies
- Conflict history

### Phase 4: Encryption & Security (Week 5)
- File encryption
- Passphrase management
- Data integrity verification
- Security audit

---

## Testing Strategy

### Unit Tests
- Sync package creation
- Conflict detection logic
- Merge strategies
- Encryption/decryption

### Integration Tests
- Full export/import cycle
- QR code pairing
- Conflict resolution
- Data integrity

### Manual Tests
- Multi-device scenarios
- Large dataset sync
- Network interruption handling
- UI/UX flow

---

## Performance Considerations

- **Large Datasets:** Implement pagination for sync
- **File Size:** Compress sync packages
- **Memory:** Stream large files instead of loading entirely
- **Battery:** Optimize encryption operations

---

## Future Enhancements

1. **Automatic Sync**
   - Background sync when devices are nearby
   - Bluetooth/WiFi Direct sync

2. **Cloud Sync (Optional)**
   - iCloud/Google Drive integration
   - End-to-end encryption

3. **Selective Sync**
   - Sync specific events only
   - Date range filtering

4. **Sync Analytics**
   - Sync success rate
   - Data transfer statistics
   - Device usage patterns

---

**End of Sync Protocol Design**

