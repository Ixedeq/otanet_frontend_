import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import storageService from "../utils/storageService";
import { useUnread } from "../context/UnreadContext";

export default function BookmarksScreen({ navigation }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { unreadCounts, refreshUnreadCounts } = useUnread();

  useFocusEffect(
    useCallback(() => {
      loadBookmarks();
      refreshUnreadCounts();
    }, []),
  );

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const data = await storageService.getBookmarks();
      setBookmarks(data);
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
      Alert.alert("Error", "Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = (hash) => {
    Alert.alert(
      "Remove Bookmark",
      "Are you sure you want to remove this bookmark?",
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Remove",
          onPress: async () => {
            try {
              await storageService.removeBookmark(hash);
              setBookmarks((prev) => prev.filter((b) => b.hash !== hash));
              refreshUnreadCounts();
            } catch (error) {
              Alert.alert("Error", "Failed to remove bookmark");
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleMangaTap = (bookmark) => {
    navigation.navigate("MangaDetail", {
      hash: bookmark.hash,
      title: bookmark.title,
      manga: bookmark,
    });
  };

  const renderBookmarkItem = ({ item }) => {
    const unreadCount = unreadCounts[item.hash]?.unread || 0;

    return (
      <View style={styles.bookmarkItem}>
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => handleMangaTap(item)}
          activeOpacity={0.7}
        >
          <View style={styles.coverContainer}>
            <Image source={{ uri: item.cover_img }} style={styles.cover} />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.dateAdded}>
              Bookmarked {new Date(item.bookmarkedAt).toLocaleDateString()}
            </Text>
            {unreadCount > 0 && (
              <Text style={styles.unreadText}>
                {unreadCount} new chapter{unreadCount !== 1 ? "s" : ""}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveBookmark(item.hash)}
        >
          <Ionicons name="trash" size={20} color="#d32f2f" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {bookmarks.length > 0 ? (
        <FlatList
          data={bookmarks}
          renderItem={renderBookmarkItem}
          keyExtractor={(item) => item.hash}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={[styles.container, styles.centerContent]}>
          <Ionicons name="bookmark-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No bookmarks yet</Text>
          <Text style={styles.emptySubtext}>
            Bookmark your favorite manga to access them here
          </Text>
        </View>
      )}
    </SafeAreaView>
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
  listContent: {
    padding: 12,
  },
  bookmarkItem: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
  },
  cover: {
    width: 100,
    height: 140,
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
  info: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f5f5f5",
    marginBottom: 4,
  },
  dateAdded: {
    fontSize: 12,
    color: "#666",
  },
  unreadText: {
    fontSize: 12,
    color: "#d0368a",
    fontWeight: "600",
    marginTop: 4,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#555",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
