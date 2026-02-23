import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface EventCountdownProps {
  eventDate: string; // ISO date string
  eventTime: string; // HH:MM:SS format
}

export default function EventCountdown({ eventDate, eventTime }: EventCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [shouldShow, setShouldShow] = useState(true);

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Parse event date and time
      const [hours, minutes, seconds] = eventTime.split(':').map(Number);
      const eventDateTime = new Date(eventDate);
      eventDateTime.setHours(hours, minutes, seconds || 0);

      const now = new Date();
      const difference = eventDateTime.getTime() - now.getTime();

      if (difference < 0) {
        // Event has started or passed - hide countdown
        setShouldShow(false);
        return;
      }

      // Event is upcoming - show countdown
      setShouldShow(true);
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [eventDate, eventTime]);

  // Don't render anything if event has started
  if (!shouldShow) {
    return null;
  }

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Starts in</Text>
      
      <View style={styles.timerContainer}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeNumber}>{formatNumber(timeLeft.days)}</Text>
          <Text style={styles.timeLabel}>d</Text>
        </View>

        <Text style={styles.separator}>:</Text>

        <View style={styles.timeBlock}>
          <Text style={styles.timeNumber}>{formatNumber(timeLeft.hours)}</Text>
          <Text style={styles.timeLabel}>h</Text>
        </View>

        <Text style={styles.separator}>:</Text>

        <View style={styles.timeBlock}>
          <Text style={styles.timeNumber}>{formatNumber(timeLeft.minutes)}</Text>
          <Text style={styles.timeLabel}>m</Text>
        </View>

        <Text style={styles.separator}>:</Text>

        <View style={styles.timeBlock}>
          <Text style={styles.timeNumber}>{formatNumber(timeLeft.seconds)}</Text>
          <Text style={styles.timeLabel}>s</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginRight: 12,
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timeNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  timeLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 2,
  },
  separator: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.6)',
    marginHorizontal: 6,
  },
});
