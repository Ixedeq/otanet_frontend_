import React, { useMemo, useRef, useState, useEffect } from "react";
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
  Dimensions,
  PanResponder,
  FlatList,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import LoadingIndicator from "../components/LoadingIndicator";
import NetworkErrorView from "../components/NetworkErrorView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import apiService from "../api/apiService";
import storageService from "../utils/storageService";
import { useUnread } from "../context/UnreadContext";

const { width, height: screenHeight } = Dimensions.get("window");

// Default aspect ratio for manga pages (typical manga is taller than wide)
const DEFAULT_ASPECT_RATIO = 0.7;

// Page image component that maintains uniform sizing
const PageImage = React.memo(({ source, style, resizeMode, isScrollMode }) => {
  const [dimensions, setDimensions] = useState({
    width: width,
    height: width / DEFAULT_ASPECT_RATIO,
  });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const uri = source?.uri;
    if (!uri) {
      console.log("PageImage: No URI provided");
      return;
    }

    console.log("PageImage loading URI:", uri.substring(0, 80));

    Image.getSize(
      uri,
      (imgWidth, imgHeight) => {
        console.log("PageImage getSize success:", imgWidth, "x", imgHeight);
        if (imgWidth && imgHeight) {
          const aspectRatio = imgWidth / imgHeight;
          if (isScrollMode) {
            // For scroll mode: full width, calculated height
            setDimensions({ width: width, height: width / aspectRatio });
          } else {
            // For paginated mode: fit within screen while maintaining aspect ratio
            const maxHeight = screenHeight * 0.85;
            let finalWidth = width;
            let finalHeight = width / aspectRatio;

            if (finalHeight > maxHeight) {
              finalHeight = maxHeight;
              finalWidth = maxHeight * aspectRatio;
            }
            setDimensions({ width: finalWidth, height: finalHeight });
          }
        }
      },
      (getSizeError) => {
        // On error, use default dimensions
        console.log(
          "PageImage getSize error:",
          getSizeError,
          "for URI:",
          source?.uri?.substring(0, 80),
        );
        setError(true);
      },
    );
  }, [source?.uri, isScrollMode]);

  return (
    <View
      style={[
        isScrollMode ? styles.scrollPageWrapper : styles.paginatedPageWrapper,
        { width: dimensions.width, height: dimensions.height },
      ]}
    >
      {!loaded && !error && (
        <View style={styles.pageLoadingPlaceholder}>
          <ActivityIndicator size="small" color="#d0368a" />
        </View>
      )}
      <Image
        source={source}
        style={[
          style,
          { width: dimensions.width, height: dimensions.height },
          !loaded && { opacity: 0 },
        ]}
        resizeMode={resizeMode || "contain"}
        onLoad={() => {
          console.log(
            "PageImage loaded successfully:",
            source?.uri?.substring(0, 50),
          );
          setLoaded(true);
        }}
        onError={(e) => {
          console.log(
            "PageImage load error:",
            e.nativeEvent?.error,
            "for:",
            source?.uri?.substring(0, 80),
          );
          setError(true);
        }}
      />
    </View>
  );
});

export default function ChapterReaderScreen({ route, navigation }) {
  const {
    hash,
    chapter,
    mangaTitle,
    isOffline,
    offlineChapters = [],
  } = route.params;

  const insets = useSafeAreaInsets();
  const { markChapterRead } = useUnread();

  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [readingMode, setReadingMode] = useState("scroll");
  const didSwipeRef = useRef(false);
  const scrollViewRef = useRef(null);

  const getChapterNumber = (chapterItem) => {
    if (typeof chapterItem === "number" || typeof chapterItem === "string") {
      return chapterItem;
    }
    return (
      chapterItem?.number ?? chapterItem?.chapterNumber ?? chapterItem?.chapter
    );
  };

  useEffect(() => {
    loadChapter();
    loadReadingMode();
  }, [hash, chapter]);

  const loadReadingMode = async () => {
    const mode = await storageService.getReadingMode();
    setReadingMode(mode);
  };

  const toggleReadingMode = async () => {
    const newMode = readingMode === "paginated" ? "scroll" : "paginated";
    setReadingMode(newMode);
    await storageService.setReadingMode(newMode);
  };

  useEffect(() => {
    // Mark chapter as read when loaded
    if (pages.length > 0) {
      const chapterNum = String(chapter);
      storageService.markChapterAsRead(hash, chapterNum).catch((err) => {
        console.error("Failed to mark chapter as read:", err);
      });
      // Also update the unread context
      markChapterRead(hash, chapterNum);
    }
  }, [pages, hash, chapter, markChapterRead]);

  // Prefetch all page images when chapter loads
  useEffect(() => {
    if (pages.length > 0) {
      const prefetchImages = async () => {
        const urls = pages
          .map((p) =>
            typeof p === "string" ? p : p?.src || p?.url || p?.image,
          )
          .filter(Boolean);

        // Prefetch in batches of 5 to avoid overwhelming the network
        for (let i = 0; i < urls.length; i += 5) {
          const batch = urls.slice(i, i + 5);
          await Promise.all(
            batch.map((url) =>
              Image.prefetch(url).catch(() => {
                // Ignore prefetch errors
              }),
            ),
          );
        }
      };

      prefetchImages();
    }
  }, [pages]);

  // Prefetch nearby pages when navigating for smoother transitions
  useEffect(() => {
    const prefetchNearby = () => {
      const nearbyIndices = [
        currentPageIndex + 1,
        currentPageIndex + 2,
        currentPageIndex - 1,
      ].filter((i) => i >= 0 && i < pages.length);

      nearbyIndices.forEach((i) => {
        const page = pages[i];
        const url =
          typeof page === "string"
            ? page
            : page?.src || page?.url || page?.image;
        if (url) {
          Image.prefetch(url).catch(() => {});
        }
      });
    };

    if (pages.length > 0) {
      prefetchNearby();
    }
  }, [currentPageIndex, pages]);

  const loadChapter = async () => {
    try {
      setLoading(true);

      if (
        isOffline &&
        Array.isArray(offlineChapters) &&
        offlineChapters.length
      ) {
        console.log("Loading offline chapter", chapter);
        console.log("Offline chapters count:", offlineChapters.length);

        const normalizedOfflineChapters = offlineChapters.map((ch) => ({
          number: getChapterNumber(ch),
          pages: ch?.pages || [],
        }));

        const currentOfflineChapter = normalizedOfflineChapters.find(
          (ch) => parseFloat(ch.number) === parseFloat(chapter),
        );

        console.log("Current offline chapter found:", !!currentOfflineChapter);
        console.log("Pages count:", currentOfflineChapter?.pages?.length || 0);
        if (currentOfflineChapter?.pages?.[0]) {
          console.log(
            "First page path:",
            currentOfflineChapter.pages[0].substring(0, 100),
          );
        }

        setChapters(normalizedOfflineChapters);
        setPages(currentOfflineChapter?.pages || []);
        setCurrentPageIndex(0);

        const currentIdx = normalizedOfflineChapters.findIndex(
          (ch) => parseFloat(ch.number) === parseFloat(chapter),
        );
        setCurrentChapterIndex(currentIdx >= 0 ? currentIdx : 0);
        return;
      }

      const data = await apiService.getChapterPages(hash, chapter);
      setPages(data || []);
      setCurrentPageIndex(0);

      // Load all chapters for navigation
      const allChapters = await apiService.getChapters(hash);
      if (allChapters && allChapters.length > 0) {
        setChapters(allChapters);
        // Find current chapter index
        const currentIdx = allChapters.findIndex(
          (ch) => parseFloat(getChapterNumber(ch)) === parseFloat(chapter),
        );
        setCurrentChapterIndex(currentIdx >= 0 ? currentIdx : 0);
      }
    } catch (err) {
      console.error("Failed to load chapter pages:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageTap = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    setShowControls(!showControls);
  };

  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else if (currentPageIndex === pages.length - 1) {
      // At last page, automatically go to next chapter
      goToNextChapter();
    }
  };

  const goToPrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const goToNextChapter = async () => {
    if (currentChapterIndex < chapters.length - 1) {
      const nextChapter = chapters[currentChapterIndex + 1];
      const nextChapterNumber = getChapterNumber(nextChapter);
      if (nextChapterNumber === undefined || nextChapterNumber === null) {
        Alert.alert("Error", "Could not determine next chapter number");
        return;
      }
      navigation.replace("ChapterReader", {
        hash,
        chapter: nextChapterNumber.toString(),
        mangaTitle,
        isOffline,
        offlineChapters,
      });
    }
  };

  const goToPrevChapter = async () => {
    if (currentChapterIndex > 0) {
      const prevChapter = chapters[currentChapterIndex - 1];
      const prevChapterNumber = getChapterNumber(prevChapter);
      if (prevChapterNumber === undefined || prevChapterNumber === null) {
        Alert.alert("Error", "Could not determine previous chapter number");
        return;
      }
      navigation.replace("ChapterReader", {
        hash,
        chapter: prevChapterNumber.toString(),
        mangaTitle,
        isOffline,
        offlineChapters,
      });
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const isHorizontalSwipe =
            Math.abs(gestureState.dx) > 20 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
          return isHorizontalSwipe;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx <= -50) {
            didSwipeRef.current = true;
            goToNextPage();
          } else if (gestureState.dx >= 50) {
            didSwipeRef.current = true;
            goToPrevPage();
          }
        },
      }),
    [currentPageIndex, pages.length, currentChapterIndex, chapters.length],
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LoadingIndicator size="large" text="Loading chapter..." />
      </View>
    );
  }

  if (error) {
    return (
      <NetworkErrorView
        error={error}
        onRetry={() => {
          setError(null);
          setLoading(true);
          loadChapter();
        }}
        showDownloadsHint={true}
      />
    );
  }

  if (pages.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>No pages found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentPage = pages[currentPageIndex];

  const renderScrollPage = ({ item, index }) => (
    <PageImage
      source={{
        uri:
          typeof item === "string"
            ? item
            : item?.src || item?.url || item?.image,
      }}
      style={styles.scrollPageImage}
      resizeMode="contain"
      isScrollMode={true}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {readingMode === "scroll" ? (
        // Vertical scroll mode
        <View style={styles.scrollContainer}>
          <FlatList
            ref={scrollViewRef}
            data={pages}
            renderItem={renderScrollPage}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              currentChapterIndex < chapters.length - 1 ? (
                <TouchableOpacity
                  style={styles.nextChapterButton}
                  onPress={goToNextChapter}
                >
                  <Text style={styles.nextChapterButtonText}>Next Chapter</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>
              ) : null
            }
          />
          {/* Tap area to toggle controls in scroll mode */}
          {!showControls && (
            <TouchableOpacity
              style={styles.scrollTapArea}
              activeOpacity={1}
              onPress={() => setShowControls(true)}
            />
          )}
        </View>
      ) : (
        // Paginated mode
        <TouchableOpacity
          activeOpacity={1}
          onPress={handlePageTap}
          style={styles.pageContainer}
          {...panResponder.panHandlers}
        >
          <PageImage
            source={{
              uri:
                typeof currentPage === "string"
                  ? currentPage
                  : currentPage?.src || currentPage?.url || currentPage?.image,
            }}
            style={styles.pageImage}
            resizeMode="contain"
            isScrollMode={false}
          />

          {/* Tap zones for navigation */}
          <TouchableOpacity
            style={styles.leftTapZone}
            onPress={goToPrevPage}
            activeOpacity={0}
          />
          <TouchableOpacity
            style={styles.rightTapZone}
            onPress={goToNextPage}
            activeOpacity={0}
          />
        </TouchableOpacity>
      )}

      {/* Controls */}
      {showControls && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.overlayDismissArea}
            activeOpacity={1}
            onPress={() => setShowControls(false)}
          />

          <View style={[styles.controlsTop, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.controlsTitle} numberOfLines={1}>
              {mangaTitle}
            </Text>
            <View style={styles.controlsTopRight}>
              <TouchableOpacity
                onPress={toggleReadingMode}
                style={styles.modeToggleButton}
              >
                <Ionicons
                  name={
                    readingMode === "scroll" ? "albums-outline" : "list-outline"
                  }
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowControls(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.controlsBottom}>
            <TouchableOpacity
              onPress={goToPrevChapter}
              disabled={currentChapterIndex === 0}
              style={styles.chapterNavButton}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={currentChapterIndex === 0 ? "#666" : "#fff"}
              />
              <Text
                style={{
                  color: currentChapterIndex === 0 ? "#666" : "#fff",
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
                Prev
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goToPrevPage}
              disabled={currentPageIndex === 0}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={currentPageIndex === 0 ? "#999" : "#fff"}
              />
            </TouchableOpacity>

            <Text style={styles.pageInfo}>
              {currentPageIndex + 1} / {pages.length}
            </Text>

            <TouchableOpacity
              onPress={goToNextPage}
              disabled={currentPageIndex === pages.length - 1}
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={currentPageIndex === pages.length - 1 ? "#999" : "#fff"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goToNextChapter}
              disabled={currentChapterIndex === chapters.length - 1}
              style={styles.chapterNavButton}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={
                  currentChapterIndex === chapters.length - 1 ? "#666" : "#fff"
                }
              />
              <Text
                style={{
                  color:
                    currentChapterIndex === chapters.length - 1
                      ? "#666"
                      : "#fff",
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
                Next
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  pageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  pageImage: {
    backgroundColor: "#000",
  },
  leftTapZone: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.25,
  },
  rightTapZone: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: width * 0.25,
  },
  controls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "space-between",
  },
  controlsTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 2,
  },
  controlsTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginHorizontal: 12,
    textAlign: "center",
  },
  controlsBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 2,
  },
  overlayDismissArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  pageInfo: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    minWidth: 80,
    textAlign: "center",
  },
  chapterNavButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  loadingText: {
    color: "#999",
    marginTop: 16,
    fontSize: 14,
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
  scrollPageImage: {
    backgroundColor: "#080808",
  },
  scrollPageWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    backgroundColor: "#080808",
  },
  paginatedPageWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  pageLoadingPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  nextChapterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d0368a",
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginVertical: 20,
    marginHorizontal: 40,
    borderRadius: 12,
    gap: 8,
  },
  nextChapterButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollTapArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  controlsTopRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modeToggleButton: {
    padding: 4,
  },
});
