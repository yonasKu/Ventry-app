import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { CloudArrowDown, CloudArrowUp, QrCode, Info } from 'phosphor-react-native';
import { useTheme } from '@/context/ThemeContext';

export default function BackupScreen() {
  const theme = useTheme();
  // In a real app, this would come from local storage
  const lastBackupDate = 'April 28, 2025 - 10:23 AM';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.sm]}>
        <TouchableOpacity style={styles.backupButton}>
          <CloudArrowDown size={24} color={theme.colors.primary} weight="regular" style={styles.buttonIcon} />
          <View style={styles.buttonTextContainer}>
            <Text style={[styles.buttonTitle, { color: theme.colors.textPrimary }]}>BACKUP APP DATA</Text>
            <Text style={[styles.buttonDescription, { color: theme.colors.textSecondary }]}>
              Creates a complete backup of all events, attendees, and settings
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.sm]}>
        <TouchableOpacity style={styles.backupButton}>
          <CloudArrowUp size={24} color={theme.colors.primary} weight="regular" style={styles.buttonIcon} />
          <View style={styles.buttonTextContainer}>
            <Text style={[styles.buttonTitle, { color: theme.colors.textPrimary }]}>RESTORE FROM BACKUP</Text>
            <Text style={[styles.buttonDescription, { color: theme.colors.textSecondary }]}>
              Import data from a previous backup file stored on this device
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={[styles.lastBackupText, { color: theme.colors.textSecondary }]}>Last Backup: {lastBackupDate}</Text>

      <View style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.sm]}>
        <TouchableOpacity style={styles.backupButton}>
          <QrCode size={24} color={theme.colors.primary} weight="regular" style={styles.buttonIcon} />
          <View style={styles.buttonTextContainer}>
            <Text style={[styles.buttonTitle, { color: theme.colors.textPrimary }]}>GENERATE TRANSFER QR CODE</Text>
            <Text style={[styles.buttonDescription, { color: theme.colors.textSecondary }]}>
              Create a QR code to transfer basic settings to another device
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.colors.border }]}>
        <Info size={20} color={theme.colors.textSecondary} weight="regular" style={styles.infoIcon} />
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          All data is stored locally on your device. Regular backups are recommended to prevent data loss.
        </Text>
      </View>
    </View>
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
  lastBackupText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoCard: {
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
});
