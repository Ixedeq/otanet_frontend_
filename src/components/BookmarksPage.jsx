import React, { useState, useEffect } from "react";
import "../css/Recent_Manga.css";
import API_BASE from "./Config";

export default function BookmarksPage() {
  const [bookmarkedManga, setBookmarkedManga] = useState([]);
  const [mangaData, setMangaData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = () => {
    const saved = JSON.parse(localStorage.getItem("bookmarkedManga")) || [];
    setBookmarkedManga(saved);
  };

  useEffect(() => {
    loadBookmarks();
    window.addEventListener("focus", loadBookmarks);
    window.addEventListener("storage", loadBookmarks);
    return () => {
      window.removeEventListener("focus", loadBookmarks);
      window.removeEventListener("storage", loadBookmarks);
    };
  }, []);

  useEffect(() => {
    if (bookmarkedManga.length === 0) {
      setMangaData([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          bookmarkedManga.map(async (slug) => {
            const res = await fetch(`${API_BASE}/${slug}`);
            if (!res.ok) return null;
            const data = await res.json();
            return { ...data, slug }; // <--- ensure slug exists
          })
        );
        setMangaData(results.filter((m) => m !== null));
      } catch (err) {
        console.error(err);
        setMangaData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookmarkedManga]);

  if (loading) return <div>Loading...</div>;
  if (mangaData.length === 0) return <div>No bookmarked manga.</div>;

  return (
    <div className="manga-list">
      {mangaData.map((manga) => (
        <a key={manga.slug} href={`/${manga.slug}`} className="manga-card">
          <img
            src={manga.cover}
            alt={manga.title}
            className="manga-thumb"
          />
          <div className="manga-info">
            <h2 className="manga-title-text">{manga.title}</h2>
            <p className="manga-description-text">
              {manga.description || "No description available."}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}
