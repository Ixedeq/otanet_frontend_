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
    try {
      const results = await Promise.all(
        bookmarks.map(async (hash) => {
          const res = await fetch(`${API_BASE}/manga/${hash}`);
          if (!res.ok) return null;
          return await res.json();
        }),
      );
      setMangaList(results.filter(Boolean));
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
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
