import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Config from "../config";

const API_BASE = Config.API_BASE;

// Log the API base URL for debugging
console.log("API_BASE configured as:", API_BASE);

// Custom error class for network errors
export class NetworkError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = "NetworkError";
    this.isNetworkError = true;
    this.originalError = originalError;
  }
}

// Create axios instance with timeout
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// In-memory cache for API responses
const cache = {};
const CACHE_TTL = 1800000; // 30 minutes

/**
 * Check if an error is a network connectivity issue
 */
function isNetworkConnectivityError(error) {
  return (
    error.message === "Network Error" ||
    error.code === "ECONNABORTED" ||
    error.code === "ETIMEDOUT" ||
    error.message?.includes("Network request failed") ||
    !error.response // No response means network issue
  );
}

/**
 * Make cached API request
 * @param {string} url - API endpoint
 * @param {object} params - Query parameters
 * @param {number} ttl - Cache TTL in milliseconds (default: 30 min)
 * @returns {Promise}
 */
async function cachedFetch(url, params = {}, ttl = CACHE_TTL) {
  const cacheKey = `${url}?${new URLSearchParams(params).toString()}`;

  // Check memory cache
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < ttl) {
    return cache[cacheKey].data;
  }

  try {
    const response = await api.get(url, { params });
    const data = response.data;

    // Store in memory cache
    cache[cacheKey] = {
      data,
      timestamp: Date.now(),
    };

    return data;
  } catch (error) {
    console.error(`API request failed: ${url}`);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Check if we have cached data to return as fallback
    if (cache[cacheKey]) {
      console.log(`Returning stale cache for: ${url}`);
      return cache[cacheKey].data;
    }

    // Wrap network errors with more helpful message
    if (isNetworkConnectivityError(error)) {
      throw new NetworkError(
        "Unable to connect. Please check your internet connection.",
        error,
      );
    }

    throw error;
  }
}

// === API METHODS ===

export const apiService = {
  /**
   * Get recent manga releases
   * Note: Backend returns 25 items per page
   */
  getRecentManga: async (page = 1) => {
    // Don't cache paginated requests beyond page 1 to ensure fresh data
    const ttl = page === 1 ? CACHE_TTL : 0;
    return cachedFetch("/recent_manga", { page }, ttl);
  },

  /**
   * Get total manga count
   */
  getMangaCount: async () => {
    return cachedFetch("/manga_count", {}, 3600000); // Cache for 1 hour
  },

  /**
   * Get all manga (for bulk operations)
   */
  getAllManga: async () => {
    return cachedFetch("/api/all-manga", {}, 3600000);
  },

  /**
   * Get manga details
   * @param {string} hash - Manga hash ID
   */
  getMangaDetails: async (hash) => {
    return cachedFetch(`/manga/${hash}`);
  },

  /**
   * Get all chapters for a manga
   * @param {string} hash - Manga hash ID
   */
  getChapters: async (hash) => {
    return cachedFetch(`/get_chapters?hash=${hash}`);
  },

  /**
   * Get pages for a chapter
   * @param {string} hash - Manga hash ID
   * @param {string} chapter - Chapter identifier
   */
  getChapterPages: async (hash, chapter) => {
    return cachedFetch(`/get_pages?hash=${hash}&chapter=${chapter}`);
  },

  /**
   * Get image URL
   * @param {string} hashId - Image hash ID
   * @param {string} filename - Image filename
   */
  getImageUrl: (hashId, filename) => {
    return `${API_BASE}/image/${hashId}/${filename}`;
  },

  /**
   * Get manga cover
   */
  getCover: async (hash) => {
    return cachedFetch("/get_cover", { hash });
  },

  /**
   * Get all available tags
   */
  getAllTags: async () => {
    return cachedFetch("/get_all_tags", {}, 3600000);
  },

  /**
   * Search manga by title
   * @param {string} title - Search query
   */
  searchByTitle: async (title) => {
    return cachedFetch("/search_by_title", { title });
  },

  /**
   * Search manga by tags
   * @param {array} includeTags - Array of tags to include
   * @param {array} excludeTags - Array of tags to exclude (optional)
   */
  searchByTags: async (includeTags, excludeTags = []) => {
    const params = {};
    if (includeTags && includeTags.length > 0) {
      params.include_tags = includeTags.join(",");
    }
    if (excludeTags && excludeTags.length > 0) {
      params.exclude_tags = excludeTags.join(",");
    }
    return cachedFetch("/search_by_tags", params);
  },

  /**
   * Get recommendations
   */
  getRecommendations: async () => {
    return cachedFetch("/get_recommendations", {}, 600000); // Cache for 10 minutes
  },

  /**
   * Prefetch images for faster loading
   * @param {array} urls - Array of image URLs
   */
  prefetchImages: async (urls) => {
    try {
      return await api.post("/prefetch_images", { urls });
    } catch (error) {
      console.error("Prefetch failed (non-critical):", error);
      // Don't throw - prefetch is optional
    }
  },

  /**
   * Clear cache
   */
  clearCache: () => {
    Object.keys(cache).forEach((key) => delete cache[key]);
  },
};

export default apiService;
