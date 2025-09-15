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

  // Load bookmarks from localStorage
  const loadBookmarks = () => JSON.parse(localStorage.getItem("bookmarkedManga")) || [];

  // Fetch bookmarks details
  const fetchBookmarksData = async (bookmarks) => {
    const results = await Promise.all(
      bookmarks.map(async (slug) => {
        const res = await fetch(`${API_BASE}/${slug}`);
        if (!res.ok) return null;
        const data = await res.json();
        return { ...data, slug };
      })
    );
    return results.filter((m) => m !== null);
  };

  // Fetch similar manga based on tags/genres
  const fetchSimilarManga = async (tags) => {
    try {
      // Example endpoint: filter manga by tags (adjust according to your API)
      const query = tags.join(",");
      const res = await fetch(`${API_BASE}/manga_by_tags?tags=${query}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Error fetching similar manga:", err);
      return [];
    }
  };

  useEffect(() => {
    const loadRecommendations = async () => {
      const bookmarks = loadBookmarks();
      if (bookmarks.length === 0) {
        setMangaList([]);
        return;
      }

      // 1. Fetch bookmarks details
      const bookmarkData = await fetchBookmarksData(bookmarks);

      // 2. Collect unique tags/genres
      const tagsSet = new Set();
      bookmarkData.forEach((m) => {
        (m.tags || []).forEach((t) => tagsSet.add(t));
      });
      const tags = Array.from(tagsSet);

      if (tags.length === 0) {
        setMangaList([]);
        return;
      }

      // 3. Fetch similar manga
      let similar = await fetchSimilarManga(tags);

      // 4. Filter out bookmarks
      similar = similar.filter((m) => !bookmarks.includes(m.slug));

      setMangaList(similar);
    };

    loadRecommendations();
  }, []);

  // Infinite scroll
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
          <img
            src={cover || noCover}
            alt={title}
            className="carousel-cover"
          />
          <div className="carousel-title">{title}</div>
        </a>
      ))}
    </div>
  );
}
