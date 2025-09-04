import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/ChapterPage.css";
import API_BASE from "./Config";

export default function ChapterPage() {
  const { slug, chapter } = useParams();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);

  // Convert chapter param for API
  const chapterKey = chapter.replace("-", "_");
  const chapterNumber = parseFloat(chapter.replace("-", "."));

  // Fetch pages for current chapter
  useEffect(() => {
    const fetchPages = async () => {
      setLoadingPages(true);
      try {
        const res = await fetch(
          `${API_BASE}/get_pages?title=${slug}&chapter=${chapterKey}`
        );
        const data = await res.json();
        setPages(data);
      } catch (err) {
        console.error(err);
        setPages([]);
      } finally {
        setLoadingPages(false);
      }
    };
    fetchPages();
  }, [slug, chapterKey]);

  // Fetch chapters once
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_chapters?title=${slug}`);
        const data = await res.json();
        const sorted = data
          .map((ch) => ({ ...ch, number: parseFloat(ch.number) }))
          .sort((a, b) => a.number - b.number);
        setChapters(sorted);
      } catch (err) {
        console.error(err);
      }
    };
    fetchChapters();
  }, [slug]);

  // Compute previous and next chapter numbers
  const currentIndex = chapters.findIndex((ch) => ch.number === chapterNumber);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  // Navigate to next or previous chapter
  const goToChapter = (ch) => {
    if (!ch) return;
    const chSlug = ch.number.toString().replace(".", "-");
    navigate(`/${slug}/chapter-${chSlug}`);
  };

  return (
    <div className="chapter-page">
      <button className="back-link" onClick={() => navigate("/")}>
        ← Back to Home
      </button>
      <h1 className="chapter-title">{slug}</h1>

      {loadingPages && <p>Loading pages...</p>}

      <div className="chapter-images">
        {pages.map(({ src, key }) => (
          <img key={key} src={src} className="chapter-img" alt={`Page ${key}`} />
        ))}
      </div>

      <div className="chapter-navigation">
        <button
          className={`prev-chapter ${prevChapter ? "" : "disabled"}`}
          onClick={() => goToChapter(prevChapter)}
          disabled={!prevChapter}
        >
          ← Previous Chapter
        </button>

        <button
          className={`next-chapter ${nextChapter ? "" : "disabled"}`}
          onClick={() => goToChapter(nextChapter)}
          disabled={!nextChapter}
        >
          Next Chapter →
        </button>
      </div>
    </div>
  );
}
