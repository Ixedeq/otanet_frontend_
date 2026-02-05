import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../css/Carousel.css";
import API_BASE from "./Config";
import ErrorPage from "./ErrorPage";

// Consistent slug generation - same as MangaCard
const toSlug = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-");

export default function Carousel() {
  const [mangaList, setMangaList] = useState([]);
  const [connectionError, setConnectionError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const scrollRef = useRef(null);

  // Get bookmarks from localStorage
  const getBookmarks = () => {
    try {
      return JSON.parse(localStorage.getItem("bookmarkedManga")) || [];
    } catch {
      return [];
    }
  };

  // Parse tags from various formats
  const parseTags = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags.map((t) => t.trim()).filter(Boolean);
    if (typeof tags === "string") {
      // Handle stringified array format like "['Romance', 'Comedy']"
      if (tags.startsWith("[")) {
        try {
          const parsed = JSON.parse(tags.replace(/'/g, '"'));
          return Array.isArray(parsed)
            ? parsed.map((t) => t.trim()).filter(Boolean)
            : [];
        } catch {
          // Fall through to comma split
        }
      }
      return tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }
    return [];
  };

  // Fetch random manga (fallback)
  const fetchRandomManga = async (count = 10) => {
    try {
      const page = Math.floor(Math.random() * 5) + 1;
      const res = await fetch(
        `${API_BASE}/recent_manga?per_page=${count}&page=${page}`,
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setConnectionError(false);
      return data.map((m) => ({
        slug: toSlug(m.title),
        hash: m.hash,
        title: m.title,
        cover: m.cover_img,
      }));
    } catch (err) {
      console.error("Failed to fetch random manga:", err);
      setConnectionError(true);
      return [];
    }
  };

  // Fetch recommendations based on bookmarked manga tags
  const fetchRecommendations = async () => {
    const bookmarks = getBookmarks();
    if (bookmarks.length === 0) return null;

    try {
      // Fetch tags from bookmarked manga (limit to first 5)
      const tagResults = await Promise.all(
        bookmarks.slice(0, 5).map(async (slug) => {
          try {
            const res = await fetch(`${API_BASE}/${slug}`);
            if (!res.ok) return [];
            const data = await res.json();
            return parseTags(data.tags);
          } catch {
            return [];
          }
        }),
      );

      // Count tag frequency
      const tagCounts = {};
      tagResults.flat().forEach((tag) => {
        const normalizedTag = tag.toLowerCase().trim();
        if (normalizedTag) {
          tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
        }
      });

      // Get top 6 most common tags
      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([tag]) => tag);

      if (topTags.length === 0) return null;

      console.log("Recommending based on tags:", topTags);

      // Fetch recommendations from API
      const params = new URLSearchParams();
      params.set("tags", topTags.join(","));
      params.set("exclude", bookmarks.join(","));
      params.set("limit", "12");

      const res = await fetch(
        `${API_BASE}/get_recommendations?${params.toString()}`,
      );
      if (!res.ok) return null;

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return null;

      return data.map((m) => ({
        slug: toSlug(m.title),
        hash: m.hash,
        title: m.title,
        cover: m.cover_img,
        score: m.score || 0,
      }));
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      return null;
    }
  };

  const loadManga = async () => {
    setLoading(true);
    setConnectionError(false);

    // Try personalized recommendations first
    const recommendations = await fetchRecommendations();

    if (recommendations && recommendations.length > 0) {
      setMangaList(recommendations);
      setIsPersonalized(true);
      setLoading(false);
      return;
    }

    // Fallback to random manga
    const randomManga = await fetchRandomManga(10);
    setMangaList(randomManga);
    setIsPersonalized(false);
    setLoading(false);
  };

  useEffect(() => {
    loadManga();
  }, []);

  if (loading)
    return <div className="carousel-loading">Loading recommendations...</div>;

  if (connectionError) {
    return (
      <ErrorPage
        type="no-connection"
        message="Unable to connect to the database."
        onRetry={loadManga}
      />
    );
  }

  if (!mangaList.length)
    return <div className="carousel-empty">No manga available.</div>;

  return (
    <div className="carousel-wrapper">
      <div className="carousel-label">
        <span>{isPersonalized ? "Recommended for you" : "Discover manga"}</span>
      </div>
      <div className="carousel-container" ref={scrollRef}>
        {mangaList.map(({ slug, hash, title, cover }, index) => (
          <Link
            key={`${slug}-${hash}-${index}`}
            to={`/${slug}/${hash}`}
            className="carousel-item"
          >
            <img src={cover} alt={title} className="carousel-cover" />
            <div className="carousel-title">{title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
