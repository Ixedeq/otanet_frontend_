import React, { createContext, useContext, useState, useCallback } from "react";
import storageService from "../utils/storageService";
import apiService from "../api/apiService";

const UnreadContext = createContext();

export function UnreadProvider({ children }) {
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshUnreadCounts = useCallback(async () => {
    try {
      setLoading(true);
      const bookmarks = await storageService.getBookmarks();

      if (bookmarks.length === 0) {
        setUnreadCounts({});
        setTotalUnread(0);
        return;
      }

      const counts = {};
      let total = 0;

      // Fetch chapter counts and read chapters for all bookmarks in parallel
      await Promise.all(
        bookmarks.map(async (bookmark) => {
          try {
            const chapters = await apiService.getChapters(bookmark.hash);
            const readChapters = await storageService.getReadChapters(
              bookmark.hash,
            );
            const currentCount = Array.isArray(chapters) ? chapters.length : 0;
            const bookmarkedCount = bookmark.chapterCountAtBookmark || 0;

            // Get chapter numbers for chapters released after bookmarking
            const newChapters = Array.isArray(chapters)
              ? chapters.slice(bookmarkedCount).map((ch) => {
                  if (typeof ch === "number" || typeof ch === "string") {
                    return parseFloat(ch);
                  }
                  return parseFloat(
                    ch?.number ?? ch?.chapterNumber ?? ch?.chapter ?? 0,
                  );
                })
              : [];

            // Count chapters that are new AND not read
            const unread = newChapters.filter(
              (chNum) => !readChapters.includes(chNum),
            ).length;

            counts[bookmark.hash] = {
              unread,
              currentCount,
              bookmarkedCount,
            };
            total += unread;
          } catch (error) {
            console.error(
              `Failed to fetch chapters for ${bookmark.hash}:`,
              error,
            );
            counts[bookmark.hash] = {
              unread: 0,
              currentCount: 0,
              bookmarkedCount: 0,
            };
          }
        }),
      );

      setUnreadCounts(counts);
      setTotalUnread(total);
    } catch (error) {
      console.error("Failed to refresh unread counts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark a single chapter as read (decrements unread by 1)
  const markChapterRead = useCallback((hash, chapterNumber) => {
    setUnreadCounts((prev) => {
      const current = prev[hash];
      if (!current || current.unread <= 0) return prev;

      return {
        ...prev,
        [hash]: { ...current, unread: current.unread - 1 },
      };
    });
    setTotalUnread((prev) => Math.max(0, prev - 1));
  }, []);

  // Mark a manga as "caught up" (update the bookmarked chapter count)
  const markAsCaughtUp = useCallback(
    async (hash) => {
      try {
        const bookmarks = await storageService.getBookmarks();
        const chapters = await apiService.getChapters(hash);
        const currentCount = Array.isArray(chapters) ? chapters.length : 0;

        const updatedBookmarks = bookmarks.map((b) =>
          b.hash === hash ? { ...b, chapterCountAtBookmark: currentCount } : b,
        );

        await storageService.saveBookmarks(updatedBookmarks);

        // Update local state
        setUnreadCounts((prev) => ({
          ...prev,
          [hash]: { ...prev[hash], unread: 0, bookmarkedCount: currentCount },
        }));
        setTotalUnread((prev) => prev - (unreadCounts[hash]?.unread || 0));
      } catch (error) {
        console.error("Failed to mark as caught up:", error);
      }
    },
    [unreadCounts],
  );

  return (
    <UnreadContext.Provider
      value={{
        unreadCounts,
        totalUnread,
        loading,
        refreshUnreadCounts,
        markChapterRead,
        markAsCaughtUp,
      }}
    >
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread() {
  const context = useContext(UnreadContext);
  if (!context) {
    throw new Error("useUnread must be used within an UnreadProvider");
  }
  return context;
}

export default UnreadContext;
