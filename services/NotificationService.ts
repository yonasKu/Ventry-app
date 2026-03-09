import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event } from './DatabaseService';

// Theme colors for notifications
const NOTIFICATION_COLORS = {
  primary: '#0D9488',      // Teal
  success: '#10B981',      // Green
  error: '#EF4444',        // Red
  accent: '#F59E0B',       // Amber
};

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export enum NotificationType {
  EVENT_REMINDER_24H = 'event_reminder_24h',
  EVENT_REMINDER_1H = 'event_reminder_1h',
  EVENT_START = 'event_start',
  FIRST_CHECKIN = 'first_checkin',
  MILESTONE_50 = 'milestone_50',
  MILESTONE_100 = 'milestone_100',
  LOW_CHECKIN = 'low_checkin',
  BACKUP_REMINDER = 'backup_reminder',
}

export interface NotificationSettings {
  enabled: boolean;
  eventReminders: {
    enabled: boolean;
    twentyFourHours: boolean;
    oneHour: boolean;
    atStart: boolean;
  };
  checkInUpdates: {
    enabled: boolean;
    firstCheckIn: boolean;
    milestones: boolean;
    lowCheckInAlert: boolean;
  };
  backupReminders: {
    enabled: boolean;
  };
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  eventReminders: {
    enabled: true,
    twentyFourHours: true,
    oneHour: true,
    atStart: true,
  },
  checkInUpdates: {
    enabled: true,
    firstCheckIn: true,
    milestones: true,
    lowCheckInAlert: true,
  },
  backupReminders: {
    enabled: true,
  },
};

class NotificationService {
  private static instance: NotificationService;
  private initialized = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification system (without requesting permissions)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Set up notification channels for Android (doesn't require permission)
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Set up notification response listener
      this.setupNotificationListener();

      this.initialized = true;
      console.log('NotificationService initialized');
    } catch (error) {
      console.error('Failed to initialize NotificationService:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    // Event Reminders Channel
    await Notifications.setNotificationChannelAsync('event_reminders', {
      name: 'Event Reminders',
      description: 'Notifications about upcoming events',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      enableLights: true,
      lightColor: NOTIFICATION_COLORS.primary,
    });

    // Check-in Updates Channel
    await Notifications.setNotificationChannelAsync('checkin_updates', {
      name: 'Check-in Updates',
      description: 'Real-time check-in notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      enableLights: true,
      lightColor: NOTIFICATION_COLORS.success,
    });

    // Alerts Channel
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Alerts',
      description: 'Important alerts requiring attention',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 500, 250, 500],
      enableLights: true,
      lightColor: NOTIFICATION_COLORS.error,
    });

    // System Channel
    await Notifications.setNotificationChannelAsync('system', {
      name: 'System Notifications',
      description: 'App updates and maintenance',
      importance: Notifications.AndroidImportance.LOW,
      sound: undefined,
      vibrationPattern: undefined,
      enableLights: false,
    });
  }

  /**
   * Setup notification response listener
   */
  private setupNotificationListener(): void {
    Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
      // Handle navigation based on notification type
      // This will be implemented when integrating with navigation
    });
  }

  /**
   * Get notification settings
   */
  async getSettings(): Promise<NotificationSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem('notification_settings');
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }

  /**
   * Schedule event reminder notifications
   */
  async scheduleEventReminders(event: Event): Promise<string[]> {
    const settings = await this.getSettings();
    if (!settings.enabled || !settings.eventReminders.enabled) {
      return [];
    }

    const notificationIds: string[] = [];
    const eventDate = new Date(event.date);
    const [hours, minutes] = event.time.split(':').map(Number);
    eventDate.setHours(hours, minutes, 0, 0);

    const now = new Date();

    // 24 hours before
    if (settings.eventReminders.twentyFourHours) {
      const trigger24h = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
      if (trigger24h > now) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Event Tomorrow: ${event.title}`,
            body: `${event.title} starts tomorrow at ${event.time}. ${event.attendees_count || 0} attendees registered.`,
            data: {
              type: NotificationType.EVENT_REMINDER_24H,
              eventId: event.id,
              screen: 'event-detail',
            },
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: trigger24h,
          },
        });
        notificationIds.push(id);
        await this.saveNotificationId(event.id, id, NotificationType.EVENT_REMINDER_24H);
      }
    }

    // 1 hour before
    if (settings.eventReminders.oneHour) {
      const trigger1h = new Date(eventDate.getTime() - 60 * 60 * 1000);
      if (trigger1h > now) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Event Starting Soon: ${event.title}`,
            body: `${event.title} starts in 1 hour. Ready to check in attendees?`,
            data: {
              type: NotificationType.EVENT_REMINDER_1H,
              eventId: event.id,
              screen: 'check-in',
            },
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: trigger1h,
          },
        });
        notificationIds.push(id);
        await this.saveNotificationId(event.id, id, NotificationType.EVENT_REMINDER_1H);
      }
    }

    // At event start
    if (settings.eventReminders.atStart) {
      if (eventDate > now) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `${event.title} is Starting Now!`,
            body: 'Your event has started. Open check-in to welcome attendees.',
            data: {
              type: NotificationType.EVENT_START,
              eventId: event.id,
              screen: 'check-in',
            },
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: eventDate,
          },
        });
        notificationIds.push(id);
        await this.saveNotificationId(event.id, id, NotificationType.EVENT_START);
      }
    }

    return notificationIds;
  }

  /**
   * Send first check-in notification
   */
  async sendFirstCheckInNotification(attendeeName: string, eventTitle: string, eventId: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled || !settings.checkInUpdates.enabled || !settings.checkInUpdates.firstCheckIn) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'First Attendee Checked In',
        body: `${attendeeName} just checked in to ${eventTitle}`,
        data: {
          type: NotificationType.FIRST_CHECKIN,
          eventId,
          screen: 'event-stats',
        },
        sound: 'default',
      },
      trigger: null, // Send immediately
    });
  }

  /**
   * Send milestone notification
   */
  async sendMilestoneNotification(
    milestone: 50 | 100,
    checkedIn: number,
    total: number,
    eventTitle: string,
    eventId: string
  ): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled || !settings.checkInUpdates.enabled || !settings.checkInUpdates.milestones) {
      return;
    }

    const titles = {
      50: 'Halfway There - 50% Checked In',
      100: 'Perfect Attendance',
    };

    const bodies = {
      50: `${checkedIn} of ${total} attendees have checked in to ${eventTitle}`,
      100: `All ${total} attendees have checked in to ${eventTitle}`,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: titles[milestone],
        body: bodies[milestone],
        data: {
          type: milestone === 50 ? NotificationType.MILESTONE_50 : NotificationType.MILESTONE_100,
          eventId,
          screen: 'event-stats',
        },
        sound: 'default',
      },
      trigger: null,
    });
  }

  /**
   * Send low check-in alert
   */
  async sendLowCheckInAlert(checkInRate: number, eventTitle: string, eventId: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled || !settings.checkInUpdates.enabled || !settings.checkInUpdates.lowCheckInAlert) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Low Check-in Rate Alert',
        body: `Only ${checkInRate}% of attendees have checked in to ${eventTitle}. Need help?`,
        data: {
          type: NotificationType.LOW_CHECKIN,
          eventId,
          screen: 'check-in',
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  }

  /**
   * Send backup reminder
   */
  async sendBackupReminder(daysSinceLastBackup: number): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled || !settings.backupReminders.enabled) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to Backup Your Data',
        body: `Last backup was ${daysSinceLastBackup} days ago. Protect your event data now.`,
        data: {
          type: NotificationType.BACKUP_REMINDER,
          screen: 'backup',
        },
        sound: 'default',
      },
      trigger: null,
    });
  }

  /**
   * Cancel all notifications for an event
   */
  async cancelEventNotifications(eventId: string): Promise<void> {
    try {
      const notificationIds = await this.getNotificationIds(eventId);
      for (const id of notificationIds) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      await this.clearNotificationIds(eventId);
    } catch (error) {
      console.error('Error canceling event notifications:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem('scheduled_notifications');
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Save notification ID for an event
   */
  private async saveNotificationId(eventId: string, notificationId: string, type: NotificationType): Promise<void> {
    try {
      const key = `notifications_${eventId}`;
      const existingJson = await AsyncStorage.getItem(key);
      const existing = existingJson ? JSON.parse(existingJson) : [];
      existing.push({ id: notificationId, type });
      await AsyncStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error('Error saving notification ID:', error);
    }
  }

  /**
   * Get notification IDs for an event
   */
  private async getNotificationIds(eventId: string): Promise<string[]> {
    try {
      const key = `notifications_${eventId}`;
      const json = await AsyncStorage.getItem(key);
      if (json) {
        const notifications = JSON.parse(json);
        return notifications.map((n: any) => n.id);
      }
      return [];
    } catch (error) {
      console.error('Error getting notification IDs:', error);
      return [];
    }
  }

  /**
   * Clear notification IDs for an event
   */
  private async clearNotificationIds(eventId: string): Promise<void> {
    try {
      const key = `notifications_${eventId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing notification IDs:', error);
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Open app settings (for when permissions are denied)
   */
  async openSettings(): Promise<void> {
    if (Platform.OS === 'ios') {
      await Notifications.requestPermissionsAsync();
    }
  }
}

export default NotificationService.getInstance();
