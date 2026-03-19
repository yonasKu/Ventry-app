import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { CloudArrowDown, CloudArrowUp, Trash, DeviceMobile, Info } from 'phosphor-react-native';
import { useTheme } from '@/context/ThemeContext';
import { BackupService, BackupRecord } from '@/services/BackupService';
import { formatRelativeTime } from '@/utils/dateTimeUtils';
import { handleError } from '@/utils/errorUtils';
import { showToast } from '@/utils/toast';

export default function BackupScreen() {
  const theme = useTheme();
  const [backupService] = useState(() => new BackupService());
  const [loading, setLoading] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>([]);
  const [deviceName, setDeviceName] = useState('');
  const [editingDeviceName, setEditingDeviceName] = useState(false);

  useEffect(() => {
    loadBackupHistory();
    loadDeviceName();
  }, []);

  const loadBackupHistory = async () => {
    try {
      const history = await backupService.getBackupHistory();
      setBackupHistory(history);
    } catch (error) {
      console.error('Error loading backup history:', error);
    }
  };

  const loadDeviceName = async () => {
    try {
      const name = await backupService.getDeviceName();
      setDeviceName(name);
    } catch (error) {
      console.error('Error loading device name:', error);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      await backupService.exportBackup();
      await loadBackupHistory();
      showToast.success('Backup created and exported successfully!');
    } catch (error) {
      showToast.error('Failed to create backup', handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    Alert.alert(
      'Restore Backup',
      'This will replace all current data with the backup. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await backupService.selectAndRestore();
              
              if (result.success) {
                showToast.success(
                  'Restore Complete',
                  `Imported: ${result.imported.events} events, ${result.imported.attendees} attendees`
                );
              } else {
                showToast.warning(
                  'Restore Completed with Errors',
                  `Some items could not be restored`
                );
              }
              
              await loadBackupHistory();
            } catch (error) {
              showToast.error('Restore failed', handleError(error));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCleanupOldBackups = async () => {
    Alert.alert(
      'Cleanup Old Backups',
      'Delete backup files older than 30 days?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const deletedCount = await backupService.cleanupOldBackups(30);
              await loadBackupHistory(); // Refresh the backup history
              showToast.success(`Deleted ${deletedCount} old backup file(s)`);
            } catch (error) {
              showToast.error('Cleanup failed', handleError(error));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveDeviceName = async () => {
    try {
      await backupService.setDeviceName(deviceName);
      setEditingDeviceName(false);
      showToast.success('Device name updated');
    } catch (error) {
      showToast.error('Failed to update device name', handleError(error));
    }
  };

  const lastBackup = backupHistory[0];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {/* Device Name */}
      <View style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.sm]}>
        <View style={styles.deviceNameContainer}>
          <DeviceMobile size={24} color={theme.colors.primary} weight="regular" style={styles.buttonIcon} />
          <View style={styles.deviceNameContent}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Device Name</Text>
            {editingDeviceName ? (
              <View style={styles.deviceNameEditContainer}>
                <TextInput
                  style={[styles.deviceNameInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                  value={deviceName}
                  onChangeText={setDeviceName}
                  placeholder="Enter device name"
                  placeholderTextColor={theme.colors.textSecondary}
                />
                <TouchableOpacity onPress={handleSaveDeviceName} style={styles.saveButton}>
                  <Text style={[styles.saveButtonText, { color: theme.colors.primary }]}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingDeviceName(true)}>
                <Text style={[styles.deviceNameText, { color: theme.colors.textPrimary }]}>{deviceName}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Backup Actions */}
      <View style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.sm]}>
        <TouchableOpacity 
          style={styles.backupButton}
          onPress={handleCreateBackup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.buttonIcon} />
          ) : (
            <CloudArrowDown size={24} color={theme.colors.primary} weight="regular" style={styles.buttonIcon} />
          )}
          <View style={styles.buttonTextContainer}>
            <Text style={[styles.buttonTitle, { color: theme.colors.textPrimary }]}>BACKUP APP DATA</Text>
            <Text style={[styles.buttonDescription, { color: theme.colors.textSecondary }]}>
              Creates a complete backup of all events, attendees, and settings
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.sm]}>
        <TouchableOpacity 
          style={styles.backupButton}
          onPress={handleRestoreBackup}
          disabled={loading}
        >
          <CloudArrowUp size={24} color={theme.colors.primary} weight="regular" style={styles.buttonIcon} />
          <View style={styles.buttonTextContainer}>
            <Text style={[styles.buttonTitle, { color: theme.colors.textPrimary }]}>RESTORE FROM BACKUP</Text>
            <Text style={[styles.buttonDescription, { color: theme.colors.textSecondary }]}>
              Import data from a previous backup file
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Last Backup Info */}
      {lastBackup && (
        <View style={styles.lastBackupContainer}>
          <Text style={[styles.lastBackupLabel, { color: theme.colors.textSecondary }]}>Last Backup:</Text>
          <Text style={[styles.lastBackupText, { color: theme.colors.textPrimary }]}>
            {formatRelativeTime(new Date(lastBackup.created_at))}
          </Text>
          <Text style={[styles.lastBackupDetails, { color: theme.colors.textSecondary }]}>
            {lastBackup.events_count} events • {lastBackup.attendees_count} attendees • {backupService.formatFileSize(lastBackup.size)}
          </Text>
        </View>
      )}

      {/* Backup History */}
      {backupHistory.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.sm]}>
          <View style={styles.historyHeader}>
            <Text style={[styles.historyTitle, { color: theme.colors.textPrimary }]}>Backup History</Text>
            <TouchableOpacity onPress={handleCleanupOldBackups} disabled={loading}>
              <Trash size={20} color={theme.colors.error} weight="regular" />
            </TouchableOpacity>
          </View>
          {backupHistory.slice(0, 5).map((backup) => (
            <View key={backup.id} style={[styles.historyItem, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.historyItemContent}>
                <Text style={[styles.historyItemDate, { color: theme.colors.textPrimary }]}>
                  {formatRelativeTime(new Date(backup.created_at))}
                </Text>
                <Text style={[styles.historyItemDetails, { color: theme.colors.textSecondary }]}>
                  {backup.events_count} events • {backup.attendees_count} attendees
                </Text>
              </View>
              <Text style={[styles.historyItemSize, { color: theme.colors.textSecondary }]}>
                {backupService.formatFileSize(backup.size)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: theme.colors.border }]}>
        <Info size={20} color={theme.colors.textSecondary} weight="regular" style={styles.infoIcon} />
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          All data is stored locally on your device. Regular backups are recommended to prevent data loss.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  deviceNameContainer: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  deviceNameContent: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  deviceNameText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deviceNameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceNameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    borderBottomWidth: 1,
    paddingVertical: 5,
  },
  saveButton: {
    marginLeft: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  backupButton: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 15,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  buttonDescription: {
    fontSize: 14,
  },
  lastBackupContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  lastBackupLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  lastBackupText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  lastBackupDetails: {
    fontSize: 14,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemDate: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  historyItemDetails: {
    fontSize: 12,
  },
  historyItemSize: {
    fontSize: 12,
    marginLeft: 10,
  },
  infoCard: {
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
});
