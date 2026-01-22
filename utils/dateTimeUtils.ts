import { format, parseISO, isValid } from 'date-fns';

/**
 * Utility functions for consistent date/time formatting across the app
 */

/**
 * Format a date string to a readable format
 * @param dateString - ISO date string or Date object
 * @param formatString - Optional format string (default: 'MMM dd, yyyy')
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date, formatString: string = 'MMM dd, yyyy'): string {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    
    if (!isValid(date)) {
      console.warn('Invalid date provided to formatDate:', dateString);
      return 'Invalid date';
    }
    
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format a date string to a long readable format
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string (e.g., "Monday, January 22, 2026")
 */
export function formatDateLong(dateString: string | Date): string {
  return formatDate(dateString, 'EEEE, MMMM dd, yyyy');
}

/**
 * Format a date string to a short format
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string (e.g., "01/22/26")
 */
export function formatDateShort(dateString: string | Date): string {
  return formatDate(dateString, 'MM/dd/yy');
}

/**
 * Format a time string (HH:MM:SS) to 12-hour format
 * @param timeString - Time string in HH:MM:SS format
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatTime(timeString: string): string {
  try {
    // Parse time string (HH:MM:SS or HH:MM)
    const parts = timeString.split(':');
    if (parts.length < 2) {
      console.warn('Invalid time format:', timeString);
      return 'Invalid time';
    }
    
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn('Invalid time values:', timeString);
      return 'Invalid time';
    }
    
    // Create a date object with the time
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    
    return format(date, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
}

/**
 * Format a date and time together
 * @param dateString - ISO date string
 * @param timeString - Time string in HH:MM:SS format
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string | Date, timeString: string): string {
  const formattedDate = formatDate(dateString);
  const formattedTime = formatTime(timeString);
  return `${formattedDate} at ${formattedTime}`;
}

/**
 * Format a timestamp to relative time (e.g., "2 hours ago")
 * @param timestamp - ISO timestamp string
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: string | Date): string {
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
    
    if (!isValid(date)) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return formatDate(date);
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid date';
  }
}

/**
 * Convert a date to ISO string for database storage
 * @param date - Date object or date string
 * @returns ISO string
 */
export function toISOString(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      throw new Error('Invalid date');
    }
    
    return dateObj.toISOString();
  } catch (error) {
    console.error('Error converting to ISO string:', error);
    throw error;
  }
}

/**
 * Get current date in YYYY-MM-DD format for date inputs
 * @returns Date string in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get current time in HH:MM format for time inputs
 * @returns Time string in HH:MM format
 */
export function getCurrentTime(): string {
  return format(new Date(), 'HH:mm');
}

/**
 * Check if a date is today
 * @param dateString - ISO date string
 * @returns True if the date is today
 */
export function isToday(dateString: string | Date): boolean {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    const today = new Date();
    
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    return false;
  }
}

/**
 * Check if a date is in the past
 * @param dateString - ISO date string
 * @returns True if the date is in the past
 */
export function isPast(dateString: string | Date): boolean {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    const now = new Date();
    
    return date < now;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a date is in the future
 * @param dateString - ISO date string
 * @returns True if the date is in the future
 */
export function isFuture(dateString: string | Date): boolean {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    const now = new Date();
    
    return date > now;
  } catch (error) {
    return false;
  }
}
