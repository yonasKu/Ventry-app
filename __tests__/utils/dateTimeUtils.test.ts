/**
 * dateTimeUtils Tests
 * 
 * Tests date and time formatting, parsing, and validation utilities.
 */

import {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  parseDate,
  parseTime,
  isValidDate,
  isValidTime,
  getDateDaysAgo,
  getDateDaysFromNow,
  isSameDay,
  isToday,
  isFuture,
  isPast,
  getDaysDifference,
} from '../../utils/dateTimeUtils';

describe('dateTimeUtils - Formatting', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2026-02-20T10:00:00Z');
      
      const result = formatDate(date);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('2026');
    });

    it('should handle ISO string input', () => {
      const result = formatDate('2026-02-20T10:00:00Z');

      expect(result).toBeDefined();
      expect(result).toContain('2026');
    });

    it('should handle date string input', () => {
      const result = formatDate('2026-02-20');

      expect(result).toBeDefined();
    });

    it('should return "Invalid date" for invalid date', () => {
      const result = formatDate('invalid-date');

      expect(result).toBe('Invalid date');
    });

    it('should return "Invalid date" for null input', () => {
      const result = formatDate(null as any);

      expect(result).toBe('Invalid date');
    });

    it('should return "Invalid date" for undefined input', () => {
      const result = formatDate(undefined as any);

      expect(result).toBe('Invalid date');
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2026-02-20T14:30:00Z');
      
      const result = formatTime(date);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle ISO string input', () => {
      const result = formatTime('2026-02-20T14:30:00Z');

      expect(result).toBeDefined();
    });

    it('should return "Invalid time" for invalid time', () => {
      const result = formatTime('invalid-time');

      expect(result).toBe('Invalid time');
    });

    it('should format 24-hour time', () => {
      const date = new Date('2026-02-20T23:45:00Z');
      
      const result = formatTime(date);

      expect(result).toBeDefined();
    });

    it('should format midnight correctly', () => {
      const date = new Date('2026-02-20T00:00:00Z');
      
      const result = formatTime(date);

      expect(result).toBeDefined();
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time together', () => {
      const date = new Date('2026-02-20T14:30:00Z');
      
      const result = formatDateTime(date);

      expect(result).toBeDefined();
      expect(result).toContain('2026');
    });

    it('should handle ISO string input', () => {
      const result = formatDateTime('2026-02-20T14:30:00Z');

      expect(result).toBeDefined();
    });

    it('should return "Invalid date" for invalid datetime', () => {
      const result = formatDateTime('invalid', '10:00:00');

      expect(result).toContain('Invalid');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format "just now" for recent time', () => {
      const now = new Date();
      
      const result = formatRelativeTime(now);

      expect(result).toBe('Just now'); // Capital J
    });

    it('should format minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const result = formatRelativeTime(fiveMinutesAgo);

      expect(result).toContain('minute');
    });

    it('should format hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      
      const result = formatRelativeTime(twoHoursAgo);

      expect(result).toContain('hour');
    });

    it('should format days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      
      const result = formatRelativeTime(threeDaysAgo);

      expect(result).toContain('day');
    });

    it('should format future time', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const result = formatRelativeTime(tomorrow);

      expect(result).toBeDefined();
    });

    it('should return "Invalid date" for invalid date', () => {
      const result = formatRelativeTime('invalid');

      expect(result).toBe('Invalid date');
    });
  });
});

describe('dateTimeUtils - Parsing', () => {
  describe('parseDate', () => {
    it('should parse ISO date string', () => {
      const result = parseDate('2026-02-20');

      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2026);
    });

    it('should parse ISO datetime string', () => {
      const result = parseDate('2026-02-20T10:00:00Z');

      expect(result).toBeInstanceOf(Date);
    });

    it('should return null for invalid date', () => {
      const result = parseDate('invalid-date');

      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseDate('');

      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      const result = parseDate(null);

      expect(result).toBeNull();
    });
  });

  describe('parseTime', () => {
    it('should parse time string', () => {
      const result = parseTime('14:30');

      expect(result).toBeDefined();
    });

    it('should parse time with seconds', () => {
      const result = parseTime('14:30:45');

      expect(result).toBeDefined();
    });

    it('should return null for invalid time', () => {
      const result = parseTime('invalid');

      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseTime('');

      expect(result).toBeNull();
    });
  });
});

describe('dateTimeUtils - Validation', () => {
  describe('isValidDate', () => {
    it('should validate correct date', () => {
      expect(isValidDate('2026-02-20')).toBe(true);
    });

    it('should validate ISO datetime', () => {
      expect(isValidDate('2026-02-20T10:00:00Z')).toBe(true);
    });

    it('should reject invalid date', () => {
      expect(isValidDate('invalid-date')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidDate('')).toBe(false);
    });

    it('should reject null', () => {
      expect(isValidDate(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidDate(undefined)).toBe(false);
    });

    it('should validate Date object', () => {
      expect(isValidDate(new Date())).toBe(true);
    });

    it('should reject invalid Date object', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
    });
  });

  describe('isValidTime', () => {
    it('should validate correct time', () => {
      expect(isValidTime('14:30')).toBe(true);
    });

    it('should validate time with seconds', () => {
      expect(isValidTime('14:30:45')).toBe(true);
    });

    it('should validate midnight', () => {
      expect(isValidTime('00:00')).toBe(true);
    });

    it('should validate 23:59', () => {
      expect(isValidTime('23:59')).toBe(true);
    });

    it('should reject invalid time', () => {
      expect(isValidTime('25:00')).toBe(false);
    });

    it('should reject invalid format', () => {
      expect(isValidTime('14-30')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidTime('')).toBe(false);
    });
  });
});

describe('dateTimeUtils - Date Calculations', () => {
  describe('getDateDaysAgo', () => {
    it('should get date 7 days ago', () => {
      const result = getDateDaysAgo(7);

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeLessThan(Date.now());
    });

    it('should get yesterday', () => {
      const result = getDateDaysAgo(1);

      expect(result).toBeInstanceOf(Date);
    });

    it('should handle 0 days (today)', () => {
      const result = getDateDaysAgo(0);
      const today = new Date();

      expect(result.getDate()).toBe(today.getDate());
    });

    it('should handle negative days', () => {
      const result = getDateDaysAgo(-1);

      expect(result.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('getDateDaysFromNow', () => {
    it('should get date 7 days from now', () => {
      const result = getDateDaysFromNow(7);

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(Date.now());
    });

    it('should get tomorrow', () => {
      const result = getDateDaysFromNow(1);

      expect(result).toBeInstanceOf(Date);
    });

    it('should handle 0 days (today)', () => {
      const result = getDateDaysFromNow(0);
      const today = new Date();

      expect(result.getDate()).toBe(today.getDate());
    });
  });

  describe('getDaysDifference', () => {
    it('should calculate days between dates', () => {
      const date1 = new Date('2026-02-20');
      const date2 = new Date('2026-02-27');

      const result = getDaysDifference(date1, date2);

      expect(result).toBe(7);
    });

    it('should handle negative difference', () => {
      const date1 = new Date('2026-02-27');
      const date2 = new Date('2026-02-20');

      const result = getDaysDifference(date1, date2);

      expect(result).toBe(-7);
    });

    it('should return 0 for same date', () => {
      const date = new Date('2026-02-20');

      const result = getDaysDifference(date, date);

      expect(result).toBe(0);
    });

    it('should handle ISO strings', () => {
      const result = getDaysDifference('2026-02-20', '2026-02-27');

      expect(result).toBe(7);
    });
  });
});

describe('dateTimeUtils - Date Comparisons', () => {
  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();

      expect(isToday(today)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      expect(isToday(tomorrow)).toBe(false);
    });

    it('should handle ISO string', () => {
      const todayString = new Date().toISOString().split('T')[0];

      expect(isToday(todayString)).toBe(true);
    });
  });

  describe('isFuture', () => {
    it('should return true for future date', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      expect(isFuture(tomorrow)).toBe(true);
    });

    it('should return false for past date', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      expect(isFuture(yesterday)).toBe(false);
    });

    it('should return false for now', () => {
      const now = new Date();

      expect(isFuture(now)).toBe(false);
    });

    it('should handle ISO string', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      expect(isFuture(futureDate)).toBe(true);
    });
  });

  describe('isPast', () => {
    it('should return true for past date', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      expect(isPast(yesterday)).toBe(true);
    });

    it('should return false for future date', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      expect(isPast(tomorrow)).toBe(false);
    });

    it('should return false for now', () => {
      const now = new Date();

      expect(isPast(now)).toBe(false);
    });

    it('should handle ISO string', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      expect(isPast(pastDate)).toBe(true);
    });
  });
});

describe('dateTimeUtils - Edge Cases', () => {
  it('should handle leap year dates', () => {
    const leapDay = new Date('2024-02-29');

    expect(formatDate(leapDay)).toContain('2024');
  });

  it('should handle year boundaries', () => {
    const newYear = new Date('2026-01-01T00:00:00Z');

    expect(formatDate(newYear)).toContain('2026');
  });

  it('should handle very old dates', () => {
    const oldDate = new Date('1900-01-01');

    expect(formatDate(oldDate)).toContain('1900');
  });

  it('should handle far future dates', () => {
    const futureDate = new Date('2100-12-31');

    expect(formatDate(futureDate)).toContain('2100');
  });

  it('should handle timezone differences', () => {
    const utcDate = new Date('2026-02-20T00:00:00Z');
    const localDate = new Date('2026-02-20T00:00:00');

    expect(formatDate(utcDate)).toBeDefined();
    expect(formatDate(localDate)).toBeDefined();
  });
});
