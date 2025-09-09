import React, { useState, useEffect } from "react";
import "../css/Recent_Manga.css"; // using your existing manga-list CSS
import API_BASE from "./Config";

export default function BookmarksPage() {
  const [bookmarkedManga, setBookmarkedManga] = useState([]);
  const [mangaData, setMangaData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Fetch bookmarks from localStorage ---
  const updateBookmarks = () => {
    const saved = JSON.parse(localStorage.getItem("bookmarkedManga")) || [];
    setBookmarkedManga(saved);
  };

  useEffect(() => {
    updateBookmarks();

    // Listen for tab focus or other storage changes
    window.addEventListener("focus", updateBookmarks);
    window.addEventListener("storage", updateBookmarks);

    return () => {
      window.removeEventListener("focus", updateBookmarks);
      window.removeEventListener("storage", updateBookmarks);
    };
  }, []);

  // --- Fetch manga info for each bookmarked slug ---
  useEffect(() => {
    if (bookmarkedManga.length === 0) {
      setMangaData([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const requests = bookmarkedManga.map((slug) =>
          fetch(`${API_BASE}/${slug}`).then((res) => res.json())
        );
        const results = await Promise.all(requests);
        setMangaData(results);
      } catch (err) {
        console.error("Failed to fetch bookmarked manga:", err);
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
