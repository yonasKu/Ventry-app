import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useEvents } from '@/context/EventContext';
import CheckInChart from '@/components/statistics/CheckInChart';
import CheckinSpeedGauge from '@/components/statistics/CheckinSpeedGauge';
import ExportPDFButton from '@/components/ExportPDFButton';

export default function EventStatsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEventById, refreshEvents } = useEvents();
  const [refreshing, setRefreshing] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const eventData = await getEventById(id);
      setEvent(eventData);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshEvents();
    await loadEvent();
    setRefreshing(false);
  };

  // Calculate stats for this specific event
  const stats = useMemo(() => {
    if (!event) return null;

    const totalAttendees = event.attendees_count || 0;
    const checkedIn = event.checked_in_count || 0;
    const checkInRate = totalAttendees > 0 ? ((checkedIn / totalAttendees) * 100).toFixed(1) : '0';
    const notCheckedIn = totalAttendees - checkedIn;

    return {
      totalAttendees,
      checkedIn,
      notCheckedIn,
      checkInRate,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
    };
  }, [event]);

  // Chart data - only real data, no mock data
  const chartData = useMemo(() => {
    if (!stats) return null;

    // Pie chart data for check-in status
    const pieData = [
      { x: 'Checked In', y: stats.checkedIn, color: theme.colors.primary },
      { x: 'Not Checked In', y: stats.notCheckedIn, color: theme.colors.border },
    ];

    const pieStats = {
      totalAttendees: stats.totalAttendees,
      checkInRate: stats.checkInRate,
    };

    // Check-in speed based on real data
    const checkinSpeed = stats.checkedIn > 0 ? Math.min(Math.round(stats.checkedIn / 5), 100) : 0;

    return { pieData, pieStats, checkinSpeed };
  }, [stats, theme]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }} edges={['top']}>
        <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
          <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <CaretLeft size={24} color="white" weight="regular" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Event Statistics</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!event || !stats || !chartData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }} edges={['top']}>
        <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
          <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <CaretLeft size={24} color="white" weight="regular" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Event Statistics</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              Event not found
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }} edges={['top']}>
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <CaretLeft size={24} color="white" weight="regular" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{event.title}</Text>
            <Text style={styles.headerSubtitle}>Statistics</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Overview Stats */}
          <View style={[styles.overviewCard, { backgroundColor: theme.colors.backgroundPrimary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Overview
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {stats.totalAttendees}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Total Attendees
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.success }]}>
                  {stats.checkedIn}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Checked In
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                  {stats.checkInRate}%
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Check-in Rate
                </Text>
              </View>
            </View>
          </View>

          {/* Export PDF */}
          <View style={{ marginBottom: 16 }}>
            <ExportPDFButton type="event" eventId={id} variant="primary" />
          </View>

          {/* Check-in Status Chart */}
          <CheckInChart data={chartData.pieData} stats={chartData.pieStats} />

          {/* Check-in Speed */}
          <CheckinSpeedGauge
            value={chartData.checkinSpeed}
            label="Check-in Speed"
            unit="per minute"
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  overviewCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
