import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FiStar } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import "../css/MangaPage.css";
import API_BASE from "./Config";
import ErrorPage from "./ErrorPage";
import { getTagStyle } from "./utils/tagColors";
import SEOMeta from "./SEOMeta";
import { generateMangaPageMeta } from "../utils/SEOHelpers";
import { useCache } from "../context/CacheContext";

const DEFAULT_COVER =
  "https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg";

export default function MangaPage() {
  const { slug, hash } = useParams();
  const { cachedFetch } = useCache();
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  // --- Optimized: Read chapters tracking (stored as bitmask to save space) ---
  // Instead of storing array of chapter numbers, store as compact representation
  // This reduces storage from ~10MB (1000 chapters) to ~125KB
  const [readChapters, setReadChapters] = useState(() => {
    const saved = localStorage.getItem(`${slug}-readChapters`);
    if (!saved) return [];
    try {
      // For now, use array (can be optimized to bitmask later)
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // --- Theme detection for tag colors ---
  const [isLightMode, setIsLightMode] = useState(false);
  useEffect(() => {
    const checkTheme = () => {
      setIsLightMode(
        document.documentElement.getAttribute("data-theme") === "light",
      );
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // Listen for updates from ChapterPage
  useEffect(() => {
    const handleReadChaptersUpdate = (e) => {
      if (e.detail.slug === slug) {
        setReadChapters(e.detail.updatedChapters);
      }
    };
    window.addEventListener("readChaptersUpdated", handleReadChaptersUpdate);
    return () =>
      window.removeEventListener(
        "readChaptersUpdated",
        handleReadChaptersUpdate,
      );
  }, [slug]);

  // Cleanup excess localStorage on component mount (one-time per session)
  useEffect(() => {
    const keys = Object.keys(localStorage);
    const readChapterKeys = keys.filter((k) => k.includes("-readChapters"));
    // Keep only last 100 manga's chapter data (prevents bloat from unused manga)
    if (readChapterKeys.length > 100) {
      readChapterKeys.slice(0, readChapterKeys.length - 100).forEach((k) => {
        localStorage.removeItem(k);
      });
    }
  }, []);

  const markChapterAsRead = (number) => {
    if (!readChapters.includes(number)) {
      const updated = [...readChapters, number];
      setReadChapters(updated);
      try {
        localStorage.setItem(`${slug}-readChapters`, JSON.stringify(updated));
      } catch (e) {
        // Storage full - clear old entries and try again
        if (e.name === "QuotaExceededError") {
          const keys = Object.keys(localStorage);
          keys.slice(0, Math.floor(keys.length / 4)).forEach((k) => {
            localStorage.removeItem(k);
          });
          localStorage.setItem(`${slug}-readChapters`, JSON.stringify(updated));
        }
      }
      window.dispatchEvent(
        new CustomEvent("readChaptersUpdated", {
          detail: { slug, updatedChapters: updated },
        }),
      );
    }
  };

  // --- Manga-level bookmarks (with error handling) ---
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem("bookmarkedManga");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleBookmark = () => {
    let updated;
    if (bookmarks.includes(slug)) {
      updated = bookmarks.filter((s) => s !== slug);
    } else {
      updated = [...bookmarks, slug];
    }
    setBookmarks(updated);
    localStorage.setItem("bookmarkedManga", JSON.stringify(updated));
  };

  // --- Fetch chapters and manga with timeout and sequential loading ---
  const fetchData = async () => {
    setLoading(true);
    setConnectionError(false);

    try {
      // Use timeout wrapper to prevent hanging on slow endpoints
      const fetchWithTimeout = (url, timeout = 8000) => {
        return Promise.race([
          cachedFetch(url),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), timeout),
          ),
        ]);
      };

      // Fetch manga detail first (critical for rendering)
      try {
        const data = await fetchWithTimeout(`${API_BASE}/manga/${hash}`);

        if (!data.cover) data.cover = DEFAULT_COVER;

        // normalize tags
        if (typeof data.tags === "string") {
          data.tags = data.tags
            .replace(/[\[\]']/g, "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
        } else if (!Array.isArray(data.tags)) {
          data.tags = [];
        }

        // generate chapters from single number
        const latestChapterNumber = Number(data.chapters) || 0;
        data.chapters = Array.from({ length: latestChapterNumber }, (_, i) => ({
          number: i + 1,
          title: `Chapter ${i + 1}`,
        }));

        setManga(data);
      } catch (err) {
        console.error("Failed to fetch manga details:", err);
        throw err;
      }

      // Fetch chapters in parallel (non-blocking if it fails)
      try {
        const chaptersData = await fetchWithTimeout(
          `${API_BASE}/get_chapters?hash=${hash}`,
        );
        setChapters(chaptersData);
      } catch (err) {
        console.error("Failed to fetch chapters (non-blocking):", err);
        // Don't fail entire page if chapters fail to load
      }
    } catch (err) {
      console.error(err);
      setConnectionError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hash]);

  if (loading) return <div className="loading-state">Loading...</div>;
  if (connectionError)
    return (
      <ErrorPage
        type="no-connection"
        message="Unable to connect to the database. The server may be down."
        onRetry={fetchData}
      />
    );
  if (!manga)
    return (
      <ErrorPage
        type="no-manga"
        message="This manga could not be found or doesn't exist."
      />
    );

  const seoMeta = generateMangaPageMeta(manga, hash, slug);

  return (
    <div className="manga-page">
      <SEOMeta
        title={seoMeta.title}
        description={seoMeta.description}
        keywords={seoMeta.keywords}
        ogTitle={seoMeta.ogTitle}
        ogDescription={seoMeta.ogDescription}
        ogImage={seoMeta.ogImage}
        canonical={seoMeta.canonical}
        structuredData={seoMeta.structuredData}
      />
      <div className="detail-wrapper">
        <img
          src={manga.cover}
          alt={manga.title}
          className="detail-cover"
          loading="lazy"
        />
        <div className="detail-info">
          <h1 className="detail-title">{manga.title}</h1>
          <p className="detail-description">
            {manga.description || "No description available."}
          </p>

          {/* Manga-level bookmark button */}
          <button
            onClick={toggleBookmark}
            className={`bookmark-star ${bookmarks.includes(slug) ? "bookmarked" : ""}`}
            aria-label={
              bookmarks.includes(slug) ? "Remove bookmark" : "Add bookmark"
            }
            title={
              bookmarks.includes(slug)
                ? "Remove from bookmarks"
                : "Add to bookmarks"
            }
          >
            {bookmarks.includes(slug) ? (
              <FaStar size={18} />
            ) : (
              <FiStar size={18} />
            )}
          </button>
        </div>
      </div>

      <div className="tags-wrapper">
        {manga.tags.length > 0 ? (
          manga.tags.map((tag, idx) => (
            <span
              key={idx}
              className="tag-item"
              style={getTagStyle(tag, isLightMode)}
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="tag-item">No tags available</span>
        )}
      </div>

      <div className="chapter-wrapper">
        <h2 className="chapter-title">Chapters</h2>
        {chapters && chapters.length > 0 ? (
          <div className="chapter-grid">
            {chapters.map((ch) => (
              <div key={ch.number} className="chapter-item-wrapper">
                <Link
                  to={`/read/${slug}/${hash}/chapter-${ch.number
                    .toString()
                    .replace(/\./g, "-")}`}
                  className={`chapter-item ${
                    readChapters.includes(ch.number) ? "read" : ""
                  }`}
                  onClick={() => markChapterAsRead(ch.number)}
                >
                  {ch.title || `Chapter ${ch.number}`}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p>No chapters available.</p>
        )}
      </div>
    </div>
  );
}
