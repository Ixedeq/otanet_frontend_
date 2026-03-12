import React, { useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from "react-native";
import apiService from "../api/apiService";
import LoadingIndicator from "../components/LoadingIndicator";
import NetworkErrorView from "../components/NetworkErrorView";

export default function RecentScreen({ navigation }) {
  const [manga, setManga] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    try {
      setInitialLoading(true);
      setError(null);
      const data = await apiService.getRecentManga(1);

      if (data && data.length > 0) {
        setManga(data);
        setPage(2);
        // API returns 25 per page, so if we get less than 20, we're likely at the end
        setHasMore(data.length >= 20);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load recent manga:", err);
      setError(err);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadMore = async () => {
    // Prevent multiple simultaneous loads
    if (!hasMore || loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      const data = await apiService.getRecentManga(page);

      if (data && data.length > 0) {
        setManga((prev) => [...prev, ...data]);
        setPage((prev) => prev + 1);
        // API returns 25 per page, so if we get less than 20, we're likely at the end
        setHasMore(data.length >= 20);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more manga:", err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const handleMangaTap = (item) => {
    navigation.navigate("MangaDetail", {
      hash: item.hash,
      title: item.title,
      manga: item,
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleMangaTap(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.cover_img || item.coverUrl }}
        style={styles.cover}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description || "No description"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (loading) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator color="#d0368a" />
          <Text style={styles.loadingMoreText}>Loading more...</Text>
        </View>
      );
    }
    if (!hasMore && manga.length > 0) {
      return (
        <View style={styles.endMessage}>
          <Text style={styles.endMessageText}>You've reached the end</Text>
        </View>
      );
    }
    return null;
  };

  if (initialLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LoadingIndicator size="medium" text="Loading manga..." />
      </View>
    );
  }

  if (error) {
    return (
      <NetworkErrorView
        error={error}
        onRetry={() => {
          setError(null);
          setManga([]);
          setPage(1);
          setHasMore(true);
          loadInitial();
        }}
        showDownloadsHint={true}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={manga}
        renderItem={renderItem}
        keyExtractor={(item) => item.hash}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />
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
  item: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  cover: {
    width: 100,
    height: 140,
    backgroundColor: "#1e1e1e",
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
  description: {
    fontSize: 12,
    color: "#a0a0a0",
  },
  loadMoreButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loadMoreText: {
    color: "#d0368a",
    fontWeight: "600",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingMoreText: {
    color: "#a0a0a0",
    marginTop: 8,
    fontSize: 12,
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
  loadingText: {
    color: "#a0a0a0",
    marginTop: 12,
    fontSize: 14,
  },
  endMessage: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endMessageText: {
    color: "#666",
    fontSize: 13,
  },
});
