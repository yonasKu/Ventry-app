/**
 * Utility functions for consistent error handling and user-friendly error messages
 */

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  details?: any;
}

/**
 * Error codes for different types of errors
 */
export enum ErrorCode {
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_NOT_INITIALIZED = 'DATABASE_NOT_INITIALIZED',
  DATABASE_QUERY_FAILED = 'DATABASE_QUERY_FAILED',
  
  // Event errors
  EVENT_NOT_FOUND = 'EVENT_NOT_FOUND',
  EVENT_CREATE_FAILED = 'EVENT_CREATE_FAILED',
  EVENT_UPDATE_FAILED = 'EVENT_UPDATE_FAILED',
  EVENT_DELETE_FAILED = 'EVENT_DELETE_FAILED',
  
  // Attendee errors
  ATTENDEE_NOT_FOUND = 'ATTENDEE_NOT_FOUND',
  ATTENDEE_CREATE_FAILED = 'ATTENDEE_CREATE_FAILED',
  ATTENDEE_UPDATE_FAILED = 'ATTENDEE_UPDATE_FAILED',
  ATTENDEE_DELETE_FAILED = 'ATTENDEE_DELETE_FAILED',
  ATTENDEE_CHECKIN_FAILED = 'ATTENDEE_CHECKIN_FAILED',
  
  // Import/Export errors
  IMPORT_FAILED = 'IMPORT_FAILED',
  EXPORT_FAILED = 'EXPORT_FAILED',
  INVALID_CSV_FORMAT = 'INVALID_CSV_FORMAT',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  
  // Camera/QR errors
  CAMERA_PERMISSION_DENIED = 'CAMERA_PERMISSION_DENIED',
  QR_SCAN_FAILED = 'QR_SCAN_FAILED',
  INVALID_QR_CODE = 'INVALID_QR_CODE',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PHONE = 'INVALID_PHONE',
  INVALID_DATE = 'INVALID_DATE',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
}

/**
 * User-friendly error messages for each error code
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Database errors
  [ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again.',
  [ErrorCode.DATABASE_NOT_INITIALIZED]: 'The database is not ready. Please restart the app.',
  [ErrorCode.DATABASE_QUERY_FAILED]: 'Failed to retrieve data. Please try again.',
  
  // Event errors
  [ErrorCode.EVENT_NOT_FOUND]: 'Event not found. It may have been deleted.',
  [ErrorCode.EVENT_CREATE_FAILED]: 'Failed to create event. Please check your input and try again.',
  [ErrorCode.EVENT_UPDATE_FAILED]: 'Failed to update event. Please try again.',
  [ErrorCode.EVENT_DELETE_FAILED]: 'Failed to delete event. Please try again.',
  
  // Attendee errors
  [ErrorCode.ATTENDEE_NOT_FOUND]: 'Attendee not found. They may have been removed.',
  [ErrorCode.ATTENDEE_CREATE_FAILED]: 'Failed to add attendee. Please check your input and try again.',
  [ErrorCode.ATTENDEE_UPDATE_FAILED]: 'Failed to update attendee. Please try again.',
  [ErrorCode.ATTENDEE_DELETE_FAILED]: 'Failed to remove attendee. Please try again.',
  [ErrorCode.ATTENDEE_CHECKIN_FAILED]: 'Failed to update check-in status. Please try again.',
  
  // Import/Export errors
  [ErrorCode.IMPORT_FAILED]: 'Failed to import data. Please check the file format.',
  [ErrorCode.EXPORT_FAILED]: 'Failed to export data. Please try again.',
  [ErrorCode.INVALID_CSV_FORMAT]: 'Invalid CSV format. Please check the file and try again.',
  [ErrorCode.FILE_READ_ERROR]: 'Failed to read file. Please check file permissions.',
  [ErrorCode.FILE_WRITE_ERROR]: 'Failed to save file. Please check storage permissions.',
  
  // Camera/QR errors
  [ErrorCode.CAMERA_PERMISSION_DENIED]: 'Camera permission is required to scan QR codes. Please enable it in settings.',
  [ErrorCode.QR_SCAN_FAILED]: 'Failed to scan QR code. Please try again.',
  [ErrorCode.INVALID_QR_CODE]: 'Invalid QR code. Please scan a valid event QR code.',
  
  // Network errors
  [ErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection.',
  [ErrorCode.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
  
  // Validation errors
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCode.REQUIRED_FIELD_MISSING]: 'Please fill in all required fields.',
  [ErrorCode.INVALID_EMAIL]: 'Please enter a valid email address.',
  [ErrorCode.INVALID_PHONE]: 'Please enter a valid phone number.',
  [ErrorCode.INVALID_DATE]: 'Please enter a valid date.',
  
  // Generic errors
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  [ErrorCode.OPERATION_CANCELLED]: 'Operation cancelled.',
};

/**
 * Create an AppError from an error code
 */
export function createError(code: ErrorCode, details?: any): AppError {
  return {
    code,
    message: code,
    userMessage: ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR],
    details,
  };
}

/**
 * Convert a generic error to an AppError
 */
export function toAppError(error: any): AppError {
  // If it's already an AppError, return it
  if (error && typeof error === 'object' && 'code' in error && 'userMessage' in error) {
    return error as AppError;
  }
  
  // If it's a standard Error object
  if (error instanceof Error) {
    // Try to map common error messages to error codes
    const message = error.message.toLowerCase();
    
    if (message.includes('not found')) {
      return createError(ErrorCode.EVENT_NOT_FOUND, error);
    }
    if (message.includes('database')) {
      return createError(ErrorCode.DATABASE_ERROR, error);
    }
    if (message.includes('network') || message.includes('fetch')) {
      return createError(ErrorCode.NETWORK_ERROR, error);
    }
    if (message.includes('timeout')) {
      return createError(ErrorCode.TIMEOUT_ERROR, error);
    }
    if (message.includes('permission')) {
      return createError(ErrorCode.CAMERA_PERMISSION_DENIED, error);
    }
    
    // Default to unknown error
    return createError(ErrorCode.UNKNOWN_ERROR, error);
  }
  
  // For any other type of error
  return createError(ErrorCode.UNKNOWN_ERROR, error);
}

/**
 * Get a user-friendly error message from any error
 */
export function getUserMessage(error: any): string {
  const appError = toAppError(error);
  return appError.userMessage;
}

/**
 * Log an error with context
 */
export function logError(error: any, context?: string): void {
  const appError = toAppError(error);
  
  console.error(`[${context || 'Error'}]`, {
    code: appError.code,
    message: appError.message,
    userMessage: appError.userMessage,
    details: appError.details,
  });
}

/**
 * Handle an error by logging it and returning a user-friendly message
 */
export function handleError(error: any, context?: string): string {
  logError(error, context);
  return getUserMessage(error);
}

/**
 * Validate required fields
 */
export function validateRequired(fields: Record<string, any>): AppError | null {
  const missingFields = Object.entries(fields)
    .filter(([_, value]) => !value || (typeof value === 'string' && value.trim() === ''))
    .map(([key]) => key);
  
  if (missingFields.length > 0) {
    return createError(ErrorCode.REQUIRED_FIELD_MISSING, { missingFields });
  }
  
  return null;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): AppError | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return createError(ErrorCode.INVALID_EMAIL, { email });
  }
  
  return null;
}

/**
 * Validate phone format (basic validation)
 */
export function validatePhone(phone: string): AppError | null {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if it has at least 10 digits
  if (digitsOnly.length < 10) {
    return createError(ErrorCode.INVALID_PHONE, { phone });
  }
  
  return null;
}

/**
 * Validate date format
 */
export function validateDate(date: string): AppError | null {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return createError(ErrorCode.INVALID_DATE, { date });
  }
  
  return null;
}
