import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import "../css/ChapterPage.css";
import API_BASE from "./Config";

function ChapterImg({ src, alt }) {
  const imgRef = useRef(null);
  const lastTap = useRef(0);

  const toggleFullscreen = () => {
    const el = imgRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        // iOS Safari fallback
        el.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  const handleTouchEnd = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap detected
      toggleFullscreen();
    }
    lastTap.current = now;
  };

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className="chapter-img"
      onDoubleClick={toggleFullscreen} // desktop double click
      onTouchEnd={handleTouchEnd}      // mobile double tap
    />
  );
}

export default function ChapterPage() {
  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [horizontalScroll, setHorizontalScroll] = useState(null);
  const { slug, chapter } = useParams();

  const chapterKey = chapter.replace("-", "_");
  const chapterNumberStr = chapter.replace("-", ".");

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

  const currentIndex = chapters.findIndex(
    (ch) => ch.numberStr === chapterNumberStr
  );
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  const useHorizontalScroll =
    horizontalScroll !== null ? horizontalScroll : false;

  return (
    <div className="chapter-page">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="chapter-title">{slug}</h1>

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
          <ChapterImg key={key} src={src} alt={`Page ${key}`} />
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
