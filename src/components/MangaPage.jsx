import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FiStar } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import "../css/MangaPage.css";
import API_BASE from "./Config";

const DEFAULT_COVER =
  "https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg.512.jpg";

export default function MangaPage() {
  const { slug, hash } = useParams();
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Read chapters tracking ---
  const [readChapters, setReadChapters] = useState(() => {
    const saved = localStorage.getItem(`${slug}-readChapters`);
    return saved ? JSON.parse(saved) : [];
  });

  // Listen for updates from ChapterPage
  useEffect(() => {
    const handleReadChaptersUpdate = (e) => {
      if (e.detail.slug === slug) {
        setReadChapters(e.detail.updatedChapters);
      }
    };
    window.addEventListener("readChaptersUpdated", handleReadChaptersUpdate);
    return () => window.removeEventListener("readChaptersUpdated", handleReadChaptersUpdate);
  }, [slug]);

  const markChapterAsRead = (number) => {
    if (!readChapters.includes(number)) {
      const updated = [...readChapters, number];
      setReadChapters(updated);
      localStorage.setItem(`${slug}-readChapters`, JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent("readChaptersUpdated", {
          detail: { slug, updatedChapters: updated },
        })
      );
    }
  };

  // --- Manga-level bookmarks ---
  const [bookmarks, setBookmarks] = useState(() => {
    return JSON.parse(localStorage.getItem("bookmarkedManga")) || [];
  });

  const toggleBookmark = () => {
    let updated;
    if (bookmarks.includes(slug)) {
      updated = bookmarks.filter((s) => s !== slug);
    } else {
      updated = [...bookmarks, slug];
    }
    setBookmarks(updated);
    localStorage.setItem("bookmarkedManga", JSON.stringify(updated));
  };

  // --- Fetch chapters and manga ---
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_chapters?hash=${hash}`);
        if (!res.ok) throw new Error("Chapters not found!");
        const data = await res.json();
        setChapters(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchManga = async () => {
      try {
        const res = await fetch(`${API_BASE}/${slug}`);
        if (!res.ok) throw new Error("Manga not found");
        const data = await res.json();

        if (!data.cover) data.cover = DEFAULT_COVER;

        // normalize tags
        if (typeof data.tags === "string") {
          data.tags = data.tags
            .replace(/[\[\]']/g, "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
        } else if (!Array.isArray(data.tags)) {
          data.tags = [];
        }

        // generate chapters from single number
        const latestChapterNumber = Number(data.chapters) || 0;
        data.chapters = Array.from(
          { length: latestChapterNumber },
          (_, i) => ({ number: i + 1, title: `Chapter ${i + 1}` })
        );

        setManga(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
    fetchManga();
  }, [slug]);

  if (loading) return <div>Loading...</div>;
  if (!manga) return <div>Manga not found</div>;

  return (
    <>
      <div className="detail-wrapper">
        <img src={manga.cover} alt={manga.title} className="detail-cover" />
        <div className="detail-info">
          <h1 className="detail-title">{manga.title}</h1>
          <p className="detail-description">
            {manga.description || "No description available."}
          </p>

          {/* Manga-level bookmark button */}
          <button
            onClick={toggleBookmark}
            className={`bookmark-star ${bookmarks.includes(slug) ? "bookmarked" : ""}`}
            aria-label={bookmarks.includes(slug) ? "Remove bookmark" : "Add bookmark"}
            title={bookmarks.includes(slug) ? "Remove from bookmarks" : "Add to bookmarks"}
          >
            {bookmarks.includes(slug) ? <FaStar size={18} /> : <FiStar size={18} />}
          </button>
        </div>
      </div>

      <div className="tags-wrapper">
        {manga.tags.length > 0 ? (
          manga.tags.map((tag, idx) => (
            <span key={idx} className="tag-item">
              {tag}
            </span>
          ))
        ) : (
          <span className="tag-item">No tags available</span>
        )}
      </div>

      <div className="chapter-wrapper">
        <h2 className="chapter-title">Chapters</h2>
        {chapters && chapters.length > 0 ? (
          <div className="chapter-grid">
            {chapters.map((ch) => (
              <div key={ch.number} className="chapter-item-wrapper">
                <Link
                  to={`/read/${slug}/${hash}/chapter-${ch.number
                    .toString()
                    .replace(/\./g, "-")}`}
                  className={`chapter-item ${
                    readChapters.includes(ch.number) ? "read" : ""
                  }`}
                  onClick={() => markChapterAsRead(ch.number)}
                >
                  {ch.title || `Chapter ${ch.number}`}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p>No chapters available.</p>
        )}
      </div>
    </>
  );
}
