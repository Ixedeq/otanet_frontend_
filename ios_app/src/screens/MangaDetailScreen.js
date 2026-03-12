import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  AppState,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import LoadingIndicator from "../components/LoadingIndicator";
import NetworkErrorView from "../components/NetworkErrorView";
import apiService from "../api/apiService";
import storageService from "../utils/storageService";
import { useUnread } from "../context/UnreadContext";

// Estimated average page size in bytes (~200KB is reasonable for manga images)
const ESTIMATED_PAGE_SIZE = 200 * 1024;

export default function MangaDetailScreen({ route, navigation }) {
  const { hash, title, manga: initialManga, isOffline } = route.params;
  const { refreshUnreadCounts } = useUnread();

  const [manga, setManga] = useState(initialManga);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(!initialManga);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [downloadedChapters, setDownloadedChapters] = useState([]);
  const [downloadingChapters, setDownloadingChapters] = useState([]);
  const [readChapters, setReadChapters] = useState([]);

  // Ref to track if download should continue (for background support)
  const downloadAbortRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const downloadProgressRef = useRef(null);
  const isDownloadingRef = useRef(false);

  const getChapterNumber = (chapterItem) => {
    if (typeof chapterItem === "number" || typeof chapterItem === "string") {
      return chapterItem;
    }
    return (
      chapterItem?.number ?? chapterItem?.chapterNumber ?? chapterItem?.chapter
    );
  };

  useEffect(() => {
    loadMangaData();
    checkBookmark();
    checkDownload();
    checkActiveDownload();
    loadDownloadedChapters();
    loadReadChapters();

    // Handle app state changes for background downloads
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [hash]);

  // Helper to parse tags - API may return various formats
  const parseTags = (tags) => {
    if (Array.isArray(tags)) {
      return tags.map((t) => String(t).trim()).filter(Boolean);
    }
    if (typeof tags === "string" && tags.trim()) {
      let tagStr = tags.trim();

      // Try JSON parse first (handles ["tag1", "tag2"] format)
      try {
        const parsed = JSON.parse(tagStr);
        if (Array.isArray(parsed)) {
          return parsed.map((t) => String(t).trim()).filter(Boolean);
        }
      } catch (e) {
        // Not valid JSON
      }

      // Handle Python-style list string: ['tag1', 'tag2'] or ["tag1", "tag2"]
      // Remove surrounding brackets
      if (
        (tagStr.startsWith("[") && tagStr.endsWith("]")) ||
        (tagStr.startsWith("(") && tagStr.endsWith(")"))
      ) {
        tagStr = tagStr.slice(1, -1);
      }

      // Split by comma and clean each tag
      return tagStr
        .split(",")
        .map((t) =>
          t
            .trim()
            .replace(/^['"]|['"]$/g, "")
            .trim(),
        )
        .filter(Boolean);
    }
    return [];
  };

  const handleTagPress = (tag) => {
    navigation.navigate("TagFilter", {
      preSelectedTag: tag,
    });
  };

  const loadMangaData = async () => {
    try {
      setLoading(true);

      // Load manga details if not provided or if missing key fields (description/tags)
      if (!manga || !manga.description || !Array.isArray(manga.tags)) {
        const details = await apiService.getMangaDetails(hash);
        // Merge with existing manga data to preserve cover_img and other fields
        setManga((prevManga) => ({
          ...prevManga,
          ...details,
          // Preserve local cover path for offline mode
          localCoverPath:
            prevManga?.localCoverPath || initialManga?.localCoverPath,
          // Preserve cover_img from initial data if API doesn't provide it
          cover_img:
            details?.cover_img ||
            details?.coverUrl ||
            prevManga?.cover_img ||
            prevManga?.coverUrl ||
            initialManga?.cover_img ||
            initialManga?.coverUrl,
          tags: parseTags(details?.tags),
        }));
      }

      // Load chapters
      const chapterData = await apiService.getChapters(hash);
      setChapters(chapterData || []);
    } catch (err) {
      console.error("Failed to load manga data:", err);
      // Only show error if we don't have initial data
      if (!initialManga) {
        setError(err);
      } else {
        // Use offline chapters if available
        if (isOffline && initialManga?.chapters) {
          setChapters(initialManga.chapters);
        } else {
          Alert.alert(
            "Connection Error",
            "Unable to load chapter list. Please check your connection.",
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const checkBookmark = async () => {
    const bookmarked = await storageService.isBookmarked(hash);
    setIsBookmarked(bookmarked);
  };

  const checkDownload = async () => {
    const downloaded = await storageService.isDownloaded(hash);
    setIsDownloaded(downloaded);
  };

  const loadDownloadedChapters = async () => {
    const chapters = await storageService.getDownloadedChapters(hash);
    setDownloadedChapters(chapters);
  };

  const loadReadChapters = async () => {
    const read = await storageService.getReadChapters(hash);
    setReadChapters(read);
  };

  const checkActiveDownload = async () => {
    const activeDownloads = await storageService.getActiveDownloads();
    if (activeDownloads[hash]) {
      const active = activeDownloads[hash];
      setDownloading(true);
      setDownloadProgress({ current: active.current, total: active.total });
    }
  };

  const toggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await storageService.removeBookmark(hash);
      } else {
        await storageService.addBookmark({
          hash,
          title: manga?.title || title,
          cover_img: manga?.cover_img,
          chapterCountAtBookmark: chapters.length,
        });
      }
      setIsBookmarked(!isBookmarked);
      refreshUnreadCounts();
    } catch (error) {
      Alert.alert("Error", "Failed to update bookmark");
    }
  };

  const handleDownload = async () => {
    try {
      if (isDownloaded) {
        // Remove download
        Alert.alert(
          "Remove Download",
          "Are you sure you want to remove this download?",
          [
            { text: "Cancel" },
            {
              text: "Remove",
              onPress: async () => {
                await storageService.removeDownload(hash);
                setIsDownloaded(false);
              },
              style: "destructive",
            },
          ],
        );
        return;
      }

      // Ensure chapters are loaded
      if (!chapters || chapters.length === 0) {
        Alert.alert("Please wait", "Chapters are still loading...");
        return;
      }

      // Already downloading
      if (isDownloadingRef.current) {
        return;
      }

      // Start download
      isDownloadingRef.current = true;
      setDownloading(true);
      downloadAbortRef.current = false;

      const chapterNumbers = chapters
        .map((ch) => getChapterNumber(ch))
        .filter((ch) => ch !== undefined && ch !== null);

      if (chapterNumbers.length === 0) {
        Alert.alert("Error", "No chapters available to download");
        isDownloadingRef.current = false;
        setDownloading(false);
        return;
      }

      downloadProgressRef.current = {
        current: 0,
        total: chapterNumbers.length,
      };
      setDownloadProgress({ current: 0, total: chapterNumbers.length });

      // Store active download status
      await storageService.setActiveDownload(hash, {
        current: 0,
        total: chapterNumbers.length,
        title: manga?.title || title,
      });

      // Run download asynchronously (non-blocking)
      runDownload(chapterNumbers);
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Failed to start download");
      isDownloadingRef.current = false;
      setDownloading(false);
      setDownloadProgress(null);
    }
  };

  const runDownload = async (chapterNumbers) => {
    const downloadedChapters = [];
    let totalSize = 0;

    try {
      for (let i = 0; i < chapterNumbers.length; i += 1) {
        // Check if download was aborted
        if (downloadAbortRef.current) {
          break;
        }

        const chapterNumber = chapterNumbers[i];

        // Update progress in both ref and state
        const progress = { current: i + 1, total: chapterNumbers.length };
        downloadProgressRef.current = progress;
        setDownloadProgress({ ...progress });

        // Update active download status in storage
        await storageService.setActiveDownload(hash, {
          current: i + 1,
          total: chapterNumbers.length,
          title: manga?.title || title,
        });

        try {
          const pages = await apiService.getChapterPages(
            hash,
            String(chapterNumber),
          );

          const pageCount = (pages || []).length;
          const chapterSize = pageCount * ESTIMATED_PAGE_SIZE;
          totalSize += chapterSize;

          downloadedChapters.push({
            number: String(chapterNumber),
            pages: pages || [],
            pageCount: pageCount,
            size: chapterSize,
          });

          // Update UI to show checkmark for this chapter immediately
          setDownloadedChapters((prev) => [...prev, String(chapterNumber)]);
        } catch (chapterError) {
          console.error(
            `Failed to download chapter ${chapterNumber}:`,
            chapterError,
          );
        }

        // Small delay to allow UI updates
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Save all downloaded chapters
      await storageService.addDownload(
        {
          hash,
          title: manga?.title || title,
          cover_img: manga?.cover_img,
          description: manga?.description,
          author: manga?.author,
          totalSize: totalSize,
        },
        downloadedChapters,
      );

      // Clear active download status
      await storageService.clearActiveDownload(hash);

      setIsDownloaded(true);
      loadDownloadedChapters();

      const failedCount = chapterNumbers.length - downloadedChapters.length;
      if (failedCount > 0 && !downloadAbortRef.current) {
        Alert.alert(
          "Download completed with warnings",
          `${downloadedChapters.length}/${chapterNumbers.length} chapters were downloaded successfully.`,
        );
      }
    } catch (error) {
      console.error("Download process error:", error);
      Alert.alert("Error", "Download failed");
      await storageService.clearActiveDownload(hash);
    } finally {
      isDownloadingRef.current = false;
      downloadProgressRef.current = null;
      setDownloading(false);
      setDownloadProgress(null);
    }
  };

  const handleReadChapter = (chapter) => {
    console.log("handleReadChapter - isOffline:", isOffline);
    console.log(
      "handleReadChapter - manga.chapters count:",
      manga?.chapters?.length || 0,
    );
    if (manga?.chapters?.[0]) {
      console.log(
        "handleReadChapter - first chapter has pages:",
        manga.chapters[0].pages?.length || 0,
      );
      console.log(
        "handleReadChapter - first page:",
        manga.chapters[0].pages?.[0]?.substring?.(0, 80) || "N/A",
      );
    }

    navigation.navigate("ChapterReader", {
      hash,
      chapter,
      mangaTitle: manga?.title || title,
      isOffline: Boolean(isOffline),
      offlineChapters: isOffline ? manga?.chapters || [] : [],
    });
  };

  const handleDownloadSingleChapter = async (chapterNumber) => {
    const chapterNum = String(chapterNumber);

    // Already downloaded or downloading
    if (
      downloadedChapters.includes(chapterNum) ||
      downloadingChapters.includes(chapterNum)
    ) {
      return;
    }

    try {
      // Mark as downloading
      setDownloadingChapters((prev) => [...prev, chapterNum]);

      // Fetch chapter pages
      const pages = await apiService.getChapterPages(hash, chapterNum);
      const pageCount = (pages || []).length;
      const chapterSize = pageCount * ESTIMATED_PAGE_SIZE;

      const chapterData = {
        number: chapterNum,
        pages: pages || [],
        pageCount: pageCount,
        size: chapterSize,
      };

      // Save to storage
      await storageService.addChapterToDownload(
        {
          hash,
          title: manga?.title || title,
          cover_img: manga?.cover_img,
          description: manga?.description,
          author: manga?.author,
        },
        chapterData,
      );

      // Update UI
      setDownloadedChapters((prev) => [...prev, chapterNum]);
      setIsDownloaded(true);
    } catch (error) {
      console.error(`Failed to download chapter ${chapterNum}:`, error);
      Alert.alert("Error", `Failed to download chapter ${chapterNum}`);
    } finally {
      // Remove from downloading state
      setDownloadingChapters((prev) => prev.filter((c) => c !== chapterNum));
    }
  };

  if (loading && !manga) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LoadingIndicator size="medium" />
      </View>
    );
  }

  if (error && !manga) {
    return (
      <NetworkErrorView
        error={error}
        onRetry={() => {
          setError(null);
          loadManga();
        }}
        showDownloadsHint={true}
      />
    );
  }

  if (!manga) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Manga not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with cover */}
        <View style={styles.headerSection}>
          <Image
            source={{
              uri: manga.localCoverPath || manga.cover_img || manga.coverUrl,
            }}
            style={styles.coverImage}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.mangaTitle}>{manga.title}</Text>
            {manga.author && (
              <Text style={styles.author}>by {manga.author}</Text>
            )}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.bookmarkButton,
                  isBookmarked && styles.bookmarkButtonActive,
                ]}
                onPress={toggleBookmark}
              >
                <Ionicons
                  name={isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={16}
                  color={isBookmarked ? "#d0368a" : "#a0a0a0"}
                />
                <Text
                  style={[
                    styles.bookmarkButtonText,
                    isBookmarked && { color: "#d0368a" },
                  ]}
                >
                  {isBookmarked ? "Saved" : "Save"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  isDownloaded && styles.downloadButtonActive,
                ]}
                onPress={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <View style={styles.downloadProgressWrap}>
                    <ActivityIndicator color="#fff" size={16} />
                    {downloadProgress && (
                      <Text style={styles.downloadProgressText}>
                        {downloadProgress.current}/{downloadProgress.total}
                      </Text>
                    )}
                  </View>
                ) : (
                  <>
                    <Ionicons
                      name={isDownloaded ? "download" : "download-outline"}
                      size={16}
                      color={isDownloaded ? "#d0368a" : "#a0a0a0"}
                    />
                    <Text
                      style={[
                        styles.downloadButtonText,
                        isDownloaded && { color: "#d0368a" },
                      ]}
                    >
                      {isDownloaded ? "Ready" : "Download"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Description */}
        {manga.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{manga.description}</Text>
          </View>
        )}

        {/* Tags */}
        {Array.isArray(manga.tags) && manga.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {manga.tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tag}
                  onPress={() => handleTagPress(tag)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Chapters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chapters ({chapters.length})</Text>
          <View style={styles.chaptersList}>
            {chapters.length > 0 ? (
              chapters.map((chapter, index) => {
                const chapterNum = String(chapter.number ?? chapter);
                const isChapterDownloaded =
                  downloadedChapters.includes(chapterNum);
                const isChapterDownloading =
                  downloadingChapters.includes(chapterNum);
                // Compare as strings for consistency
                const isChapterRead = readChapters
                  .map((c) => String(c))
                  .includes(chapterNum);
                return (
                  <View
                    key={index}
                    style={[
                      styles.chapterItem,
                      isChapterRead && styles.chapterItemRead,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.chapterTapArea}
                      onPress={() =>
                        handleReadChapter(chapter.number ?? chapter)
                      }
                      activeOpacity={0.7}
                    >
                      <View style={styles.chapterInfo}>
                        <Text
                          style={[
                            styles.chapterNumber,
                            isChapterRead && styles.chapterNumberRead,
                          ]}
                        >
                          Chapter {chapterNum}
                        </Text>
                        {isChapterDownloaded && (
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={isChapterRead ? "#666" : "#4CAF50"}
                            style={styles.downloadedCheck}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.chapterActions}>
                      {isChapterDownloading ? (
                        <ActivityIndicator size="small" color="#d0368a" />
                      ) : !isChapterDownloaded ? (
                        <TouchableOpacity
                          onPress={() =>
                            handleDownloadSingleChapter(chapterNum)
                          }
                          style={styles.chapterDownloadBtn}
                        >
                          <Ionicons
                            name="download-outline"
                            size={20}
                            color="#d0368a"
                          />
                        </TouchableOpacity>
                      ) : null}
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noChaptersText}>No chapters available</Text>
            )}
          </View>
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 16,
  },
  headerSection: {
    flexDirection: "row",
    marginBottom: 28,
  },
  coverImage: {
    width: 120,
    height: 170,
    borderRadius: 12,
    backgroundColor: "#1e1e1e",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  headerInfo: {
    flex: 1,
    justifyContent: "flex-start",
  },
  mangaTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f5f5f5",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  author: {
    fontSize: 13,
    color: "#a0a0a0",
    marginBottom: 12,
    fontWeight: "500",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  bookmarkButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "rgba(208, 54, 138, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(208, 54, 138, 0.3)",
    flex: 1,
  },
  bookmarkButtonActive: {
    backgroundColor: "rgba(208, 54, 138, 0.25)",
    borderColor: "rgba(208, 54, 138, 0.5)",
  },
  bookmarkButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#a0a0a0",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "rgba(208, 54, 138, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(208, 54, 138, 0.3)",
    flex: 1,
  },
  downloadButtonActive: {
    backgroundColor: "rgba(208, 54, 138, 0.25)",
    borderColor: "rgba(208, 54, 138, 0.5)",
  },
  downloadButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#a0a0a0",
  },
  downloadProgressWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  downloadProgressText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f5f5f5",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    color: "#d0d0d0",
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "rgba(208, 54, 138, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(208, 54, 138, 0.2)",
  },
  tagText: {
    fontSize: 12,
    color: "#d0368a",
    fontWeight: "500",
  },
  chaptersList: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  chapterItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  chapterItemRead: {
    opacity: 0.5,
  },
  chapterTapArea: {
    flex: 1,
  },
  chapterInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  chapterActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chapterDownloadBtn: {
    padding: 4,
  },
  chapterNumber: {
    fontSize: 14,
    color: "#f5f5f5",
    fontWeight: "500",
  },
  chapterNumberRead: {
    color: "#666",
  },
  downloadedCheck: {
    marginLeft: 8,
  },
  noChaptersText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#d0368a",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
