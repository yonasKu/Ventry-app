import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  interpolateColor,
  useDerivedValue,
} from 'react-native-reanimated';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft } from 'phosphor-react-native';
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
}

export default function SlideToCheckIn({ attendee, onCheckIn, onUncheckIn }: SlideToCheckInProps) {
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

  // Handle successful check-in with animation and haptic
  const handleSuccessfulCheckIn = () => {
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

  // Handle uncheck-in with animation and haptic
  const handleUncheckIn = () => {
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
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary, marginBottom: 10 }]}>
      {/* Background with action indicators */}
      <View style={[styles.backgroundContainer, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.actionIndicator}>
          <ArrowLeft size={18} color="#FFF" weight="bold" />
          <Text style={styles.actionText}>Uncheck</Text>
        </View>
        
        <View style={styles.actionIndicator}>
          <Text style={styles.actionText}>Check In</Text>
          <ArrowRight size={18} color="#FFF" weight="bold" />
        </View>
      </View>
      
      <GestureDetector gesture={panGesture}>
        <Animated.View 
          style={[styles.attendeeCard, animatedStyle, { backgroundColor: theme.colors.backgroundPrimary }]}
          accessible={true}
          accessibilityLabel={attendee.checked_in 
            ? `${attendee.name} is checked in. Swipe left to uncheck.` 
            : `${attendee.name} is not checked in. Swipe right to check in.`}
          accessibilityHint="Swipe right to check in or left to uncheck"
        >
          {/* Progress indicator at bottom of card */}
          <Animated.View style={[styles.progressIndicator, progressIndicatorStyle]} />
          
          <View style={styles.attendeeInfo}>
            <Text style={[styles.attendeeName, { color: theme.colors.textPrimary }]}>{attendee.name}</Text>
            <Text style={[styles.attendeeEmail, { color: theme.colors.textSecondary }]}>{attendee.email}</Text>
          </View>
          <View>
            {attendee.checked_in ? (
              <CheckCircle size={24} color={theme.colors.success} weight="bold" />
            ) : (
              <View style={[styles.statusIndicator, { borderColor: theme.colors.border }]} />
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
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  attendeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    position: 'relative', // For progress indicator
    overflow: 'hidden',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  attendeeEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  progressIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
  },
}); 