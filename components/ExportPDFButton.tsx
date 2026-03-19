import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View
} from 'react-native';
import { FileText } from 'phosphor-react-native';
import { useTheme } from '@/context/ThemeContext';
import PDFService from '@/services/PDFService';
import { showToast } from '@/utils/toast';

interface ExportPDFButtonProps {
  type: 'statistics' | 'event';
  eventId?: string;
  timeFilter?: 'week' | 'month' | 'year' | 'all';
  onSuccess?: (filePath: string) => void;
  onError?: (error: string) => void;
  variant?: 'primary' | 'secondary' | 'icon';
}

const ExportPDFButton: React.FC<ExportPDFButtonProps> = ({
  type,
  eventId,
  timeFilter = 'month',
  onSuccess,
  onError,
  variant = 'primary'
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    
    try {
      let filePath: string;
      
      if (type === 'statistics') {
        filePath = await PDFService.generateStatisticsReport(timeFilter);
      } else if (type === 'event') {
        if (!eventId) {
          throw new Error('Event ID is required for event reports');
        }
        filePath = await PDFService.generateEventReport(eventId);
      } else {
        throw new Error('Invalid export type');
      }
      
      // Share the PDF
      await PDFService.sharePDF(filePath);
      
      // Show success toast
      showToast.success('PDF report generated and ready to share!');
      
      // Call success callback
      onSuccess?.(filePath);
      
    } catch (error: any) {
      console.error('PDF export error:', error);
      
      // Determine error message
      let errorMessage = 'Failed to generate PDF report. Please try again.';
      
      if (error.message.includes('storage')) {
        errorMessage = 'Insufficient storage space. Please free up space and try again.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Unable to save PDF. Please check app permissions.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'Event not found. Please try again.';
      }
      
      // Show error toast
      showToast.error('Export Failed', errorMessage);
      
      // Call error callback
      onError?.(error.message);
      
    } finally {
      setLoading(false);
    }
  };

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <TouchableOpacity
        onPress={handleExport}
        disabled={loading}
        style={[
          styles.iconButton,
          { backgroundColor: theme.colors.backgroundSecondary }
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <FileText size={24} color={theme.colors.primary} weight="regular" />
        )}
      </TouchableOpacity>
    );
  }

  // Secondary variant
  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={handleExport}
        disabled={loading}
        style={[
          styles.secondaryButton,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            borderColor: theme.colors.border
          }
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <FileText size={20} color={theme.colors.primary} weight="regular" />
        )}
        <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
          Export PDF
        </Text>
      </TouchableOpacity>
    );
  }

  // Primary variant (default)
  return (
    <TouchableOpacity
      onPress={handleExport}
      disabled={loading}
      style={[
        styles.primaryButton,
        { backgroundColor: theme.colors.primary },
        loading && styles.disabledButton
      ]}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.loadingText}>Generating PDF...</Text>
        </View>
      ) : (
        <>
          <FileText size={20} color="#FFFFFF" weight="regular" />
          <Text style={styles.primaryButtonText}>Export PDF</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ExportPDFButton;
