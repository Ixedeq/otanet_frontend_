import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import "../css/ChapterPage.css";
import API_BASE from "./Config";

/* --- Single Page Image Component with Double-Tap Fullscreen --- */
function ChapterImg({ src, alt }) {
  const wrapperRef = useRef(null);
  const lastTap = useRef(0);
  const startY = useRef(0);
  const startX = useRef(0);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Fullscreen toggling
  const toggleFullscreen = () => setOverlayOpen((prev) => !prev);

  // Double-tap / single-tap detection
  const onTouchEnd = (e) => {
    const now = Date.now();
    if (now - lastTap.current <= 300) {
      e.preventDefault();
      toggleFullscreen();
      lastTap.current = 0;
    } else lastTap.current = now;
  };

  const onDoubleClick = (e) => {
    e.preventDefault();
    toggleFullscreen();
  };

  // Track drag start for vertical slide-down or horizontal swipe
  const onTouchStart = (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    startY.current = e.touches[0].clientY;
    startX.current = e.touches[0].clientX;
    setDragOffset(0);
  };

  const onTouchMove = (e) => {
    if (!overlayOpen) return;
    if (!e.touches || e.touches.length !== 1) return;

    const deltaY = e.touches[0].clientY - startY.current;
    const deltaX = e.touches[0].clientX - startX.current;

    if (vertical) setDragOffset(deltaY); // slide-down for vertical
    else setDragOffset(deltaX);         // swipe left/right for horizontal
  };

  const onTouchEndDrag = () => {
    if (!overlayOpen) return;

    if (vertical) {
      if (dragOffset > 100) setOverlayOpen(false); // slide down to close
    } else {
      if (dragOffset > 50) onChangePage(Math.max(index - 1, 0)); // swipe right
      else if (dragOffset < -50) onChangePage(Math.min(index + 1, totalPages - 1)); // swipe left
    }

    setDragOffset(0);
  };

  // Lock scroll when overlay is open
  useEffect(() => {
    if (!overlayOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (ev) => ev.key === "Escape" && setOverlayOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [overlayOpen]);

  return (
    <>
      <div
        ref={wrapperRef}
        className="chapter-img-wrapper"
        onTouchEnd={onTouchEnd}
        onDoubleClick={onDoubleClick}
        role="button"
        aria-label={alt}
      >
        <img src={src} alt={alt} className="chapter-img" draggable={false} />
      </div>

      {overlayOpen && (
        <div
          className="fullscreen-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setOverlayOpen(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndDrag}
          style={{
            transform: vertical ? `translateY(${dragOffset}px)` : `translateX(${dragOffset}px)`,
            transition: dragOffset === 0 ? "transform 0.25s ease-out" : "none"
          }}
        >
          <div className="fullscreen-wrapper">
            <img
              src={src}
              alt={alt}
              className="fullscreen-img"
              draggable={false}
            />
          </div>
        </div>
      )}
    </>
  );
}

/* --- Main Chapter Page Component --- */
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
