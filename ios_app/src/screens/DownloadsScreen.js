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
import LoadingIndicator from "../components/LoadingIndicator";
import { useFocusEffect } from "@react-navigation/native";
import storageService from "../utils/storageService";

export default function DownloadsScreen({ navigation }) {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRepairing, setAutoRepairing] = useState(false);
  const [repairing, setRepairing] = useState(null); // hash of manga being repaired
  const [repairProgress, setRepairProgress] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadDownloads();
    }, []),
  );

  const loadDownloads = async () => {
    try {
      setLoading(true);
      // First, repair any downloads missing local covers (for previous downloads)
      await storageService.repairDownloadCovers();
      let data = await storageService.getDownloads();

      // Auto-repair downloads needing chapter repair (enable offline viewing automatically)
      const needsRepair =
        data?.filter((d) => storageService.downloadNeedsRepair(d)) || [];

      if (needsRepair.length > 0) {
        console.log(
          `Auto-repairing ${needsRepair.length} download(s) for offline viewing...`,
        );
        setAutoRepairing(true);

        for (const download of needsRepair) {
          try {
            setRepairProgress({
              chapter: 0,
              total: download.chapters?.length || 0,
              status: `Enabling offline for ${download.title}...`,
            });
            await storageService.repairDownloadChapters(
              download,
              (progress) => {
                setRepairProgress(progress);
              },
            );
          } catch (err) {
            console.error(`Failed to auto-repair ${download.title}:`, err);
          }
        }

        setAutoRepairing(false);
        setRepairProgress(null);
        // Reload after repairs
        data = await storageService.getDownloads();
      }

      setDownloads(data || []);
    } catch (error) {
      console.error("Failed to load downloads:", error);
      Alert.alert("Error", "Failed to load downloads");
    } finally {
      setLoading(false);
      setAutoRepairing(false);
    }
  };

  const handleRepairDownload = async (download) => {
    try {
      setRepairing(download.hash);
      setRepairProgress({
        chapter: 0,
        total: download.chapters?.length || 0,
        status: "Starting repair...",
      });

      await storageService.repairDownloadChapters(download, (progress) => {
        setRepairProgress(progress);
      });

      Alert.alert("Success", "Download repaired for offline viewing!");
      await loadDownloads();
    } catch (error) {
      console.error("Failed to repair download:", error);
      Alert.alert(
        "Error",
        "Failed to repair download. Please try re-downloading.",
      );
    } finally {
      setRepairing(null);
      setRepairProgress(null);
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

  const handleClearAllDownloads = () => {
    Alert.alert(
      "Clear All Downloads",
      "Are you sure you want to delete ALL downloads? This cannot be undone.",
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete All",
          onPress: async () => {
            try {
              await storageService.clearAllDownloads();
              setDownloads([]);
              Alert.alert("Success", "All downloads cleared");
            } catch (error) {
              Alert.alert("Error", "Failed to clear downloads");
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
    // Use local cover path if available, otherwise fall back to remote
    const coverUri = item.localCoverPath || item.cover_img;
    const needsRepair = storageService.downloadNeedsRepair(item);
    const isRepairing = repairing === item.hash;

    return (
      <View style={styles.downloadItem}>
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => handleMangaTap(item)}
          activeOpacity={0.7}
        >
          <Image source={{ uri: coverUri }} style={styles.cover} />
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
            {needsRepair && !isRepairing && (
              <TouchableOpacity
                style={styles.repairButton}
                onPress={() => handleRepairDownload(item)}
              >
                <Ionicons name="cloud-download" size={14} color="#708ad4" />
                <Text style={styles.repairText}>Tap to enable offline</Text>
              </TouchableOpacity>
            )}
            {isRepairing && (
              <View style={styles.repairingRow}>
                <ActivityIndicator size="small" color="#708ad4" />
                <Text style={styles.repairingText}>
                  {repairProgress?.status || "Repairing..."}
                </Text>
              </View>
            )}
            {!needsRepair && !isRepairing && (
              <Text style={styles.downloadedAt}>
                Downloaded {new Date(item.downloadedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleRemoveDownload(item.hash)}
          disabled={isRepairing}
        >
          <Ionicons
            name="trash"
            size={16}
            color={isRepairing ? "#666" : "#d32f2f"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LoadingIndicator
          size="medium"
          text={
            autoRepairing && repairProgress ? repairProgress.status : undefined
          }
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {downloads.length > 0 ? (
        <>
          <FlatList
            data={downloads}
            renderItem={renderDownloadItem}
            keyExtractor={(item) => item.hash}
            contentContainerStyle={styles.listContent}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={handleClearAllDownloads}
              >
                <Ionicons name="trash-outline" size={16} color="#d32f2f" />
                <Text style={styles.clearAllText}>Clear All Downloads</Text>
              </TouchableOpacity>
            }
          />
        </>
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
  repairButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  repairText: {
    fontSize: 12,
    color: "#708ad4",
    fontWeight: "500",
  },
  repairingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  repairingText: {
    fontSize: 11,
    color: "#708ad4",
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
  clearAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 12,
    marginBottom: 24,
  },
  clearAllText: {
    fontSize: 14,
    color: "#d32f2f",
    fontWeight: "500",
  },
});
