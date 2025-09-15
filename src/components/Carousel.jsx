import React, { useState, useEffect, useRef } from "react";
import "../css/Carousel.css";
import API_BASE from "./Config";

export default function Carousel() {
  const [manga, setManga] = useState([]);
  const isPausedRef = useRef(false);
  const scrollRef = useRef(null);
  const animationRef = useRef(null);
  const noCover =
    "https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg.512.jpg";

  // Load bookmarks from localStorage
  const loadBookmarks = () => {
    return JSON.parse(localStorage.getItem("bookmarkedManga")) || [];
  };

  // Fetch details for bookmarks
  useEffect(() => {
    const bookmarks = loadBookmarks();
    if (bookmarks.length === 0) {
      setManga([]);
      return;
    }

    const fetchData = async () => {
      try {
        const results = await Promise.all(
          bookmarks.map(async (slug) => {
            const res = await fetch(`${API_BASE}/${slug}`);
            if (!res.ok) return null;
            const data = await res.json();
            return { ...data, slug };
          })
        );
        setManga(results.filter((m) => m !== null));
      } catch (err) {
        console.error("Error fetching bookmark data:", err);
      }
    };

    fetchData();
  }, []);

  // Infinite scroll
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const scrollSpeed = 1;
    const step = () => {
      if (!isPausedRef.current) {
        scrollContainer.scrollLeft += scrollSpeed;
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
          scrollContainer.scrollLeft = 0;
        }
      }
      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  return (
    <main
      className="carousel-container"
      ref={scrollRef}
      onMouseEnter={() => (isPausedRef.current = true)}
      onMouseLeave={() => (isPausedRef.current = false)}
    >
      {manga.length > 0 ? (
        [...manga, ...manga].map(({ slug, title, cover }, index) => (
          <a key={index} href={`/${slug}`} className="manga-item">
            <img src={cover || noCover} alt={title} className="home-cover" />
            <div className="manga-title">{title}</div>
          </a>
        ))
      ) : (
        <div>No bookmarks yet.</div>
      )}
    </main>
  );
}
