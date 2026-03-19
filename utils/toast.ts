/**
 * Toast Notification Utility
 * 
 * Wrapper around sonner-native for easy toast notifications
 * Usage:
 *   import { showToast } from '@/utils/toast';
 *   showToast.success('Event created!');
 *   showToast.error('Failed to save');
 */

import { toast } from 'sonner-native';

export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, { description });
  },

  error: (message: string, description?: string) => {
    toast.error(message, { description });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, { description });
  },

  info: (message: string, description?: string) => {
    toast.info(message, { description });
  },

  // For async operations with loading state
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },
};

// Re-export toast for advanced usage
export { toast };
