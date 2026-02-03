import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import "../css/Recent_Manga.css";
import "../css/BookmarksPage.css";
import API_BASE from "./Config";

export default function BookmarksPage() {
  const [bookmarkedManga, setBookmarkedManga] = useState([]);
  const [mangaData, setMangaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState({});

  const loadBookmarks = () => {
    const saved = JSON.parse(localStorage.getItem("bookmarkedManga")) || [];
    setBookmarkedManga(saved);
  };

  const removeBookmark = (e, slug) => {
    e.preventDefault(); // Prevent navigating to manga page
    e.stopPropagation();
    const updated = bookmarkedManga.filter((s) => s !== slug);
    localStorage.setItem("bookmarkedManga", JSON.stringify(updated));
    setBookmarkedManga(updated);
    setMangaData((prev) => prev.filter((m) => m.slug !== slug));
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
            return { ...data, slug };
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

  const handleImageLoad = (slug) => {
    setLoadedImages((prev) => ({ ...prev, [slug]: true }));
  };

  if (loading) return <div className="bookmarks-loading">Loading bookmarks...</div>;
  if (mangaData.length === 0) return <div className="bookmarks-empty">No bookmarked manga.</div>;

  return (
    <div className="manga-list">
      <h1 className="bookmarks-title">Your Bookmarks</h1>
      {mangaData.map((manga) => (
        <Link key={manga.slug} to={`/${manga.slug}/${manga.hash}`} className="manga-card bookmark-card">
          <div className="manga-thumb-wrapper">
            {!loadedImages[manga.slug] && <div className="manga-thumb-skeleton" />}
            <img
              src={manga.cover}
              alt={manga.title}
              className={`manga-thumb ${loadedImages[manga.slug] ? "loaded" : ""}`}
              onLoad={() => handleImageLoad(manga.slug)}
            />
          </div>
          <div className="manga-info">
            <h2 className="manga-title-text">{manga.title}</h2>
            <p className="manga-description-text">
              {manga.description || "No description available."}
            </p>
          </div>
          <button
            className="bookmark-remove-btn"
            onClick={(e) => removeBookmark(e, manga.slug)}
            title="Remove from bookmarks"
          >
            <FaStar size={18} />
          </button>
        </Link>
      ))}
    </div>
  );
}
