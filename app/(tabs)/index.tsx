import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  ImageBackground,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEvents } from "../../context/EventContext";
import { useTheme } from "../../context/ThemeContext";
import { format, parseISO, isFuture, isPast, isToday } from "date-fns";
import { Plus, CalendarCheck } from "phosphor-react-native";

export default function HomeScreen() {
  const { events, loading, error, refreshEvents } = useEvents();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log("HomeScreen mounted, events:", events);
    console.log("Loading state:", loading);
    console.log("Error state:", error);
  }, [events, loading, error]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshEvents();
    } catch (err) {
      console.error("Error refreshing events:", err);
      Alert.alert("Error", "Failed to refresh events. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      // Handle both ISO date strings and date-only strings
      const date = dateStr.includes("T") ? parseISO(dateStr) : new Date(dateStr);
      return format(date, "MMM d, yyyy");
    } catch (err) {
      console.error("Error formatting date:", err, dateStr);
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      // Handle both ISO time strings and time-only strings
      if (timeStr.includes("T")) {
        return format(parseISO(timeStr), "h:mm a");
      }
      
      // Parse time string (HH:MM:SS)
      const [hours, minutes] = timeStr.split(":");
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));

      return format(date, "h:mm a");
    } catch (err) {
      console.error("Error formatting time:", err, timeStr);
      return timeStr;
    }
  };

  // Determine event status (upcoming, today, past)
  const getEventStatus = (dateStr: string) => {
    try {
      const date = dateStr.includes("T") ? parseISO(dateStr) : new Date(dateStr);
      if (isToday(date)) return "today";
      if (isFuture(date)) return "upcoming";
      if (isPast(date)) return "past";
      return "upcoming";
    } catch (err) {
      return "upcoming";
    }
  };

  // Get status color based on event status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "today": return theme.colors.accent;
      case "upcoming": return theme.colors.primary;
      case "past": return theme.colors.textTertiary;
      default: return theme.colors.primary;
    }
  };

  // Get status label based on event status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "today": return "TODAY";
      case "upcoming": return "UPCOMING";
      case "past": return "PAST";
      default: return "";
    }
  };

  const renderEventItem = ({ item, index }: { item: any, index: number }) => {
    const eventStatus = getEventStatus(item.date);
    const statusColor = getStatusColor(eventStatus);
    const statusLabel = getStatusLabel(eventStatus);
    
    // Generate a consistent background pattern based on event id
    const patternId = parseInt(item.id.substring(0, 8), 16) % 5;
    
    return (
      <Link href={`/event/${item.id}`} asChild>
        <TouchableOpacity
          style={[
            styles.eventCard,
            { backgroundColor: theme.colors.backgroundPrimary },
            theme.shadows.md,
          ]}
        >
          {/* Status indicator */}
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
          
          <View style={styles.eventContent}>
            {/* Event header with title and attendee count */}
            <View style={styles.eventHeader}>
              <Text
                style={[styles.eventTitle, { color: theme.colors.textPrimary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.title}
              </Text>
              <View style={styles.statsContainer}>
                <View style={[styles.statBadge, { backgroundColor: `${statusColor}20` }]}>
                  <Ionicons
                    name="people-outline"
                    size={14}
                    color={statusColor}
                  />
                  <Text
                    style={[styles.statText, { color: statusColor }]}
                  >
                    {item.checked_in_count || 0}/{item.attendees_count || 0}
                  </Text>
                </View>
              </View>
            </View>

            {/* Event details */}
            <View style={styles.eventDetails}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                  <Text
                    style={[styles.detailText, { color: theme.colors.textSecondary }]}
                  >
                    {formatDate(item.date)}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                  <Text
                    style={[styles.detailText, { color: theme.colors.textSecondary }]}
                  >
                    {formatTime(item.time)}
                  </Text>
                </View>
              </View>

              {item.location && (
                <View style={styles.detailItem}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.textSecondary },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.location}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  if (loading && !refreshing) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>
          Loading events...
        </Text>
      </View>
    );
  }

  if (error && !refreshing && events.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={theme.colors.error}
        />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={refreshEvents}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <Ionicons
          name="calendar-outline"
          size={48}
          color={theme.colors.textSecondary}
        />
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No events found
        </Text>
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => router.push("/create-event")}
        >
          <View style={styles.createButtonContent}>
            <Plus size={16} color="white" weight="bold" />
            <Text style={styles.createButtonText}>CREATE NEW EVENT</Text>
          </View>
        </TouchableOpacity>
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Your Events
        </Text>
        <CalendarCheck size={24} color={theme.colors.primary} weight="duotone" />
      </View>
      
      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push("/create-event")}
      >
        <View style={styles.createButtonContent}>
          <Plus size={16} color="white" weight="bold" />
          <Text style={styles.createButtonText}>CREATE NEW EVENT</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  eventCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    borderBottomRightRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    marginLeft: 8,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  eventDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  createButton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  createButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  createButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});
