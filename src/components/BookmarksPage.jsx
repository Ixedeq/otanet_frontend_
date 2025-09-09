import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../css/BookmarksPage.css";
import API_BASE from "./Config";

export default function BookmarksPage() {
  const [bookmarkedManga, setBookmarkedManga] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedBookmarks = JSON.parse(localStorage.getItem("bookmarkedManga")) || [];

    const fetchMangaData = async () => {
      try {
        const mangaList = await Promise.all(
          savedBookmarks.map(async (slug) => {
            const res = await fetch(`${API_BASE}/${slug}`);
            if (!res.ok) return null;
            const data = await res.json();
            if (!data.cover)
              data.cover =
                "https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg.512.jpg";
            return { ...data, slug };
          })
        );
        setBookmarkedManga(mangaList.filter(Boolean));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (savedBookmarks.length > 0) fetchMangaData();
    else setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (bookmarkedManga.length === 0) return <div>No bookmarked manga found.</div>;

  return (
    <div className="bookmarks-list">
      {bookmarkedManga.map(({ title, description, cover, slug }) => (
        <Link key={slug} to={`/${slug}`} className="bookmarks-card">
          <img src={cover} alt={title} className="bookmarks-thumb" />
          <div className="bookmarks-info">
            <div className="bookmarks-title-text">{title}</div>
            {description && <div className="bookmarks-description-text">{description}</div>}
          </div>
        </Link>
      ))}
    </div>
  );
}
