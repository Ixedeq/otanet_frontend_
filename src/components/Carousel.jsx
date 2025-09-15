import React, { useState, useEffect, useRef } from "react";
import "../css/Carousel.css";
import API_BASE from "./Config";

export default function Carousel() {
  const [mangaList, setMangaList] = useState([]);
  const scrollRef = useRef(null);
  const isPausedRef = useRef(false);
  const animationRef = useRef(null);
  const noCover =
    "https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg.512.jpg";

  // Load bookmarks safely
  const loadBookmarks = () => {
    try {
      return JSON.parse(localStorage.getItem("bookmarkedManga")) || [];
    } catch (err) {
      console.error("Failed to load bookmarks:", err);
      return [];
    }
  };

  // Fetch bookmark details
  const fetchBookmarksData = async (bookmarks) => {
    if (bookmarks.length === 0) return [];
    try {
      const results = await Promise.all(
        bookmarks.map(async (slug) => {
          const res = await fetch(`${API_BASE}/${slug}`);
          if (!res.ok) return null;
          const data = await res.json();
          return { ...data, slug };
        })
      );
      return results.filter((m) => m !== null);
    } catch (err) {
      console.error("Error fetching bookmark data:", err);
      return [];
    }
  };

  // Fetch similar manga based on tags
  const fetchSimilarManga = async (tags, excludeSlugs) => {
    if (tags.length === 0) return [];
    try {
      const query = tags.join(",");
      const excludeQuery = excludeSlugs.length > 0 ? excludeSlugs.join(",") : "";
      const url = `${API_BASE}/search_by_tags?include_tags=${query}&exclude_tags=${excludeQuery}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();

      return data.map((m) => ({
        slug: m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title: m.title,
        cover: noCover, // fallback cover
      }));
    } catch (err) {
      console.error("Failed to fetch similar manga:", err);
      return [];
    }
  };

  // Load recommendations on mount
  useEffect(() => {
    const loadRecommendations = async () => {
      const bookmarks = loadBookmarks();
      if (bookmarks.length === 0) return;

      const bookmarkData = await fetchBookmarksData(bookmarks);

      // Collect unique tags safely
      const tagsSet = new Set();
      bookmarkData.forEach((m) => {
        if (m.tags) {
          m.tags.split(",").forEach((t) => {
            const trimmed = t.trim();
            if (trimmed) tagsSet.add(trimmed);
          });
        }
      });
      const tags = Array.from(tagsSet);
      if (tags.length === 0) return;

      // Fetch similar manga excluding bookmarks
      const similar = await fetchSimilarManga(tags, bookmarks);
      setMangaList(similar);
    };

    loadRecommendations();
  }, []);

  // Infinite horizontal scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollSpeed = 1;
    const step = () => {
      if (!isPausedRef.current) {
        container.scrollLeft += scrollSpeed;
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }
      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationRef.current);
  }, [mangaList]);

  if (mangaList.length === 0)
    return <div className="carousel-empty">No recommendations available.</div>;

  return (
    <div
      className="carousel-container"
      ref={scrollRef}
      onMouseEnter={() => (isPausedRef.current = true)}
      onMouseLeave={() => (isPausedRef.current = false)}
    >
      {[...mangaList, ...mangaList].map(({ slug, title, cover }, index) => (
        <a key={index} href={`/${slug}`} className="carousel-item">
          <img src={cover || noCover} alt={title} className="carousel-cover" />
          <div className="carousel-title">{title}</div>
        </a>
      ))}
    </div>
  );
}
