import React, { useState, useEffect, useRef } from "react";
import "../css/Carousel.css";
import API_BASE from "./Config";

export default function Carousel() {
  const [mangaList, setMangaList] = useState([]);
  const scrollRef = useRef(null);
  const isPausedRef = useRef(false);
  const userInteractingRef = useRef(false);
  const animationRef = useRef(null);

  // Fetch random manga
  const fetchRandomManga = async (count = 10) => {
    try {
      const page = Math.floor(Math.random() * 5) + 1; // random page 1–5
      const res = await fetch(`${API_BASE}/recent_manga?per_page=${count}&page=${page}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((m) => ({
        slug: m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title: m.title,
        cover: m.cover_img,
      }));
    } catch (err) {
      console.error("Failed to fetch random manga:", err);
      return [];
    }
  };

  useEffect(() => {
    const loadManga = async () => {
      const randomManga = await fetchRandomManga(10);
      setMangaList(randomManga);
    };
    loadManga();
  }, []);

  // Infinite horizontal scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollSpeed = 1; // pixels per frame

    const step = () => {
      if (!isPausedRef.current && !userInteractingRef.current) {
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

  if (!mangaList.length) return <div className="carousel-empty">No manga available.</div>;

  return (
    <div
      className="carousel-container"
      ref={scrollRef}
      onMouseEnter={() => (isPausedRef.current = true)}
      onMouseLeave={() => (isPausedRef.current = false)}
      onMouseDown={() => (userInteractingRef.current = true)}
      onMouseUp={() => (userInteractingRef.current = false)}
      onTouchStart={() => (userInteractingRef.current = true)}
      onTouchEnd={() => (userInteractingRef.current = false)}
      onWheel={() => {
        userInteractingRef.current = true;
        setTimeout(() => (userInteractingRef.current = false), 300);
      }}
    >
      {[...mangaList, ...mangaList].map(({ slug, title, cover }, index) => (
        <a key={index} href={`/${slug}`} className="carousel-item">
          <img src={cover} alt={title} className="carousel-cover" />
          <div className="carousel-title">{title}</div>
        </a>
      ))}
    </div>
  );
}
