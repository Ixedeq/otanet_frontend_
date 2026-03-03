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
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import storageService from "../utils/storageService";

export default function DownloadsScreen({ navigation }) {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadDownloads();
    }, []),
  );

  const loadDownloads = async () => {
    try {
      setLoading(true);
      const data = await storageService.getDownloads();
      setDownloads(data || []);
    } catch (error) {
      console.error("Failed to load downloads:", error);
      Alert.alert("Error", "Failed to load downloads");
    } finally {
      setLoading(false);
    }
  };

  const handleMangaTap = (download) => {
    navigation.navigate("MangaDetail", {
      hash: download.hash,
      title: download.title,
      manga: download,
      isOffline: true,
    });
  };

  const handleRemoveDownload = (hash) => {
    Alert.alert(
      "Delete Download",
      "Are you sure you want to delete this download? This will free up storage space.",
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await storageService.removeDownload(hash);
              setDownloads((prev) => prev.filter((d) => d.hash !== hash));
            } catch (error) {
              Alert.alert("Error", "Failed to delete download");
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const getStorageSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderDownloadItem = ({ item }) => {
    // Calculate size from chapters or use totalSize if available
    const totalSize =
      item.totalSize ||
      item.chapters?.reduce((sum, ch) => sum + (ch.size || 0), 0) ||
      0;
    const chapterCount = item.chapters?.length || 0;

    return (
      <View style={styles.downloadItem}>
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => handleMangaTap(item)}
          activeOpacity={0.7}
        >
          <Image source={{ uri: item.cover_img }} style={styles.cover} />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Ionicons name="book" size={14} color="#d0368a" />
                <Text style={styles.statText}>
                  {chapterCount} chapter{chapterCount !== 1 ? "s" : ""}
                </Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="disc" size={14} color="#d0368a" />
                <Text style={styles.statText}>{getStorageSize(totalSize)}</Text>
              </View>
            </View>
            <Text style={styles.downloadedAt}>
              Downloaded {new Date(item.downloadedAt).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleRemoveDownload(item.hash)}
        >
          <Ionicons name="trash" size={16} color="#d32f2f" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#d0368a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {downloads.length > 0 ? (
        <FlatList
          data={downloads}
          renderItem={renderDownloadItem}
          keyExtractor={(item) => item.hash}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={[styles.container, styles.centerContent]}>
          <Ionicons name="download" size={48} color="#555" />
          <Text style={styles.emptyText}>No downloads yet</Text>
          <Text style={styles.emptySubtext}>
            Download manga chapters to read them offline
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
  downloadItem: {
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
  info: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f5f5f5",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 6,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#a0a0a0",
    fontWeight: "500",
  },
  downloadedAt: {
    fontSize: 11,
    color: "#666",
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f5f5f5",
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
