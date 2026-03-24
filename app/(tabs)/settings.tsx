import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import VersionCheck from 'react-native-version-check';
import {
  Moon,
  Sun,
  Bell,
  ShieldCheck,
  Info,
  Heart,
  Trash,
  Database,
} from 'phosphor-react-native';
import { useTheme } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '@/services/NotificationService';

export default function SettingsScreen() {
  const theme = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const notif = await AsyncStorage.getItem('notifications_enabled');
      const backup = await AsyncStorage.getItem('auto_backup_enabled');
      
      if (notif !== null) setNotifications(JSON.parse(notif));
      if (backup !== null) setAutoBackup(JSON.parse(backup));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    try {
      if (value) {
        // Request permissions when enabling
        const granted = await NotificationService.requestPermissions();
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive event reminders.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => NotificationService.openSettings() },
            ]
          );
          return;
        }
      }

      // Update notification settings
      const settings = await NotificationService.getSettings();
      settings.enabled = value;
      await NotificationService.updateSettings(settings);
      
      setNotifications(value);
      await AsyncStorage.setItem('notifications_enabled', JSON.stringify(value));
      
      Alert.alert(
        'Notifications',
        value 
          ? 'Notifications enabled. You will receive event reminders and check-in updates.' 
          : 'Notifications disabled. You will not receive any alerts.'
      );
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleAutoBackupToggle = async (value: boolean) => {
    setAutoBackup(value);
    await AsyncStorage.setItem('auto_backup_enabled', JSON.stringify(value));
    Alert.alert(
      'Auto Backup',
      value 
        ? 'Automatic backups will be created daily' 
        : 'Automatic backups disabled'
    );
  };

  const handleDarkModeToggle = () => {
    // Use the theme context's toggleTheme function for immediate updates
    theme.toggleTheme();
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary files and cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AsyncStorage cache items (not settings)
              const keys = await AsyncStorage.getAllKeys();
              const cacheKeys = keys.filter(key => 
                key.startsWith('cache_') || key.startsWith('temp_')
              );
              await AsyncStorage.multiRemove(cacheKeys);
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete ALL events, attendees, and settings. This action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'This will delete everything permanently!',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete All',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await AsyncStorage.clear();
                      Alert.alert('Success', 'All data has been deleted. Please restart the app.');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to clear data');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Ventry',
      'Version 1.0.0\n\nVentry is an offline-first event management app for organizing events and managing attendees.\n\n© 2026 Ventry',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'All your data is stored locally on your device. We do not collect, transmit, or store any personal information on external servers.',
      [{ text: 'OK' }]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Support',
      'Need help? Contact us at support@ventry.app',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Email',
          onPress: () => Linking.openURL('mailto:support@ventry.app'),
        },
      ]
    );
  };

  const handleVersionCheck = async () => {
    try {
      const updateNeeded = await VersionCheck.needUpdate();
      
      if (updateNeeded && updateNeeded.isNeeded) {
        Alert.alert(
          'Update Available',
          `Version ${updateNeeded.latestVersion} is available`,
          [
            { text: 'Later', style: 'cancel' },
            { 
              text: 'Update', 
              onPress: () => Linking.openURL(updateNeeded.storeUrl) 
            },
          ]
        );
      } else {
        Alert.alert('Up to Date', 'You have the latest version!');
      }
    } catch (error) {
      console.log('Error checking version:', error);
      Alert.alert('Error', 'Could not check for updates');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* App Settings Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          App Settings
        </Text>

        {/* Dark Mode */}
        <View style={[styles.settingCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              {theme.isDark ? (
                <Moon size={24} color={theme.colors.primary} weight="fill" />
              ) : (
                <Sun size={24} color={theme.colors.primary} weight="fill" />
              )}
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Use dark theme
                </Text>
              </View>
            </View>
            <Switch
              value={theme.isDark}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={[styles.settingCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Bell size={24} color={theme.colors.primary} weight="fill" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Event reminders and alerts
                </Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Test Rich Notifications */}
        {notifications && (
          <>
            <TouchableOpacity
              style={[styles.settingCard, { backgroundColor: theme.colors.backgroundPrimary }]}
              onPress={async () => {
                await NotificationService.sendRichEventReminder({
                  id: 'test',
                  title: 'Tech Conference 2026',
                  time: '14:00',
                  location: 'Convention Center',
                  attendees_count: 150,
                } as any);
              }}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Bell size={24} color={theme.colors.success} weight="regular" />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                      Test Event Reminder
                    </Text>
                    <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                      Try rich notification with actions
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingCard, { backgroundColor: theme.colors.backgroundPrimary }]}
              onPress={async () => {
                await NotificationService.sendRichMilestoneNotification(
                  'Halfway There! 🎯',
                  '75 of 150 attendees have checked in to Tech Conference 2026',
                  'test',
                  50,
                  75,
                  150
                );
              }}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Bell size={24} color={theme.colors.accent} weight="regular" />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                      Test Milestone Alert
                    </Text>
                    <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                      Try milestone notification with progress
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Auto Backup */}
        <View style={[styles.settingCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Database size={24} color={theme.colors.primary} weight="fill" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Auto Backup
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Daily automatic backups
                </Text>
              </View>
            </View>
            <Switch
              value={autoBackup}
              onValueChange={handleAutoBackupToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="white"
            />
          </View>
        </View>
      </View>

      {/* Data Management Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Data Management
        </Text>

        {/* Clear Cache */}
        <TouchableOpacity
          style={[styles.settingCard, { backgroundColor: theme.colors.backgroundPrimary }]}
          onPress={handleClearCache}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Trash size={24} color={theme.colors.accent} weight="regular" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Clear Cache
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Remove temporary files
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Clear All Data */}
        <TouchableOpacity
          style={[styles.settingCard, { backgroundColor: theme.colors.backgroundPrimary }]}
          onPress={handleClearAllData}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Trash size={24} color={theme.colors.error} weight="fill" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.error }]}>
                  Clear All Data
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Delete all events and attendees
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          About
        </Text>

        {/* App Info */}
        <TouchableOpacity
          style={[styles.settingCard, { backgroundColor: theme.colors.backgroundPrimary }]}
          onPress={handleAbout}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Info size={24} color={theme.colors.primary} weight="regular" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  About Ventry
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Version 1.0.0
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Privacy Policy */}
        <TouchableOpacity
          style={[styles.settingCard, { backgroundColor: theme.colors.backgroundPrimary }]}
          onPress={handlePrivacyPolicy}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <ShieldCheck size={24} color={theme.colors.primary} weight="regular" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Privacy Policy
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Your data stays on your device
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Support */}
        <TouchableOpacity
          style={[styles.settingCard, { backgroundColor: theme.colors.backgroundPrimary }]}
          onPress={handleSupport}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Heart size={24} color={theme.colors.primary} weight="regular" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Support
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Get help and send feedback
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Version Check */}
        <TouchableOpacity
          style={[styles.settingCard, { backgroundColor: theme.colors.backgroundPrimary }]}
          onPress={handleVersionCheck}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Info size={24} color={theme.colors.accent} weight="regular" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                  Check for Updates
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Version 1.0.0
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingCard: {
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
});
