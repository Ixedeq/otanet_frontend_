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
  const loadBookmarks = () => {
    return JSON.parse(localStorage.getItem("bookmarkedManga")) || [];
  };

  // Fetch manga details for bookmarks
  useEffect(() => {
    const fetchBookmarksData = async () => {
      const bookmarks = loadBookmarks();
      if (bookmarks.length === 0) {
        setMangaList([]);
        return;
      }

      try {
        const results = await Promise.all(
          bookmarks.map(async (slug) => {
            const res = await fetch(`${API_BASE}/${slug}`);
            if (!res.ok) return null;
            const data = await res.json();
            return { ...data, slug };
          })
        );

        setMangaList(results.filter((m) => m !== null));
      } catch (err) {
        console.error("Error fetching bookmark data:", err);
        setMangaList([]);
      }
    };

    fetchBookmarksData();
  }, []);

  // Infinite horizontal scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollSpeed = 1; // px per frame

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
    return <div className="carousel-empty">No bookmarks yet.</div>;

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
