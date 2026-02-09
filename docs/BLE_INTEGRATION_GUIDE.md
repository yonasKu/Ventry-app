# BLE Integration Guide for Ventry

## Overview
This guide explains how to integrate Bluetooth Low Energy (BLE) functionality into the Ventry event check-in app using `react-native-ble-plx`.

## What is React Native BLE PLX?

**react-native-ble-plx** is a React Native library that provides:
- BLE device scanning and discovery
- Connection management
- Data reading/writing via GATT characteristics
- Notification handling
- Cross-platform support (iOS & Android)

## Use Cases for Ventry

### 1. BLE Badge Check-In System
**Scenario**: Attendees wear BLE-enabled badges that broadcast their unique ID.

**Benefits**:
- ✅ Hands-free check-in (walk through entrance)
- ✅ Faster than QR scanning (no need to stop)
- ✅ Works with phones in pockets
- ✅ Real-time attendance tracking
- ✅ Automatic timestamp recording

**How it works**:
1. BLE badge broadcasts attendee UUID
2. Organizer's phone scans for nearby badges
3. App automatically checks in detected attendees
4. Notification confirms check-in

### 2. Proximity-Based Attendance
**Scenario**: Place BLE beacons at session entrances.

**Benefits**:
- ✅ Track which sessions attendees visit
- ✅ Automatic session attendance
- ✅ No manual check-in required
- ✅ Collect engagement analytics

### 3. Offline Device-to-Device Sync
**Scenario**: Multiple organizers with phones sync data via BLE.

**Benefits**:
- ✅ Works without internet
- ✅ Real-time data sharing
- ✅ Distributed check-in points
- ✅ Automatic conflict resolution

### 4. Smart Badge Display
**Scenario**: Update e-ink badges with attendee info.

**Benefits**:
- ✅ Digital name tags
- ✅ Update info remotely
- ✅ Show session schedules
- ✅ Display QR codes on badge

## Installation

```bash
# Install the library
npm install react-native-ble-plx

# iOS: Install pods
cd ios && pod install && cd ..

# Android: Update AndroidManifest.xml (see below)
```

### iOS Configuration

Add to `ios/Podfile`:
```ruby
permissions_path = '../node_modules/react-native-permissions/ios'
pod 'Permission-BluetoothPeripheral', :path => "#{permissions_path}/BluetoothPeripheral"
```

Add to `Info.plist`:
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Ventry needs Bluetooth to check in attendees with BLE badges</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>Ventry needs Bluetooth to communicate with BLE devices</string>
```

### Android Configuration

Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.BLUETOOTH"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"/>
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
```

## Implementation Example

### 1. Create BLE Service

```typescript
// services/BLEService.ts
import { BleManager, Device, State } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

export class BLEService {
  private manager: BleManager;
  private scanning: boolean = false;

  constructor() {
    this.manager = new BleManager();
  }

  /**
   * Request Bluetooth permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      
      return Object.values(granted).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true; // iOS handles permissions automatically
  }

  /**
   * Check if Bluetooth is enabled
   */
  async isBluetoothEnabled(): Promise<boolean> {
    const state = await this.manager.state();
    return state === State.PoweredOn;
  }

  /**
   * Scan for BLE badges
   */
  async scanForBadges(
    onBadgeFound: (attendeeId: string, rssi: number) => void,
    durationMs: number = 10000
  ): Promise<void> {
    if (this.scanning) {
      console.log('Already scanning');
      return;
    }

    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      throw new Error('Bluetooth permissions not granted');
    }

    const isEnabled = await this.isBluetoothEnabled();
    if (!isEnabled) {
      throw new Error('Bluetooth is not enabled');
    }

    this.scanning = true;
    const discoveredDevices = new Set<string>();

    this.manager.startDeviceScan(
      null, // Scan for all devices
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          return;
        }

        if (device && device.name?.startsWith('VENTRY_')) {
          // Extract attendee ID from device name
          // Format: VENTRY_<attendeeId>
          const attendeeId = device.name.replace('VENTRY_', '');
          
          if (!discoveredDevices.has(attendeeId)) {
            discoveredDevices.add(attendeeId);
            onBadgeFound(attendeeId, device.rssi || -100);
          }
        }
      }
    );

    // Stop scanning after duration
    setTimeout(() => {
      this.stopScan();
    }, durationMs);
  }

  /**
   * Stop scanning
   */
  stopScan(): void {
    if (this.scanning) {
      this.manager.stopDeviceScan();
      this.scanning = false;
    }
  }

  /**
   * Connect to a specific badge
   */
  async connectToBadge(deviceId: string): Promise<Device> {
    const device = await this.manager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();
    return device;
  }

  /**
   * Read data from badge
   */
  async readBadgeData(device: Device): Promise<string> {
    // Example: Read attendee info from a characteristic
    const serviceUUID = '0000180A-0000-1000-8000-00805F9B34FB';
    const characteristicUUID = '00002A29-0000-1000-8000-00805F9B34FB';
    
    const characteristic = await device.readCharacteristicForService(
      serviceUUID,
      characteristicUUID
    );
    
    return characteristic.value || '';
  }

  /**
   * Write data to badge (e.g., update display)
   */
  async writeToBadge(device: Device, data: string): Promise<void> {
    const serviceUUID = '0000180A-0000-1000-8000-00805F9B34FB';
    const characteristicUUID = '00002A29-0000-1000-8000-00805F9B34FB';
    
    await device.writeCharacteristicWithResponseForService(
      serviceUUID,
      characteristicUUID,
      Buffer.from(data).toString('base64')
    );
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopScan();
    this.manager.destroy();
  }
}

export default new BLEService();
```

### 2. Create BLE Check-In Screen

```typescript
// app/event/ble-checkin/[id].tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Bluetooth, BluetoothConnected, Check } from 'phosphor-react-native';
import BLEService from '../../../services/BLEService';
import { DatabaseService } from '../../../services/DatabaseService';

interface DetectedBadge {
  attendeeId: string;
  rssi: number;
  timestamp: number;
  checkedIn: boolean;
}

export default function BLECheckInScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const [scanning, setScanning] = useState(false);
  const [detectedBadges, setDetectedBadges] = useState<DetectedBadge[]>([]);
  const db = new DatabaseService();

  const startScanning = async () => {
    try {
      setScanning(true);
      setDetectedBadges([]);

      await BLEService.scanForBadges(
        (attendeeId, rssi) => {
          // Check if attendee exists
          const attendees = db.getAttendees(eventId);
          const attendee = attendees.find(a => a.id === attendeeId);

          if (attendee) {
            setDetectedBadges(prev => {
              const exists = prev.find(b => b.attendeeId === attendeeId);
              if (exists) return prev;

              return [...prev, {
                attendeeId,
                rssi,
                timestamp: Date.now(),
                checkedIn: attendee.checked_in
              }];
            });

            // Auto check-in if not already checked in
            if (!attendee.checked_in) {
              db.checkInAttendee(attendeeId);
              Alert.alert('✓ Checked In', `${attendee.name} checked in via BLE badge`);
            }
          }
        },
        30000 // Scan for 30 seconds
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to start BLE scanning');
      console.error(error);
    } finally {
      setScanning(false);
    }
  };

  const stopScanning = () => {
    BLEService.stopScan();
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      BLEService.stopScan();
    };
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        BLE Badge Check-In
      </Text>

      <TouchableOpacity
        onPress={scanning ? stopScanning : startScanning}
        style={{
          backgroundColor: scanning ? '#EF4444' : '#3B82F6',
          padding: 16,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20
        }}
      >
        {scanning ? (
          <BluetoothConnected size={24} color="white" weight="bold" />
        ) : (
          <Bluetooth size={24} color="white" weight="bold" />
        )}
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
          {scanning ? 'Stop Scanning' : 'Start Scanning'}
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
        Detected Badges ({detectedBadges.length})
      </Text>

      <FlatList
        data={detectedBadges}
        keyExtractor={item => item.attendeeId}
        renderItem={({ item }) => {
          const attendee = db.getAttendees(eventId).find(a => a.id === item.attendeeId);
          return (
            <View style={{
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600' }}>
                  {attendee?.name || 'Unknown'}
                </Text>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>
                  Signal: {item.rssi} dBm
                </Text>
              </View>
              {item.checkedIn && (
                <Check size={24} color="#10B981" weight="bold" />
              )}
            </View>
          );
        }}
      />
    </View>
  );
}
```

## Recommended BLE Hardware

### For Attendee Badges:
1. **Nordic nRF52832** - Popular BLE chip for badges
2. **ESP32** - Affordable, WiFi + BLE combo
3. **TI CC2640** - Low power BLE solution
4. **Custom PCB badges** with e-ink displays

### For Beacons:
1. **Estimote Beacons** - Easy to use, good SDK
2. **Kontakt.io Beacons** - Enterprise-grade
3. **Raspberry Pi Zero W** - DIY beacon solution
4. **ESP32 Beacons** - Budget-friendly option

## Security Considerations

1. **Encryption**: Use BLE encryption for sensitive data
2. **Authentication**: Verify badge authenticity before check-in
3. **Range Limiting**: Only check in within specific proximity
4. **Replay Protection**: Prevent badge cloning/replay attacks
5. **Privacy**: Don't broadcast personal info in BLE advertisements

## Performance Tips

1. **Batch Processing**: Check in multiple attendees at once
2. **Background Scanning**: Use background modes for continuous scanning
3. **Power Management**: Optimize scan intervals to save battery
4. **Connection Pooling**: Reuse connections when possible
5. **Caching**: Cache attendee data to reduce database queries

## Next Steps

1. **Prototype**: Test with a few BLE development boards
2. **Badge Design**: Design custom badges with your branding
3. **Pilot Event**: Test at a small event first
4. **Scale**: Order badges in bulk for larger events
5. **Analytics**: Track engagement and movement patterns

## Cost Estimate

- **BLE Badges**: $5-15 per badge (bulk order)
- **BLE Beacons**: $20-50 per beacon
- **Development**: 2-3 weeks for full integration
- **Testing**: 1 week with real hardware

## Alternative: NFC

If BLE seems complex, consider **NFC (Near Field Communication)**:
- ✅ Simpler to implement
- ✅ No battery needed in tags
- ✅ Very secure (short range)
- ❌ Requires physical tap (not hands-free)
- ❌ Shorter range than BLE

## Conclusion

BLE integration can significantly enhance the Ventry app by enabling:
- Faster, hands-free check-ins
- Real-time attendance tracking
- Offline device synchronization
- Advanced analytics and insights

The investment in BLE hardware and development can pay off for large events where speed and automation are critical.
