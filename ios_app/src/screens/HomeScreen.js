import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from "react-native";
import LoadingIndicator from "../components/LoadingIndicator";
import NetworkErrorView from "../components/NetworkErrorView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import apiService from "../api/apiService";
import storageService from "../utils/storageService";
import { useUnread } from "../context/UnreadContext";

// Logo component
const Logo = require("../../assets/icon.png");

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { unreadCounts, refreshUnreadCounts } = useUnread();
  const [bookmarkedManga, setBookmarkedManga] = useState([]);
  const [recentManga, setRecentManga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadHome();
      refreshUnreadCounts();
    }, []),
  );

  const loadHome = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load bookmarked manga (local storage - always works offline)
      const bookmarks = await storageService.getBookmarks();

      // Sort by bookmarkedAt date, most recent first
      const sortedBookmarks = bookmarks
        .sort(
          (a, b) =>
            new Date(b.bookmarkedAt || 0) - new Date(a.bookmarkedAt || 0),
        )
        .slice(0, 20);

      setBookmarkedManga(sortedBookmarks);

      // Try to load recent manga (may fail offline)
      try {
        const recent = await apiService.getRecentManga(1, 10);
        setRecentManga(recent || []);
      } catch (apiErr) {
        console.log(
          "Failed to load recent manga (may be offline):",
          apiErr.message,
        );
        // Don't set error - we still have bookmarks to show
        setRecentManga([]);
      }
    } catch (err) {
      console.error("Failed to load home:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHome();
    setRefreshing(false);
  };

  const handleMangaTap = (item) => {
    navigation.navigate("MangaDetail", {
      hash: item.hash,
      title: item.title,
      manga: item,
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LoadingIndicator size="medium" />
      </View>
    );
  }

  if (error && bookmarkedManga.length === 0) {
    return (
      <NetworkErrorView
        error={error}
        onRetry={() => {
          setError(null);
          loadHome();
        }}
        showDownloadsHint={true}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#d0368a"
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image source={Logo} style={styles.logoImage} />
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>
                <Text style={styles.titleOta}>Ota</Text>
                <Text style={styles.titleNet}>Net</Text>
              </Text>
              <Text style={styles.tagline}>Your Manga Library</Text>
            </View>
          </View>
        </View>

        {/* Bookmarked Manga Section */}
        {bookmarkedManga.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bookmark" size={18} color="#d0368a" />
              <Text style={styles.sectionTitle}>Your Bookmarks</Text>
            </View>
            <View style={styles.mangaGrid}>
              {bookmarkedManga.map((item) => {
                const unreadCount = unreadCounts[item.hash]?.unread || 0;
                return (
                  <TouchableOpacity
                    key={item.hash}
                    style={styles.mangaCard}
                    onPress={() => handleMangaTap(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.coverContainer}>
                      <Image
                        source={{ uri: item.cover_img || item.coverUrl }}
                        style={styles.coverImage}
                      />
                      {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.mangaTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* No Bookmarks Message */}
        {bookmarkedManga.length === 0 && (
          <View style={styles.emptyBookmarks}>
            <Ionicons name="bookmark-outline" size={48} color="#555" />
            <Text style={styles.emptyTitle}>No bookmarks yet</Text>
            <Text style={styles.emptySubtitle}>
              Bookmark manga to see them here
            </Text>
          </View>
        )}

        {/* Recent Releases Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={18} color="#d0368a" />
            <Text style={styles.sectionTitle}>Recent Releases</Text>
          </View>
          <View style={styles.mangaGrid}>
            {recentManga.map((item) => (
              <TouchableOpacity
                key={item.hash}
                style={styles.mangaCard}
                onPress={() => handleMangaTap(item)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: item.cover_img || item.coverUrl }}
                  style={styles.coverImage}
                />
                <View style={styles.cardInfo}>
                  <Text style={styles.mangaTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  titleOta: {
    color: "#d0368a",
  },
  titleNet: {
    fontWeight: "400",
    color: "#f5f5f5",
    opacity: 0.9,
  },
  tagline: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f5f5f5",
  },
  emptyBookmarks: {
    alignItems: "center",
    paddingVertical: 32,
    marginBottom: 24,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f5f5f5",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  mangaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  mangaCard: {
    width: "48%",
    marginBottom: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  coverImage: {
    width: "100%",
    aspectRatio: 3 / 4.3,
    backgroundColor: "#1e1e1e",
  },
  coverContainer: {
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#d0368a",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  cardInfo: {
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  mangaTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f5f5f5",
    lineHeight: 18,
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#d0368a",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
