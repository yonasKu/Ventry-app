import * as Notifications from 'expo-notifications';
import notifee, { AndroidStyle, AndroidImportance, AndroidVisibility, AndroidCategory } from '@notifee/react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event } from './DatabaseService';
import { showToast } from '../utils/toast';

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
        await this.setupNotifeeChannels();
      }

      // Set up notification response listener
      this.setupNotificationListener();
      this.setupNotifeeListener();

      this.initialized = true;
      console.log('NotificationService initialized with @notifee');
    } catch (error) {
      console.error('Failed to initialize NotificationService:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Request @notifee permissions first (more comprehensive)
      const notifeeSettings = await notifee.requestPermission();
      
      if (notifeeSettings.authorizationStatus >= 1) {
        // Also request Expo permissions for scheduled notifications
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === 'granted') {
          showToast.success('Notifications enabled! You\'ll get event reminders and updates.');
          return true;
        }
      }

      showToast.warning('Notifications disabled. You won\'t receive event reminders.');
      return false;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      showToast.error('Failed to setup notifications');
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
   * Setup @notifee Android notification channels (Rich notifications)
   */
  private async setupNotifeeChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    // Event Reminders Channel (Rich)
    await notifee.createChannel({
      id: 'event_reminders_rich',
      name: 'Event Reminders',
      description: 'Rich notifications about upcoming events',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      lights: true,
      lightColor: NOTIFICATION_COLORS.primary,
    });

    // Check-in Updates Channel (Rich)
    await notifee.createChannel({
      id: 'checkin_updates_rich',
      name: 'Check-in Updates',
      description: 'Real-time check-in notifications with actions',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
      vibration: true,
      lights: true,
      lightColor: NOTIFICATION_COLORS.success,
    });

    // Milestones Channel (Rich)
    await notifee.createChannel({
      id: 'milestones_rich',
      name: 'Event Milestones',
      description: 'Celebration notifications for event achievements',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      lights: true,
      lightColor: NOTIFICATION_COLORS.accent,
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
   * Setup @notifee notification listener
   */
  private setupNotifeeListener(): void {
    // Handle notification press
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === notifee.EventType.PRESS) {
        console.log('Rich notification pressed:', detail.notification?.data);
        // Handle navigation based on notification data
      }
      
      if (type === notifee.EventType.ACTION_PRESS) {
        console.log('Rich notification action pressed:', detail.pressAction?.id);
        this.handleNotificationAction(detail.pressAction?.id, detail.notification?.data);
      }
    });

    // Handle background events
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === notifee.EventType.ACTION_PRESS) {
        console.log('Background action pressed:', detail.pressAction?.id);
        await this.handleNotificationAction(detail.pressAction?.id, detail.notification?.data);
      }
    });
  }

  /**
   * Handle notification action presses
   */
  private async handleNotificationAction(actionId?: string, data?: any): Promise<void> {
    if (!actionId) return;

    switch (actionId) {
      case 'view_event':
        console.log('Navigate to event:', data?.eventId);
        break;
      case 'start_checkin':
        console.log('Navigate to check-in:', data?.eventId);
        break;
      case 'view_stats':
        console.log('Navigate to stats:', data?.eventId);
        break;
      case 'dismiss':
        // Just dismiss the notification
        break;
      default:
        console.log('Unknown action:', actionId);
    }
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
   * Send rich event reminder notification (1 hour before)
   */
  async sendRichEventReminder(event: Event): Promise<void> {
    try {
      const attendeeText = event.attendees_count 
        ? `${event.attendees_count} attendees registered`
        : 'Ready for attendees';

      await notifee.displayNotification({
        title: `🎉 ${event.title} starts in 1 hour!`,
        body: `Get ready to welcome your attendees. ${attendeeText}.`,
        data: {
          eventId: event.id,
          type: 'event_reminder_rich',
          screen: 'event-detail',
        },
        android: {
          channelId: 'event_reminders_rich',
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.EVENT,
          visibility: AndroidVisibility.PUBLIC,
          smallIcon: 'ic_notification',
          color: NOTIFICATION_COLORS.primary,
          actions: [
            {
              title: '👀 View Event',
              pressAction: {
                id: 'view_event',
                mainComponent: 'default',
              },
            },
            {
              title: '✅ Start Check-in',
              pressAction: {
                id: 'start_checkin',
                mainComponent: 'default',
              },
            },
          ],
          style: {
            type: AndroidStyle.BIGTEXT,
            text: `📅 Time: ${event.time}\n📍 Location: ${event.location || 'TBA'}\n👥 Expected: ${event.attendees_count || 0} attendees\n\nTap "Start Check-in" to begin welcoming attendees!`,
          },
        },
        ios: {
          categoryId: 'event_reminders',
          sound: 'default',
        },
      });

      showToast.success(`Event reminder sent for ${event.title}`);
    } catch (error) {
      console.error('Error sending rich event reminder:', error);
      showToast.error('Failed to send event reminder');
    }
  }

  /**
   * Send first check-in notification
   */
  async sendFirstCheckInNotification(attendeeName: string, eventTitle: string, eventId: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled || !settings.checkInUpdates.enabled || !settings.checkInUpdates.firstCheckIn) {
      return;
    }

    // Send rich notification with @notifee
    await this.sendRichCheckInNotification(
      'First Attendee Checked In! 🎉',
      `${attendeeName} just checked in to ${eventTitle}`,
      eventId,
      'first_checkin'
    );
  }

  /**
   * Send rich check-in notification with actions
   */
  async sendRichCheckInNotification(
    title: string,
    body: string,
    eventId: string,
    type: string
  ): Promise<void> {
    try {
      await notifee.displayNotification({
        title,
        body,
        data: {
          eventId,
          type,
          screen: 'event-stats',
        },
        android: {
          channelId: 'checkin_updates_rich',
          importance: AndroidImportance.DEFAULT,
          category: AndroidCategory.EVENT,
          visibility: AndroidVisibility.PUBLIC,
          smallIcon: 'ic_notification',
          color: NOTIFICATION_COLORS.success,
          actions: [
            {
              title: '📊 View Stats',
              pressAction: {
                id: 'view_stats',
                mainComponent: 'default',
              },
            },
            {
              title: '👥 Check-in More',
              pressAction: {
                id: 'start_checkin',
                mainComponent: 'default',
              },
            },
          ],
          style: {
            type: AndroidStyle.BIGTEXT,
            text: body,
          },
        },
        ios: {
          categoryId: 'checkin_updates',
          sound: 'default',
        },
      });
    } catch (error) {
      console.error('Error sending rich check-in notification:', error);
      // Fallback to basic notification
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null,
      });
    }
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
      50: 'Halfway There! 🎯',
      100: 'Perfect Attendance! 🏆',
    };

    const bodies = {
      50: `${checkedIn} of ${total} attendees have checked in to ${eventTitle}`,
      100: `All ${total} attendees have checked in to ${eventTitle}! Amazing!`,
    };

    // Send rich milestone notification
    await this.sendRichMilestoneNotification(
      titles[milestone],
      bodies[milestone],
      eventId,
      milestone,
      checkedIn,
      total
    );
  }

  /**
   * Send rich milestone notification with celebration
   */
  async sendRichMilestoneNotification(
    title: string,
    body: string,
    eventId: string,
    milestone: 50 | 100,
    checkedIn: number,
    total: number
  ): Promise<void> {
    try {
      const percentage = Math.round((checkedIn / total) * 100);
      const progressText = `Progress: ${checkedIn}/${total} attendees (${percentage}%)`;

      await notifee.displayNotification({
        title,
        body,
        data: {
          eventId,
          type: `milestone_${milestone}`,
          screen: 'event-stats',
        },
        android: {
          channelId: 'milestones_rich',
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.EVENT,
          visibility: AndroidVisibility.PUBLIC,
          smallIcon: 'ic_notification',
          color: milestone === 100 ? NOTIFICATION_COLORS.accent : NOTIFICATION_COLORS.success,
          actions: [
            {
              title: '📊 View Full Stats',
              pressAction: {
                id: 'view_stats',
                mainComponent: 'default',
              },
            },
            {
              title: '🎉 Share Achievement',
              pressAction: {
                id: 'share_milestone',
                mainComponent: 'default',
              },
            },
          ],
          style: {
            type: AndroidStyle.BIGTEXT,
            text: `${body}\n\n${progressText}`,
          },
          progress: {
            max: total,
            current: checkedIn,
            indeterminate: false,
          },
        },
        ios: {
          categoryId: 'milestones',
          sound: 'default',
        },
      });
    } catch (error) {
      console.error('Error sending rich milestone notification:', error);
      // Fallback to basic notification
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null,
      });
    }
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
