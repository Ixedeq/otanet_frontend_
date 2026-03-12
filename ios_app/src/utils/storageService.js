import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

const BOOKMARKS_KEY = "@otanet_bookmarks";
const DOWNLOADS_DIR = `${FileSystem.documentDirectory}otanet_downloads/`;
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
      const chapterStr = String(chapterNumber);

      // Check using string comparison for consistency
      const alreadyRead = read.map((c) => String(c)).includes(chapterStr);
      if (!alreadyRead) {
        read.push(chapterStr);
        read.sort((a, b) => parseFloat(a) - parseFloat(b));
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
   * Repair downloads that are missing local cover images
   * Call this on app startup to fix existing downloads
   */
  repairDownloadCovers: async () => {
    try {
      const downloads = await storageService.getDownloads();
      let needsSave = false;

      for (const download of downloads) {
        // Skip if already has local cover
        if (download.localCoverPath) {
          // Verify the file still exists
          const coverInfo = await FileSystem.getInfoAsync(
            download.localCoverPath,
          );
          if (coverInfo.exists) {
            continue;
          }
          // File doesn't exist, re-download
        }

        // Try to download cover if we have a remote URL
        if (download.cover_img) {
          await storageService.ensureDownloadsDir();
          const mangaDir = storageService.getMangaDownloadDir(download.hash);

          // Create manga directory if needed
          const dirInfo = await FileSystem.getInfoAsync(mangaDir);
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(mangaDir, {
              intermediates: true,
            });
          }

          const coverExt =
            download.cover_img.split(".").pop()?.split("?")[0] || "jpg";
          const localCoverPath = `${mangaDir}cover.${coverExt}`;

          const success = await storageService.downloadImage(
            download.cover_img,
            localCoverPath,
          );
          if (success) {
            download.localCoverPath = localCoverPath;
            needsSave = true;
            console.log(`Repaired cover for: ${download.title}`);
          }
        }
      }

      if (needsSave) {
        await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
        console.log("Download covers repaired and saved");
      }

      return downloads;
    } catch (error) {
      console.error("Failed to repair download covers:", error);
      return storageService.getDownloads();
    }
  },

  /**
   * Check if a download needs repair (has chapters without local storage)
   */
  downloadNeedsRepair: (download) => {
    if (!download.chapters || download.chapters.length === 0) return false;

    const needsRepair = download.chapters.some((ch) => {
      // Check if any chapter is missing the isLocallyStored flag
      if (!ch.isLocallyStored) {
        console.log(
          `Chapter ${ch.number} needs repair: isLocallyStored is falsy`,
        );
        return true;
      }

      // Or if pages are objects instead of string paths
      if (ch.pages && ch.pages.length > 0) {
        const firstPage = ch.pages[0];
        if (typeof firstPage !== "string") {
          console.log(
            `Chapter ${ch.number} needs repair: first page is not a string`,
            typeof firstPage,
          );
          return true;
        }
        // Check if it's not a local file path
        const isLocalPath =
          firstPage.startsWith("file://") ||
          firstPage.includes("otanet_downloads");
        if (!isLocalPath) {
          console.log(
            `Chapter ${ch.number} needs repair: first page is not local path: ${firstPage.substring(0, 50)}`,
          );
          return true;
        }
      }

      return false;
    });

    if (needsRepair) {
      console.log(`Download "${download.title}" needs repair`);
    }

    return needsRepair;
  },

  /**
   * Repair a single download by re-downloading chapter pages locally
   */
  repairDownloadChapters: async (download, onProgress = null) => {
    try {
      await storageService.ensureDownloadsDir();
      const mangaDir = storageService.getMangaDownloadDir(download.hash);

      // Create manga directory if needed
      const dirInfo = await FileSystem.getInfoAsync(mangaDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(mangaDir, { intermediates: true });
      }

      const repairedChapters = [];
      const totalChapters = download.chapters?.length || 0;

      for (let chIdx = 0; chIdx < totalChapters; chIdx++) {
        const chapter = download.chapters[chIdx];

        if (onProgress) {
          onProgress({
            chapter: chIdx + 1,
            total: totalChapters,
            status: `Repairing chapter ${chapter.number}...`,
          });
        }

        // Skip if already properly stored
        if (chapter.isLocallyStored && chapter.pages?.length > 0) {
          const firstPage = chapter.pages[0];
          if (
            typeof firstPage === "string" &&
            (firstPage.startsWith("file://") ||
              firstPage.includes("otanet_downloads"))
          ) {
            repairedChapters.push(chapter);
            continue;
          }
        }

        // Get the original pages (remote URLs)
        const originalPages = chapter.originalPages || chapter.pages || [];
        if (originalPages.length === 0) {
          console.log(`Chapter ${chapter.number} has no pages to repair`);
          repairedChapters.push(chapter);
          continue;
        }

        const chapterDir = `${mangaDir}chapter_${chapter.number}/`;
        const chapterDirInfo = await FileSystem.getInfoAsync(chapterDir);
        if (!chapterDirInfo.exists) {
          await FileSystem.makeDirectoryAsync(chapterDir, {
            intermediates: true,
          });
        }

        const localPages = [];
        let downloadedSize = 0;

        for (let i = 0; i < originalPages.length; i++) {
          const page = originalPages[i];
          const pageUrl =
            typeof page === "string"
              ? page
              : page?.src || page?.url || page?.image || null;

          if (!pageUrl) {
            console.warn(`Page ${i + 1} has no valid URL, skipping`);
            continue;
          }

          const ext = pageUrl.split(".").pop()?.split("?")[0] || "jpg";
          const localPath = `${chapterDir}page_${i + 1}.${ext}`;

          // Check if already downloaded
          const fileInfo = await FileSystem.getInfoAsync(localPath);
          if (fileInfo.exists) {
            localPages.push(localPath);
            downloadedSize += fileInfo.size || 0;
          } else {
            const success = await storageService.downloadImage(
              pageUrl,
              localPath,
            );
            if (success) {
              localPages.push(localPath);
              const newFileInfo = await FileSystem.getInfoAsync(localPath);
              downloadedSize += newFileInfo.size || 0;
            } else {
              // Keep remote URL as fallback
              localPages.push(pageUrl);
            }
          }
        }

        repairedChapters.push({
          ...chapter,
          pages: localPages,
          originalPages: originalPages,
          size: downloadedSize,
          isLocallyStored: true,
        });
      }

      // Update the download with repaired chapters
      const downloads = await storageService.getDownloads();
      const idx = downloads.findIndex((d) => d.hash === download.hash);
      if (idx >= 0) {
        downloads[idx].chapters = repairedChapters;
        downloads[idx].repairedAt = new Date().toISOString();
        await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
        console.log(
          `Repaired ${totalChapters} chapters for: ${download.title}`,
        );
      }

      return repairedChapters;
    } catch (error) {
      console.error("Failed to repair download chapters:", error);
      throw error;
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
   * Download a single image and save to file system
   */
  downloadImage: async (url, localPath) => {
    try {
      const result = await FileSystem.downloadAsync(url, localPath);
      return result.status === 200;
    } catch (error) {
      console.error(`Failed to download image: ${url}`, error);
      return false;
    }
  },

  /**
   * Add a single chapter to an existing download (or create new download)
   * Downloads images to file system for true offline access
   */
  addChapterToDownload: async (manga, chapterData, onProgress = null) => {
    try {
      await storageService.ensureDownloadsDir();

      const mangaDir = storageService.getMangaDownloadDir(manga.hash);
      const chapterDir = `${mangaDir}chapter_${chapterData.number}/`;

      // Create chapter directory
      const dirInfo = await FileSystem.getInfoAsync(chapterDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(chapterDir, {
          intermediates: true,
        });
      }

      // Download cover image if not already downloaded
      let localCoverPath = null;
      if (manga.cover_img) {
        const coverExt =
          manga.cover_img.split(".").pop()?.split("?")[0] || "jpg";
        localCoverPath = `${mangaDir}cover.${coverExt}`;
        const coverInfo = await FileSystem.getInfoAsync(localCoverPath);
        if (!coverInfo.exists) {
          const coverSuccess = await storageService.downloadImage(
            manga.cover_img,
            localCoverPath,
          );
          if (!coverSuccess) {
            localCoverPath = null; // Fallback to remote URL
          }
        }
      }

      // Download each page
      const pages = chapterData.pages || [];
      const localPages = [];
      let downloadedSize = 0;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        // Handle both string URLs and object formats {src: url} or {url: url}
        const pageUrl =
          typeof page === "string"
            ? page
            : page?.src || page?.url || page?.image || null;

        if (!pageUrl) {
          console.warn(`Page ${i + 1} has no valid URL, skipping`);
          continue;
        }

        const ext = pageUrl.split(".").pop()?.split("?")[0] || "jpg";
        const localPath = `${chapterDir}page_${i + 1}.${ext}`;

        // Log the first page path for debugging
        if (i === 0) {
          console.log(`First page local path: ${localPath}`);
          console.log(
            `Path starts with file://: ${localPath.startsWith("file://")}`,
          );
          console.log(
            `Path contains otanet_downloads: ${localPath.includes("otanet_downloads")}`,
          );
        }

        // Check if already downloaded
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists) {
          localPages.push(localPath);
          downloadedSize += fileInfo.size || 0;
        } else {
          const success = await storageService.downloadImage(
            pageUrl,
            localPath,
          );
          if (success) {
            localPages.push(localPath);
            const newFileInfo = await FileSystem.getInfoAsync(localPath);
            downloadedSize += newFileInfo.size || 0;
          } else {
            // Keep remote URL as fallback
            localPages.push(pageUrl);
          }
        }

        // Report progress
        if (onProgress) {
          onProgress((i + 1) / pages.length);
        }
      }

      // Save chapter data with local paths
      const chapterWithLocalPaths = {
        ...chapterData,
        pages: localPages,
        originalPages: pages,
        size: downloadedSize,
        isLocallyStored: true,
      };

      console.log(`Chapter ${chapterData.number} saved with:`);
      console.log(
        `  isLocallyStored: ${chapterWithLocalPaths.isLocallyStored}`,
      );
      console.log(`  pages count: ${localPages.length}`);
      console.log(`  first page: ${localPages[0]?.substring(0, 80)}`);

      const downloads = await storageService.getDownloads();
      const existingIndex = downloads.findIndex((d) => d.hash === manga.hash);

      if (existingIndex >= 0) {
        const existing = downloads[existingIndex];
        const chapterExists = existing.chapters?.some(
          (ch) => String(ch.number) === String(chapterData.number),
        );

        if (!chapterExists) {
          existing.chapters = [
            ...(existing.chapters || []),
            chapterWithLocalPaths,
          ];
          existing.totalSize = (existing.totalSize || 0) + downloadedSize;
          existing.updatedAt = new Date().toISOString();
        }
        // Update local cover path if we have one
        if (localCoverPath && !existing.localCoverPath) {
          existing.localCoverPath = localCoverPath;
        }
      } else {
        downloads.push({
          ...manga,
          localCoverPath: localCoverPath,
          chapters: [chapterWithLocalPaths],
          totalSize: downloadedSize,
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
   * Ensure downloads directory exists
   */
  ensureDownloadsDir: async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, {
          intermediates: true,
        });
      }
    } catch (error) {
      console.error("Failed to create downloads directory:", error);
    }
  },

  /**
   * Get manga download directory path
   */
  getMangaDownloadDir: (hash) => {
    return `${DOWNLOADS_DIR}${hash}/`;
  },

  /**
   * Remove a download and delete downloaded files
   */
  removeDownload: async (hash) => {
    try {
      // Remove from AsyncStorage
      let downloads = await storageService.getDownloads();
      downloads = downloads.filter((d) => d.hash !== hash);
      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));

      // Delete downloaded files from file system
      const mangaDir = storageService.getMangaDownloadDir(hash);
      const dirInfo = await FileSystem.getInfoAsync(mangaDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(mangaDir, { idempotent: true });
        console.log(`Deleted download files for ${hash}`);
      }

      return downloads;
    } catch (error) {
      console.error("Failed to remove download:", error);
      throw error;
    }
  },

  /**
   * Clear ALL downloads and delete all downloaded files
   * Use this to reset the downloads state completely
   */
  clearAllDownloads: async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.removeItem(DOWNLOADS_KEY);

      // Delete entire downloads directory
      const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(DOWNLOADS_DIR, { idempotent: true });
        console.log("Deleted all download files");
      }

      console.log("All downloads cleared successfully");
      return [];
    } catch (error) {
      console.error("Failed to clear all downloads:", error);
      throw error;
    }
  },

  /**
   * Remove a single chapter from download and delete its files
   */
  removeChapterDownload: async (hash, chapterNumber) => {
    try {
      const downloads = await storageService.getDownloads();
      const downloadIndex = downloads.findIndex((d) => d.hash === hash);

      if (downloadIndex >= 0) {
        const download = downloads[downloadIndex];
        const chapterNum = String(chapterNumber);

        // Find and remove the chapter
        const chapterIndex = download.chapters?.findIndex(
          (ch) => String(ch.number) === chapterNum,
        );

        if (chapterIndex >= 0) {
          const chapter = download.chapters[chapterIndex];
          // Subtract chapter size
          download.totalSize = (download.totalSize || 0) - (chapter.size || 0);
          download.chapters.splice(chapterIndex, 1);
          download.updatedAt = new Date().toISOString();

          // Delete chapter files
          const chapterDir = `${storageService.getMangaDownloadDir(hash)}chapter_${chapterNum}/`;
          const dirInfo = await FileSystem.getInfoAsync(chapterDir);
          if (dirInfo.exists) {
            await FileSystem.deleteAsync(chapterDir, { idempotent: true });
          }

          // If no chapters left, remove the entire download
          if (download.chapters.length === 0) {
            downloads.splice(downloadIndex, 1);
            // Also delete manga directory
            const mangaDir = storageService.getMangaDownloadDir(hash);
            const mangaDirInfo = await FileSystem.getInfoAsync(mangaDir);
            if (mangaDirInfo.exists) {
              await FileSystem.deleteAsync(mangaDir, { idempotent: true });
            }
          }
        }

        await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
      }

      return downloads;
    } catch (error) {
      console.error("Failed to remove chapter download:", error);
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
      return settings.readingMode || "scroll";
    } catch (error) {
      console.error("Failed to get reading mode:", error);
      return "scroll";
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
