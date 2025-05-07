import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  CaretLeft,
  CaretRight,
  PencilSimple,
  Trash,
  UserPlus,
  QrCode,
  CheckCircle,
  CalendarBlank,
  Clock,
  MapPin,
  Users,
  NotePencil,
} from "phosphor-react-native";
import { useTheme } from "../../context/ThemeContext";
import { useEvents } from "../../context/EventContext";
import { format, parseISO } from "date-fns";

export default function EventDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEventById, deleteEvent } = useEvents();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async (showFullLoading = true) => {
    if (!id) return;

    if (showFullLoading) {
      setIsLoading(true);
    }
    
    try {
      const eventData = await getEventById(id);
      setEvent(eventData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load event");
      console.error("Error loading event:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadEvent(false);
  };

  const handleDeleteEvent = () => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteEvent(id);
              router.back();
            } catch (err) {
              Alert.alert("Error", "Failed to delete event");
              console.error("Error deleting event:", err);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    // Format: HH:MM:SS
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: theme.colors.backgroundPrimary },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <CaretLeft
              size={24}
              color={theme.colors.primary}
              weight="regular"
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: theme.colors.textPrimary,
            }}
          >
            Event Details
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: theme.colors.backgroundPrimary },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <CaretLeft
              size={24}
              color={theme.colors.primary}
              weight="regular"
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: theme.colors.textPrimary,
            }}
          >
            Event Details
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error || "Event not found"}
          </Text>
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => loadEvent()}
          >
            <Text style={[styles.retryButtonText, { color: "white" }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <CaretLeft size={24} color="white" weight="regular" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/event/edit/${id}`)}
        >
          <PencilSimple size={20} color="white" weight="regular" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View
          style={[
            styles.eventHeader,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={styles.eventTitle}>{event.title}</Text>

          <View style={styles.eventDateTimeContainer}>
            <View style={styles.eventDateTimeItem}>
              <CalendarBlank size={18} color="white" weight="fill" />
              <Text style={styles.eventDateTimeText}>
                {formatDate(event.date)}
              </Text>
            </View>

            <View style={styles.eventDateTimeItem}>
              <Clock size={18} color="white" weight="fill" />
              <Text style={styles.eventDateTimeText}>
                {formatTime(event.time)}
              </Text>
            </View>
          </View>

          {event.location && (
            <View style={styles.eventLocationContainer}>
              <MapPin size={18} color="white" weight="fill" />
              <Text style={styles.eventLocationText}>{event.location}</Text>
            </View>
          )}
        </View>

        <View style={styles.attendeeStatsContainer}>
          <View
            style={[
              styles.attendeeStatsCard,
              { backgroundColor: theme.colors.backgroundPrimary },
            ]}
          >
            <View style={styles.attendeeStatsItem}>
              <Text
                style={[
                  styles.attendeeStatsNumber,
                  { color: theme.colors.primary },
                ]}
              >
                {event.attendees_count || 0}
              </Text>
              <Text
                style={[
                  styles.attendeeStatsLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Total Attendees
              </Text>
            </View>

            <View
              style={[
                styles.attendeeStatsDivider,
                { backgroundColor: theme.colors.border },
              ]}
            />

            <View style={styles.attendeeStatsItem}>
              <Text
                style={[
                  styles.attendeeStatsNumber,
                  { color: theme.colors.accent },
                ]}
              >
                {event.checked_in_count || 0}
              </Text>
              <Text
                style={[
                  styles.attendeeStatsLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Checked In
              </Text>
            </View>
          </View>
        </View>

        {event.notes && (
          <View
            style={[
              styles.notesCard,
              { backgroundColor: theme.colors.backgroundPrimary },
            ]}
          >
            <View style={styles.notesHeaderRow}>
              <NotePencil
                size={18}
                color={theme.colors.textSecondary}
                weight="fill"
              />
              <Text
                style={[
                  styles.notesHeaderText,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Notes
              </Text>
            </View>
            <Text
              style={[styles.notesContent, { color: theme.colors.textPrimary }]}
            >
              {event.notes}
            </Text>
          </View>
        )}

        {event.expected_attendees && (
          <View
            style={[
              styles.expectedAttendeesCard,
              { backgroundColor: theme.colors.backgroundPrimary },
            ]}
          >
            <View style={styles.expectedAttendeesRow}>
              <Users size={18} color={theme.colors.primary} weight="fill" />
              <Text
                style={[
                  styles.expectedAttendeesLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Expected Attendees
              </Text>
              <Text
                style={[
                  styles.expectedAttendeesValue,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {event.expected_attendees}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actionsSection}>
          <Text
            style={[
              styles.actionsSectionTitle,
              { color: theme.colors.textPrimary },
            ]}
          >
            Actions
          </Text>

          <View style={styles.actionButtonsGrid}>
            <TouchableOpacity
              style={[
                styles.actionButtonCard,
                { backgroundColor: theme.colors.backgroundPrimary },
              ]}
              onPress={() => router.push(`/event/check-in/${id}`)}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  { backgroundColor: `${theme.colors.primary}15` },
                ]}
              >
                <CheckCircle
                  size={24}
                  color={theme.colors.primary}
                  weight="fill"
                />
              </View>
              <Text
                style={[
                  styles.actionButtonLabel,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Check-In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButtonCard,
                { backgroundColor: theme.colors.backgroundPrimary },
              ]}
              onPress={() => router.push(`/event/attendees/${id}`)}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  { backgroundColor: `${theme.colors.primary}15` },
                ]}
              >
                <UserPlus
                  size={24}
                  color={theme.colors.primary}
                  weight="fill"
                />
              </View>
              <Text
                style={[
                  styles.actionButtonLabel,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Attendees
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButtonCard,
                { backgroundColor: theme.colors.backgroundPrimary },
              ]}
              onPress={() => router.push(`/event/qr/${id}`)}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  { backgroundColor: `${theme.colors.primary}15` },
                ]}
              >
                <QrCode size={24} color={theme.colors.primary} weight="fill" />
              </View>
              <Text
                style={[
                  styles.actionButtonLabel,
                  { color: theme.colors.textPrimary },
                ]}
              >
                QR Code
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButtonCard,
                { backgroundColor: theme.colors.backgroundPrimary },
              ]}
              onPress={() => router.push(`/event/edit/${id}`)}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  { backgroundColor: `${theme.colors.primary}15` },
                ]}
              >
                <PencilSimple
                  size={24}
                  color={theme.colors.primary}
                  weight="fill"
                />
              </View>
              <Text
                style={[
                  styles.actionButtonLabel,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Edit
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.moreActionsSection}>
            <Text
              style={[
                styles.moreActionsSectionTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              More Actions
            </Text>

            <TouchableOpacity
              style={[
                styles.deleteActionButton,
                {
                  backgroundColor: theme.colors.backgroundPrimary,
                  borderColor: `${theme.colors.error}20`,
                },
              ]}
              onPress={handleDeleteEvent}
            >
              <View style={styles.deleteActionContent}>
                <View
                  style={[
                    styles.deleteActionIconContainer,
                    { backgroundColor: `${theme.colors.error}15` },
                  ]}
                >
                  <Trash size={22} color={theme.colors.error} weight="bold" />
                </View>
                <View style={styles.deleteActionTextContainer}>
                  <Text
                    style={[
                      styles.deleteActionTitle,
                      { color: theme.colors.error },
                    ]}
                  >
                    Delete Event
                  </Text>
                </View>
              </View>

            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  eventHeader: {
    padding: 24,
    paddingTop: 0,
    paddingBottom: 32,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 16,
  },
  eventDateTimeContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  eventDateTimeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  eventDateTimeText: {
    fontSize: 15,
    color: "white",
    marginLeft: 8,
  },
  eventLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventLocationText: {
    fontSize: 15,
    color: "white",
    marginLeft: 8,
  },
  attendeeStatsContainer: {
    paddingHorizontal: 16,
    marginTop: -24,
    marginBottom: 16,
  },
  attendeeStatsCard: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  attendeeStatsItem: {
    flex: 1,
    alignItems: "center",
  },
  attendeeStatsNumber: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  attendeeStatsLabel: {
    fontSize: 12,
  },
  attendeeStatsDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  notesCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notesHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  notesHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  notesContent: {
    fontSize: 15,
    lineHeight: 22,
    paddingLeft: 26,
  },
  expectedAttendeesCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  expectedAttendeesRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  expectedAttendeesLabel: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  expectedAttendeesValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  actionsSection: {
    margin: 16,
    marginTop: 8,
  },
  actionsSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    marginLeft: 4,
  },
  actionButtonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  actionButtonCard: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  moreActionsSection: {
    marginTop: 32,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  moreActionsSectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 4,
  },
  deleteActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  deleteActionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteActionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  deleteActionTextContainer: {
    flex: 1,
  },
  deleteActionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
});
