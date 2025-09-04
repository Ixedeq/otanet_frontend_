import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "../css/ChapterPage.css";
import API_BASE from "./Config";

export default function ChapterPage() {
  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [horizontalScroll, setHorizontalScroll] = useState(null); // null = default mobile detection
  const { slug, chapter } = useParams();

  const chapterKey = chapter.replace("-", "_");
  const chapterNumberStr = chapter.replace("-", ".");

  // Detect if mobile
  const isMobile = window.innerWidth <= 600;

  // Fetch pages for current chapter
  useEffect(() => {
    setLoadingPages(true);
    const fetchPages = async () => {
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

  // Fetch all chapters
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_chapters?title=${slug}`);
        const data = await res.json();
        const sorted = data
          .map((ch) => ({ ...ch, numberStr: ch.number.toString() }))
          .sort((a, b) => parseFloat(a.number) - parseFloat(b.number));
        setChapters(sorted);
      } catch (err) {
        console.error(err);
      }
    };
    fetchChapters();
  }, [slug]);

  // Determine previous and next chapters
  const currentIndex = chapters.findIndex(
    (ch) => ch.numberStr === chapterNumberStr
  );
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  // Determine final scroll mode (mobile default or user toggle)
  const useHorizontalScroll =
    horizontalScroll !== null ? horizontalScroll : isMobile;

  return (
    <div className="chapter-page">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="chapter-title">{slug}</h1>

      {/* Toggle button */}
      <button
        className="toggle-scroll-btn"
        onClick={() => setHorizontalScroll((prev) => !prev)}
      >
        {useHorizontalScroll ? "Vertical Scroll" : "Horizontal Scroll"}
      </button>

      {loadingPages && <p>Loading pages...</p>}

      <div
        className={`chapter-images ${
          useHorizontalScroll ? "horizontal-scroll" : ""
        }`}
      >
        {pages.map(({ src, key }) => (
          <img
            key={key}
            src={src}
            className="chapter-img"
            alt={`Page ${key}`}
          />
        ))}
      </div>

      <div className="chapter-navigation">
        {prevChapter ? (
          <Link
            to={`/read/${slug}/chapter-${prevChapter.numberStr.replace(".", "-")}`}
            className="prev-chapter"
          >
            ← Previous Chapter
          </Link>
        ) : (
          <span className="prev-chapter disabled">← Previous Chapter</span>
        )}

        {nextChapter ? (
          <Link
            to={`/read/${slug}/chapter-${nextChapter.numberStr.replace(".", "-")}`}
            className="next-chapter"
          >
            Next Chapter →
          </Link>
        ) : (
          <span className="next-chapter disabled">Next Chapter →</span>
        )}
      </div>
    </div>
  );
}
