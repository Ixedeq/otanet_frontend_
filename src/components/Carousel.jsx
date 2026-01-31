import React, { useState, useEffect, useRef } from "react";
import "../css/Carousel.css";
import API_BASE from "./Config";

export default function Carousel() {
  const [mangaList, setMangaList] = useState([]);
  const scrollRef = useRef(null);
  const isPausedRef = useRef(true);

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

  // Auto-scrolling disabled — carousel remains static
  useEffect(() => {
    // Ensure paused flag is set.
    isPausedRef.current = true;
  }, [mangaList]);

  if (!mangaList.length) return <div className="carousel-empty">No manga available.</div>;

  return (
    <div
      className="carousel-container"
      ref={scrollRef}
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
