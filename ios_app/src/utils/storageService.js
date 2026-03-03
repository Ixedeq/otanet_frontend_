import AsyncStorage from "@react-native-async-storage/async-storage";

const BOOKMARKS_KEY = "@otanet_bookmarks";
const DOWNLOADS_KEY = "@otanet_downloads";
const READ_CHAPTERS_KEY_PREFIX = "@otanet_read_chapters_";
const SETTINGS_KEY = "@otanet_settings";
const ACTIVE_DOWNLOADS_KEY = "@otanet_active_downloads";

// Estimated average page size in bytes (varies, but ~200KB is reasonable)
const ESTIMATED_PAGE_SIZE = 200 * 1024;

export const storageService = {
  /**
   * Get all bookmarks
   */
  getBookmarks: async () => {
    try {
      const data = await AsyncStorage.getItem(BOOKMARKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
      return [];
    }
  },

  /**
   * Add bookmark
   */
  addBookmark: async (manga) => {
    try {
      const bookmarks = await storageService.getBookmarks();
      if (!bookmarks.find((b) => b.hash === manga.hash)) {
        bookmarks.push({
          ...manga,
          bookmarkedAt: new Date().toISOString(),
        });
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      }
      return bookmarks;
    } catch (error) {
      console.error("Failed to add bookmark:", error);
      throw error;
    }
  },

  /**
   * Remove bookmark
   */
  removeBookmark: async (hash) => {
    try {
      let bookmarks = await storageService.getBookmarks();
      bookmarks = bookmarks.filter((b) => b.hash !== hash);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      return bookmarks;
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
      throw error;
    }
  },

  /**
   * Save all bookmarks (for bulk updates)
   */
  saveBookmarks: async (bookmarks) => {
    try {
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      return bookmarks;
    } catch (error) {
      console.error("Failed to save bookmarks:", error);
      throw error;
    }
  },

  /**
   * Check if manga is bookmarked
   */
  isBookmarked: async (hash) => {
    try {
      const bookmarks = await storageService.getBookmarks();
      return bookmarks.some((b) => b.hash === hash);
    } catch (error) {
      console.error("Failed to check bookmark:", error);
      return false;
    }
  },

  /**
   * Get read chapters for a manga
   */
  getReadChapters: async (mangaHash) => {
    try {
      const key = `${READ_CHAPTERS_KEY_PREFIX}${mangaHash}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load read chapters:", error);
      return [];
    }
  },

  /**
   * Mark chapter as read
   */
  markChapterAsRead: async (mangaHash, chapterNumber) => {
    try {
      const key = `${READ_CHAPTERS_KEY_PREFIX}${mangaHash}`;
      const read = await storageService.getReadChapters(mangaHash);

      if (!read.includes(chapterNumber)) {
        read.push(chapterNumber);
        read.sort((a, b) => a - b);
        await AsyncStorage.setItem(key, JSON.stringify(read));
      }
      return read;
    } catch (error) {
      console.error("Failed to mark chapter as read:", error);
      throw error;
    }
  },

  /**
   * Clear all read chapters for a manga
   */
  clearReadChapters: async (mangaHash) => {
    try {
      const key = `${READ_CHAPTERS_KEY_PREFIX}${mangaHash}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error("Failed to clear read chapters:", error);
      throw error;
    }
  },

  // ===== DOWNLOADS MANAGEMENT =====

  /**
   * Get all downloads
   */
  getDownloads: async () => {
    try {
      const data = await AsyncStorage.getItem(DOWNLOADS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load downloads:", error);
      return [];
    }
  },

  /**
   * Add a download
   */
  addDownload: async (manga, chapters = []) => {
    try {
      const downloads = await storageService.getDownloads();
      const existingIndex = downloads.findIndex((d) => d.hash === manga.hash);

      const downloadData = {
        ...manga,
        chapters,
        downloadedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        downloads[existingIndex] = downloadData;
      } else {
        downloads.push(downloadData);
      }

      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
      return downloads;
    } catch (error) {
      console.error("Failed to add download:", error);
      throw error;
    }
  },

  /**
   * Update download with new chapters
   */
  updateDownload: async (hash, chapters) => {
    try {
      const downloads = await storageService.getDownloads();
      const download = downloads.find((d) => d.hash === hash);

      if (download) {
        download.chapters = chapters;
        download.updatedAt = new Date().toISOString();
        await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
      }

      return downloads;
    } catch (error) {
      console.error("Failed to update download:", error);
      throw error;
    }
  },

  /**
   * Add a single chapter to an existing download (or create new download)
   */
  addChapterToDownload: async (manga, chapterData) => {
    try {
      const downloads = await storageService.getDownloads();
      const existingIndex = downloads.findIndex((d) => d.hash === manga.hash);

      if (existingIndex >= 0) {
        // Add to existing download
        const existing = downloads[existingIndex];
        const chapterExists = existing.chapters?.some(
          (ch) => String(ch.number) === String(chapterData.number),
        );

        if (!chapterExists) {
          existing.chapters = [...(existing.chapters || []), chapterData];
          existing.totalSize =
            (existing.totalSize || 0) + (chapterData.size || 0);
          existing.updatedAt = new Date().toISOString();
        }
      } else {
        // Create new download entry
        downloads.push({
          ...manga,
          chapters: [chapterData],
          totalSize: chapterData.size || 0,
          downloadedAt: new Date().toISOString(),
        });
      }

      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
      return downloads;
    } catch (error) {
      console.error("Failed to add chapter to download:", error);
      throw error;
    }
  },

  /**
   * Remove a download
   */
  removeDownload: async (hash) => {
    try {
      let downloads = await storageService.getDownloads();
      downloads = downloads.filter((d) => d.hash !== hash);
      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
      return downloads;
    } catch (error) {
      console.error("Failed to remove download:", error);
      throw error;
    }
  },

  /**
   * Check if manga is downloaded
   */
  isDownloaded: async (hash) => {
    try {
      const downloads = await storageService.getDownloads();
      return downloads.some((d) => d.hash === hash);
    } catch (error) {
      console.error("Failed to check download:", error);
      return false;
    }
  },

  /**
   * Get downloaded chapter numbers for a manga
   */
  getDownloadedChapters: async (hash) => {
    try {
      const downloads = await storageService.getDownloads();
      const download = downloads.find((d) => d.hash === hash);
      if (download && download.chapters) {
        return download.chapters.map((ch) => String(ch.number));
      }
      return [];
    } catch (error) {
      console.error("Failed to get downloaded chapters:", error);
      return [];
    }
  },

  /**
   * Get download progress
   */
  getDownloadProgress: async (hash) => {
    try {
      const downloads = await storageService.getDownloads();
      const download = downloads.find((d) => d.hash === hash);
      return download ? { chapters: download.chapters || [] } : null;
    } catch (error) {
      console.error("Failed to get download progress:", error);
      return null;
    }
  },

  // ===== SETTINGS MANAGEMENT =====

  /**
   * Get all settings
   */
  getSettings: async () => {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Failed to load settings:", error);
      return {};
    }
  },

  /**
   * Save settings
   */
  saveSettings: async (settings) => {
    try {
      const current = await storageService.getSettings();
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error("Failed to save settings:", error);
      throw error;
    }
  },

  /**
   * Get reading mode preference
   * @returns {'paginated' | 'scroll'}
   */
  getReadingMode: async () => {
    try {
      const settings = await storageService.getSettings();
      return settings.readingMode || "paginated";
    } catch (error) {
      console.error("Failed to get reading mode:", error);
      return "paginated";
    }
  },

  /**
   * Set reading mode preference
   * @param {'paginated' | 'scroll'} mode
   */
  setReadingMode: async (mode) => {
    try {
      await storageService.saveSettings({ readingMode: mode });
      return mode;
    } catch (error) {
      console.error("Failed to set reading mode:", error);
      throw error;
    }
  },

  // ===== ACTIVE DOWNLOADS MANAGEMENT =====

  /**
   * Get active downloads (in progress)
   */
  getActiveDownloads: async () => {
    try {
      const data = await AsyncStorage.getItem(ACTIVE_DOWNLOADS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Failed to load active downloads:", error);
      return {};
    }
  },

  /**
   * Set active download status
   */
  setActiveDownload: async (hash, status) => {
    try {
      const active = await storageService.getActiveDownloads();
      if (status === null) {
        delete active[hash];
      } else {
        active[hash] = {
          ...status,
          updatedAt: new Date().toISOString(),
        };
      }
      await AsyncStorage.setItem(ACTIVE_DOWNLOADS_KEY, JSON.stringify(active));
      return active;
    } catch (error) {
      console.error("Failed to set active download:", error);
      throw error;
    }
  },

  /**
   * Clear active download
   */
  clearActiveDownload: async (hash) => {
    return storageService.setActiveDownload(hash, null);
  },

  /**
   * Calculate estimated size for chapters
   */
  calculateChapterSize: (pageCount) => {
    return pageCount * ESTIMATED_PAGE_SIZE;
  },
};

export default storageService;
