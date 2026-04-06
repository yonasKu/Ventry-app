import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  interpolateColor,
  useDerivedValue,
} from 'react-native-reanimated';
import { CheckCircle, ArrowRight, ArrowLeft } from 'phosphor-react-native';
import { useTheme } from '../context/ThemeContext';
import { Attendee } from '../models/Attendee';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const SWIPE_THRESHOLD = 80;

// Haptic feedback options
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false
};

interface SlideToCheckInProps {
  attendee: Attendee;
  onCheckIn: (attendeeId: string) => void;
  onUncheckIn: (attendeeId: string) => void;
  onTap?: (attendeeId: string) => void; // New prop for tap navigation
}

export default function SlideToCheckIn({ attendee, onCheckIn, onUncheckIn, onTap }: SlideToCheckInProps) {
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(70);
  const scale = useSharedValue(1);
  const slideProgress = useSharedValue(0);
  const direction = useSharedValue(0); // 1 for right, -1 for left, 0 for neutral

  // Derived values for visual feedback
  const progressColor = useDerivedValue(() => {
    // Interpolate color based on slide direction
    return direction.value > 0 
      ? interpolateColor(
          slideProgress.value,
          [0, 1],
          [theme.colors.backgroundPrimary, `${theme.colors.success}20`]
        )
      : direction.value < 0
        ? interpolateColor(
            slideProgress.value,
            [0, 1],
            [theme.colors.backgroundPrimary, `${theme.colors.error}20`]
          )
        : theme.colors.backgroundPrimary;
  });

  // Trigger haptic feedback functions
  const triggerCheckInHaptic = () => {
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
  };

  const triggerErrorHaptic = () => {
    ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
  };

  const triggerProgressHaptic = () => {
    if (Platform.OS === 'ios') { // More gentle feedback only on iOS
      ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
    }
  };

  // Handle uncheck-in with animation and haptic
  const handleUncheckIn = () => {
    'worklet';
    // Visual feedback - subtle shake
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    
    // Haptic feedback
    runOnJS(triggerErrorHaptic)();
    
    // Callback
    runOnJS(onUncheckIn)(attendee.id);
  };

  // Handle successful check-in with animation and haptic
  const handleSuccessfulCheckIn = () => {
    'worklet';
    // Visual feedback - pulse animation
    scale.value = withSequence(
      withTiming(1.05, { duration: 100 }),
      withTiming(1, { duration: 200 })
    );
    
    // Haptic feedback
    runOnJS(triggerCheckInHaptic)();
    
    // Callback
    runOnJS(onCheckIn)(attendee.id);
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      // Reset values on start
      direction.value = 0;
      slideProgress.value = 0;
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      
      // Update direction value
      if (event.translationX > 0) {
        direction.value = 1;
      } else if (event.translationX < 0) {
        direction.value = -1;
      }
      
      // Calculate progress percentage (0-1)
      const progress = Math.min(Math.abs(event.translationX) / SWIPE_THRESHOLD, 1);
      
      // Only trigger haptic if crossing certain thresholds (25%, 50%, 75%)
      if (progress > 0.25 && slideProgress.value <= 0.25) {
        runOnJS(triggerProgressHaptic)();
      } else if (progress > 0.5 && slideProgress.value <= 0.5) {
        runOnJS(triggerProgressHaptic)();
      } else if (progress > 0.75 && slideProgress.value <= 0.75) {
        runOnJS(triggerProgressHaptic)();
      }
      
      slideProgress.value = progress;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Check in - right swipe
        handleSuccessfulCheckIn();
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Uncheck - left swipe
        handleUncheckIn();
      }
      
      // Use spring physics for smoother return animation
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 200
      });
      
      // Reset values after animation
      slideProgress.value = withTiming(0);
      direction.value = withTiming(0);
    });

  // Add tap gesture for navigation to details
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      // Navigate to attendee details instead of immediate check-in
      if (onTap) {
        runOnJS(onTap)(attendee.id);
      }
    });

  // Combine gestures - tap or pan
  const combinedGesture = Gesture.Race(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value }
    ],
    height: itemHeight.value,
    backgroundColor: progressColor.value,
  }));
  
  // Progress indicator styles
  const progressIndicatorStyle = useAnimatedStyle(() => {
    return {
      width: `${slideProgress.value * 100}%`,
      backgroundColor: direction.value > 0 
        ? theme.colors.success
        : direction.value < 0 
          ? theme.colors.error 
          : 'transparent',
      opacity: slideProgress.value
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {/* Background with visible action indicators */}
      <View style={[styles.backgroundContainer]}>
        <View style={[styles.leftAction, { backgroundColor: theme.colors.error + '20' }]}>
          <ArrowLeft size={20} color={theme.colors.error} weight="bold" />
          <Text style={[styles.actionText, { color: theme.colors.error }]}>Uncheck</Text>
        </View>
        
        <View style={[styles.rightAction, { backgroundColor: theme.colors.success + '20' }]}>
          <Text style={[styles.actionText, { color: theme.colors.success }]}>Check In</Text>
          <ArrowRight size={20} color={theme.colors.success} weight="bold" />
        </View>
      </View>
      
      <GestureDetector gesture={combinedGesture}>
        <Animated.View 
          style={[styles.attendeeCard, animatedStyle, { backgroundColor: theme.colors.backgroundPrimary }]}
          accessible={true}
          accessibilityLabel={attendee.checked_in 
            ? `${attendee.name} is checked in. Tap for details, swipe left to uncheck.` 
            : `${attendee.name} is not checked in. Tap for details, swipe right to check in.`}
          accessibilityHint="Tap to view details, swipe right to check in, left to uncheck"
        >
          {/* Progress indicator at bottom of card */}
          <Animated.View style={[styles.progressIndicator, progressIndicatorStyle]} />
          
          {/* Swipe hint overlay - shows on first render */}
          {!attendee.checked_in && (
            <View style={[styles.swipeHint, { backgroundColor: theme.colors.primary + '15' }]}>
              <ArrowRight size={16} color={theme.colors.primary} weight="bold" />
              <Text style={[styles.swipeHintText, { color: theme.colors.primary }]}>
                Tap for details, swipe to check in
              </Text>
            </View>
          )}
          
          <View style={styles.attendeeInfo}>
            <Text style={[styles.attendeeName, { color: theme.colors.textPrimary }]}>{attendee.name}</Text>
            {attendee.email && (
              <Text style={[styles.attendeeEmail, { color: theme.colors.textSecondary }]}>{attendee.email}</Text>
            )}
          </View>
          
          <View style={styles.statusContainer}>
            {attendee.checked_in ? (
              <View style={[styles.checkedInBadge, { backgroundColor: theme.colors.success + '20' }]}>
                <CheckCircle size={20} color={theme.colors.success} weight="fill" />
                <Text style={[styles.checkedInText, { color: theme.colors.success }]}>Checked In</Text>
              </View>
            ) : (
              <View style={[styles.notCheckedBadge, { backgroundColor: theme.colors.border }]}>
                <View style={[styles.statusIndicator, { borderColor: theme.colors.textSecondary }]} />
                <Text style={[styles.notCheckedText, { color: theme.colors.textSecondary }]}>Not Checked</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 20,
    height: '100%',
  },
  rightAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 20,
    height: '100%',
  },
  attendeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 80,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  attendeeEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusContainer: {
    marginLeft: 12,
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  checkedInText: {
    fontSize: 13,
    fontWeight: '600',
  },
  notCheckedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  notCheckedText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  actionText: {
    fontWeight: '600',
    marginHorizontal: 6,
    fontSize: 14,
  },
  progressIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    borderRadius: 1.5,
  },
  swipeHint: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  swipeHintText: {
    fontSize: 11,
    fontWeight: '600',
  },
}); 