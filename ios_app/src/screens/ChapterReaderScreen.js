import React, { useRef, useState, useEffect, useCallback } from "react";
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
  Animated,
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

// ── Pinch-to-zoom wrapper ──────────────────────────────────────────────────
const getDistance = (touches) => {
  const dx = touches[0].pageX - touches[1].pageX;
  const dy = touches[0].pageY - touches[1].pageY;
  return Math.sqrt(dx * dx + dy * dy);
};

const ZoomableImage = React.memo(({ children, onSingleTap, onSwipeStart, onSwipeMove, onSwipeEnd, enabled = true }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const pinchRef = useRef({ active: false, startDist: 0, startScale: 1 });
  const panRef = useRef({ active: false, startX: 0, startY: 0, startTX: 0, startTY: 0 });
  const touchCountRef = useRef(0);
  const lastTapRef = useRef(0);
  const tapPosRef = useRef({ x: 0, y: 0 });
  const didPinchOrPanRef = useRef(false);   // true if pinch or zoomed-pan occurred
  const totalMoveRef = useRef(0);            // total finger movement in px
  const isZoomedRef = useRef(false);
  const singleTapTimerRef = useRef(null);
  const TAP_MOVE_TOLERANCE = 10;             // max px movement to still count as a tap

  const resetZoom = useCallback((animated = true) => {
    scaleRef.current = 1;
    translateRef.current = { x: 0, y: 0 };
    isZoomedRef.current = false;
    if (animated) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 12 }),
        Animated.spring(translateXAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 12 }),
        Animated.spring(translateYAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 12 }),
      ]).start();
    } else {
      scaleAnim.setValue(1);
      translateXAnim.setValue(0);
      translateYAnim.setValue(0);
    }
  }, [scaleAnim, translateXAnim, translateYAnim]);

  const clampTranslate = useCallback((tx, ty, s) => {
    const maxTX = Math.max(0, (width * s - width) / 2);
    const maxTY = Math.max(0, (screenHeight * 0.85 * s - screenHeight * 0.85) / 2);
    return {
      x: Math.max(-maxTX, Math.min(maxTX, tx)),
      y: Math.max(-maxTY, Math.min(maxTY, ty)),
    };
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;
    const touches = e.nativeEvent.touches;
    touchCountRef.current = touches.length;
    didPinchOrPanRef.current = false;
    totalMoveRef.current = 0;

    if (touches.length === 2) {
      didPinchOrPanRef.current = true;
      pinchRef.current = {
        active: true,
        startDist: getDistance(touches),
        startScale: scaleRef.current,
      };
      panRef.current.active = false;
    } else if (touches.length === 1) {
      tapPosRef.current = { x: touches[0].pageX, y: touches[0].pageY };
      if (isZoomedRef.current) {
        didPinchOrPanRef.current = true;
        panRef.current = {
          active: true,
          startX: touches[0].pageX,
          startY: touches[0].pageY,
          startTX: translateRef.current.x,
          startTY: translateRef.current.y,
        };
      } else {
        // Not zoomed — forward to swipe start
        if (onSwipeStart) onSwipeStart(e);
      }
    }
  }, [enabled, onSwipeStart]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled) return;
    const touches = e.nativeEvent.touches;

    if (touches.length === 2 && pinchRef.current.active) {
      const dist = getDistance(touches);
      const newScale = Math.max(1, Math.min(5, pinchRef.current.startScale * (dist / pinchRef.current.startDist)));
      scaleRef.current = newScale;
      isZoomedRef.current = newScale > 1.05;
      scaleAnim.setValue(newScale);

      const clamped = clampTranslate(translateRef.current.x, translateRef.current.y, newScale);
      translateRef.current = clamped;
      translateXAnim.setValue(clamped.x);
      translateYAnim.setValue(clamped.y);
    } else if (touches.length === 1 && panRef.current.active && isZoomedRef.current) {
      const dx = touches[0].pageX - panRef.current.startX;
      const dy = touches[0].pageY - panRef.current.startY;
      const clamped = clampTranslate(panRef.current.startTX + dx, panRef.current.startTY + dy, scaleRef.current);
      translateRef.current = clamped;
      translateXAnim.setValue(clamped.x);
      translateYAnim.setValue(clamped.y);
    } else if (touches.length === 1 && !isZoomedRef.current && !pinchRef.current.active) {
      // Not zoomed — track movement and forward to swipe move
      const dx = touches[0].pageX - tapPosRef.current.x;
      const dy = touches[0].pageY - tapPosRef.current.y;
      totalMoveRef.current = Math.sqrt(dx * dx + dy * dy);
      if (onSwipeMove) onSwipeMove(e);
    }
  }, [enabled, scaleAnim, translateXAnim, translateYAnim, clampTranslate, onSwipeMove]);

  const handleTouchEnd = useCallback((e) => {
    if (!enabled) return;
    const remainingCount = e.nativeEvent.touches?.length || 0;

    // Pinch just ended (lifted one of two fingers)
    if (pinchRef.current.active && remainingCount < 2) {
      pinchRef.current.active = false;
      if (scaleRef.current < 1.1) {
        resetZoom();
      }
      return;
    }

    // Zoomed pan ended
    if (panRef.current.active && remainingCount === 0) {
      panRef.current.active = false;
      return;
    }

    // All fingers lifted
    if (remainingCount === 0) {
      // Always forward swipe end so the swipe handler can finalize
      if (!isZoomedRef.current && !didPinchOrPanRef.current) {
        if (onSwipeEnd) onSwipeEnd(e);
      }

      // Tap detection: only if finger barely moved, single finger, no pinch/pan
      const isTap = totalMoveRef.current < TAP_MOVE_TOLERANCE;
      if (isTap && !didPinchOrPanRef.current && touchCountRef.current === 1) {
        const now = Date.now();
        const tapX = tapPosRef.current.x;
        const tapY = tapPosRef.current.y;

        if (now - lastTapRef.current < 300) {
          // Double-tap: toggle zoom
          if (singleTapTimerRef.current) {
            clearTimeout(singleTapTimerRef.current);
            singleTapTimerRef.current = null;
          }
          if (isZoomedRef.current) {
            resetZoom();
          } else {
            const targetScale = 2.5;
            scaleRef.current = targetScale;
            isZoomedRef.current = true;
            const centerX = width / 2;
            const centerY = screenHeight * 0.85 / 2;
            const focusX = (centerX - tapX) * (targetScale - 1);
            const focusY = (centerY - tapY) * (targetScale - 1);
            const clamped = clampTranslate(focusX, focusY, targetScale);
            translateRef.current = clamped;
            Animated.parallel([
              Animated.spring(scaleAnim, { toValue: targetScale, useNativeDriver: true, tension: 100, friction: 12 }),
              Animated.spring(translateXAnim, { toValue: clamped.x, useNativeDriver: true, tension: 100, friction: 12 }),
              Animated.spring(translateYAnim, { toValue: clamped.y, useNativeDriver: true, tension: 100, friction: 12 }),
            ]).start();
          }
          lastTapRef.current = 0;
        } else {
          lastTapRef.current = now;
          // Delayed single tap — wait to rule out double-tap
          singleTapTimerRef.current = setTimeout(() => {
            singleTapTimerRef.current = null;
            if (!isZoomedRef.current && onSingleTap) {
              // Build a synthetic event with pageX so the handler can detect zones
              onSingleTap({ nativeEvent: { pageX: tapX, pageY: tapY } });
            }
          }, 300);
        }
      }

      didPinchOrPanRef.current = false;
      totalMoveRef.current = 0;
    }
  }, [enabled, resetZoom, clampTranslate, scaleAnim, translateXAnim, translateYAnim, onSingleTap, onSwipeEnd]);

  return (
    <View
      style={{ flex: 1 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Animated.View
        style={{
          flex: 1,
          transform: [
            { translateX: translateXAnim },
            { translateY: translateYAnim },
            { scale: scaleAnim },
          ],
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
});

// Helper to build image source with proper headers for external CDNs
const buildImageSource = (uri) => {
  if (!uri) return { uri: '' };
  // MangaDex CDN requires proper User-Agent header
  if (uri.includes('mangadex.org') || uri.includes('mangadex.network')) {
    return {
      uri,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://mangadex.org/',
      },
    };
  }
  return { uri };
};

// Cache for image dimensions to avoid re-measuring on page changes
const imageDimensionsCache = {};

// Page image component that maintains uniform sizing
const PageImage = React.memo(({ source, style, resizeMode, isScrollMode }) => {
  const uri = source?.uri;
  const cached = uri ? imageDimensionsCache[uri] : null;

  const getDefaultDims = () => {
    if (cached) return cached;
    return {
      width: width,
      height: isScrollMode ? width / DEFAULT_ASPECT_RATIO : screenHeight * 0.85,
    };
  };

  const [dimensions, setDimensions] = useState(getDefaultDims);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const computeDimensions = useCallback((imgWidth, imgHeight) => {
    if (!imgWidth || !imgHeight) return;
    const aspectRatio = imgWidth / imgHeight;
    let dims;
    if (isScrollMode) {
      dims = { width: width, height: width / aspectRatio };
    } else {
      const maxHeight = screenHeight * 0.85;
      let finalWidth = width;
      let finalHeight = width / aspectRatio;
      if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = maxHeight * aspectRatio;
      }
      dims = { width: finalWidth, height: finalHeight };
    }
    if (uri) imageDimensionsCache[uri] = dims;
    setDimensions(dims);
  }, [uri, isScrollMode]);

  useEffect(() => {
    if (!uri) return;
    // If already cached, use it immediately
    if (imageDimensionsCache[uri]) {
      setDimensions(imageDimensionsCache[uri]);
      return;
    }

    Image.getSize(
      uri,
      (imgWidth, imgHeight) => {
        computeDimensions(imgWidth, imgHeight);
      },
      () => {
        // getSize failed — keep defaults, Image might still render
        setDimensions({
          width: width,
          height: isScrollMode ? width / DEFAULT_ASPECT_RATIO : screenHeight * 0.85,
        });
      },
    );
  }, [uri, isScrollMode, computeDimensions]);

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
        onLoad={(e) => {
          setLoaded(true);
          // Also use the load event to get dimensions if getSize was slow
          const { width: natW, height: natH } = e.nativeEvent?.source || {};
          if (natW && natH && !imageDimensionsCache[uri]) {
            computeDimensions(natW, natH);
          }
        }}
        onError={() => {
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
  const scrollViewRef = useRef(null);

  // ── Custom swipe gesture state (avoids stale closure bugs) ──
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const pageOpacity = useRef(new Animated.Value(1)).current;
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const isSwipingRef = useRef(false);
  const swipeLockedRef = useRef(false); // locks to horizontal once confirmed
  const currentPageRef = useRef(0);
  const pagesRef = useRef([]);
  const currentChapterRef = useRef(0);
  const chaptersRef = useRef([]);
  const isAnimatingRef = useRef(false); // prevent input during page transition

  // Keep refs in sync with state
  useEffect(() => { currentPageRef.current = currentPageIndex; }, [currentPageIndex]);
  useEffect(() => { pagesRef.current = pages; }, [pages]);
  useEffect(() => { currentChapterRef.current = currentChapterIndex; }, [currentChapterIndex]);
  useEffect(() => { chaptersRef.current = chapters; }, [chapters]);

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

  const goToNextChapter = useCallback(() => {
    const chIdx = currentChapterRef.current;
    const chs = chaptersRef.current;
    if (chIdx < chs.length - 1) {
      const nextChapter = chs[chIdx + 1];
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
  }, [hash, mangaTitle, isOffline, offlineChapters, navigation]);

  const goToPrevChapter = useCallback(() => {
    const chIdx = currentChapterRef.current;
    const chs = chaptersRef.current;
    if (chIdx > 0) {
      const prevChapter = chs[chIdx - 1];
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
  }, [hash, mangaTitle, isOffline, offlineChapters, navigation]);

  const goToNextPage = useCallback(() => {
    if (currentPageRef.current < pagesRef.current.length - 1) {
      setCurrentPageIndex(currentPageRef.current + 1);
    } else if (currentPageRef.current === pagesRef.current.length - 1) {
      goToNextChapter();
    }
  }, [goToNextChapter]);

  const goToPrevPage = useCallback(() => {
    if (currentPageRef.current > 0) {
      setCurrentPageIndex(currentPageRef.current - 1);
    } else if (currentPageRef.current === 0) {
      goToPrevChapter();
    }
  }, [goToPrevChapter]);

  // Animated page change for tap zones (not swipes — swipes have their own animation)
  const animatedGoToNextPage = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    Animated.timing(pageOpacity, {
      toValue: 0,
      duration: 80,
      useNativeDriver: true,
    }).start(() => {
      goToNextPage();
      Animated.timing(pageOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        isAnimatingRef.current = false;
      });
    });
  }, [pageOpacity, goToNextPage]);

  const animatedGoToPrevPage = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    Animated.timing(pageOpacity, {
      toValue: 0,
      duration: 80,
      useNativeDriver: true,
    }).start(() => {
      goToPrevPage();
      Animated.timing(pageOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        isAnimatingRef.current = false;
      });
    });
  }, [pageOpacity, goToPrevPage]);

  // ── Custom swipe gesture handlers ──
  const SWIPE_THRESHOLD = 60;        // minimum dx to trigger a page change
  const VELOCITY_THRESHOLD = 0.3;    // fast flick threshold (px/ms)
  const LOCK_THRESHOLD = 15;         // px moved before we decide horizontal vs vertical
  const EDGE_PEEK = 40;              // how much of the next/prev page peeks during drag

  const onSwipeTouchStart = useCallback((e) => {
    if (isAnimatingRef.current) return;
    const touch = e.nativeEvent.touches?.[0] || e.nativeEvent;
    touchStartRef.current = { x: touch.pageX, y: touch.pageY, time: Date.now() };
    isSwipingRef.current = false;
    swipeLockedRef.current = false;
    swipeAnim.setValue(0);
  }, [swipeAnim]);

  const onSwipeTouchMove = useCallback((e) => {
    if (isAnimatingRef.current) return;
    const touch = e.nativeEvent.touches?.[0] || e.nativeEvent;
    const dx = touch.pageX - touchStartRef.current.x;
    const dy = touch.pageY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Decide direction once we pass the lock threshold
    if (!swipeLockedRef.current && (absDx > LOCK_THRESHOLD || absDy > LOCK_THRESHOLD)) {
      if (absDx > absDy * 1.2) {
        // Horizontal swipe confirmed
        swipeLockedRef.current = true;
        isSwipingRef.current = true;
      } else {
        // Vertical — bail out, don't handle
        swipeLockedRef.current = true;
        isSwipingRef.current = false;
        return;
      }
    }

    if (!isSwipingRef.current) return;

    // Apply resistance at the edges (can't swipe right on first page, left on last)
    const pageIdx = currentPageRef.current;
    const totalPages = pagesRef.current.length;
    let clampedDx = dx;

    if (dx > 0 && pageIdx === 0 && currentChapterRef.current === 0) {
      // First page of first chapter — heavy resistance
      clampedDx = dx * 0.15;
    } else if (dx < 0 && pageIdx === totalPages - 1 && currentChapterRef.current >= chaptersRef.current.length - 1) {
      // Last page of last chapter — heavy resistance
      clampedDx = dx * 0.15;
    }

    swipeAnim.setValue(clampedDx);
  }, [swipeAnim]);

  const onSwipeTouchEnd = useCallback((e) => {
    if (!isSwipingRef.current || isAnimatingRef.current) return;
    isSwipingRef.current = false;

    const touch = e.nativeEvent.changedTouches?.[0] || e.nativeEvent;
    const dx = touch.pageX - touchStartRef.current.x;
    const dt = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(dx) / Math.max(dt, 1);

    const shouldNavigate = Math.abs(dx) > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD;

    if (shouldNavigate && dx < 0) {
      // Swipe left → next page — slide off then fade new page in
      isAnimatingRef.current = true;
      Animated.timing(swipeAnim, {
        toValue: -width,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        pageOpacity.setValue(0);
        swipeAnim.setValue(0);
        goToNextPage();
        // Fade the new page in quickly
        Animated.timing(pageOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }).start(() => {
          isAnimatingRef.current = false;
        });
      });
    } else if (shouldNavigate && dx > 0) {
      // Swipe right → prev page — slide off then fade new page in
      isAnimatingRef.current = true;
      Animated.timing(swipeAnim, {
        toValue: width,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        pageOpacity.setValue(0);
        swipeAnim.setValue(0);
        goToPrevPage();
        Animated.timing(pageOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }).start(() => {
          isAnimatingRef.current = false;
        });
      });
    } else {
      // Snap back
      Animated.spring(swipeAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 120,
        friction: 12,
      }).start();
    }
  }, [swipeAnim, pageOpacity, goToNextPage, goToPrevPage]);

  // ── Scroll-mode chapter transition ──
  const scrollChapterCooldownRef = useRef(false);
  const OVERSCROLL_THRESHOLD = 80;

  const handleScroll = useCallback((event) => {
    if (scrollChapterCooldownRef.current) return;
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxOffset = contentSize.height - layoutMeasurement.height;

    if (contentOffset.y < -OVERSCROLL_THRESHOLD) {
      scrollChapterCooldownRef.current = true;
      goToPrevChapter();
    } else if (maxOffset > 0 && contentOffset.y > maxOffset + OVERSCROLL_THRESHOLD) {
      scrollChapterCooldownRef.current = true;
      goToNextChapter();
    }
  }, [goToPrevChapter, goToNextChapter]);

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

  const getPageUri = (item) => {
    const raw = typeof item === "string" ? item : item?.src || item?.url || item?.image;
    return raw || '';
  };

  const renderScrollPage = ({ item, index }) => (
    <PageImage
      source={buildImageSource(getPageUri(item))}
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
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListHeaderComponent={
              currentChapterIndex > 0 ? (
                <View style={styles.chapterTransitionHint}>
                  <Ionicons name="chevron-up" size={16} color="#666" />
                  <Text style={styles.chapterTransitionHintText}>Pull to load previous chapter</Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              currentChapterIndex < chapters.length - 1 ? (
                <View style={styles.chapterTransitionHint}>
                  <Text style={styles.chapterTransitionHintText}>Keep scrolling for next chapter</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </View>
              ) : (
                <View style={styles.chapterTransitionHint}>
                  <Text style={styles.chapterTransitionHintText}>Last chapter</Text>
                </View>
              )
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
        // Paginated mode with pinch zoom + swipe gestures
        <ZoomableImage
          onSingleTap={(e) => {
            const touchX = e.nativeEvent.pageX || e.nativeEvent.touches?.[0]?.pageX || width / 2;
            const zoneWidth = width * 0.25;
            if (touchX < zoneWidth) {
              animatedGoToPrevPage();
            } else if (touchX > width - zoneWidth) {
              animatedGoToNextPage();
            } else {
              setShowControls((prev) => !prev);
            }
          }}
          onSwipeStart={onSwipeTouchStart}
          onSwipeMove={onSwipeTouchMove}
          onSwipeEnd={onSwipeTouchEnd}
        >
          <Animated.View
            style={[
              styles.swipeablePageWrapper,
              { 
                transform: [{ translateX: swipeAnim }],
                opacity: pageOpacity,
              },
            ]}
          >
            <PageImage
              source={buildImageSource(getPageUri(currentPage))}
              style={styles.pageImage}
              resizeMode="contain"
              isScrollMode={false}
            />
          </Animated.View>

          {/* Swipe direction indicators */}
          <Animated.View
            style={[
              styles.swipeIndicator,
              styles.swipeIndicatorLeft,
              {
                opacity: swipeAnim.interpolate({
                  inputRange: [0, 60],
                  outputRange: [0, 0.8],
                  extrapolate: "clamp",
                }),
              },
            ]}
            pointerEvents="none"
          >
            <Ionicons name="chevron-back" size={32} color="#fff" />
          </Animated.View>
          <Animated.View
            style={[
              styles.swipeIndicator,
              styles.swipeIndicatorRight,
              {
                opacity: swipeAnim.interpolate({
                  inputRange: [-60, 0],
                  outputRange: [0.8, 0],
                  extrapolate: "clamp",
                }),
              },
            ]}
            pointerEvents="none"
          >
            <Ionicons name="chevron-forward" size={32} color="#fff" />
          </Animated.View>
        </ZoomableImage>
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
              {mangaTitle}{chapter ? ` - Chapter ${chapter}` : ""}
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
    overflow: "hidden",
  },
  swipeablePageWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  pageImage: {
    backgroundColor: "#000",
  },
  tapZoneRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  leftTapZone: {
    flex: 1,
  },
  centerTapZone: {
    flex: 2,
  },
  rightTapZone: {
    flex: 1,
  },
  swipeIndicator: {
    position: "absolute",
    top: "45%",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  swipeIndicatorLeft: {
    left: 8,
  },
  swipeIndicatorRight: {
    right: 8,
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
  chapterTransitionHint: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 4,
  },
  chapterTransitionHintText: {
    color: "#555",
    fontSize: 13,
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
