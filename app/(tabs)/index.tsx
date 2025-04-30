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
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEvents } from "../../context/EventContext";
import { useTheme } from "../../context/ThemeContext";
import { format, parseISO } from "date-fns";
import { Plus } from "phosphor-react-native";

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

  const renderEventItem = ({ item }: { item: any }) => (
    <Link href={`/event/${item.id}`} asChild>
      <TouchableOpacity
        style={[
          styles.eventCard,
          { backgroundColor: theme.colors.backgroundPrimary },
        ]}
      >
        <View style={styles.eventHeader}>
          <Text
            style={[styles.eventTitle, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons
                name="people-outline"
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[styles.statText, { color: theme.colors.textSecondary }]}
              >
                {item.checked_in_count || 0}/{item.attendees_count || 0}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.eventDetails}>
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
      </TouchableOpacity>
    </Link>
  );

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
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  eventCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
  },
  eventDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
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
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  createButton: {
    borderRadius: 10,
    padding: 15,
    margin: 20,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
});
