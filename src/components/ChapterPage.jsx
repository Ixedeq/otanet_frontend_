import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import "../css/ChapterPage.css";
import API_BASE from "./Config";

/* --- Single Page Image Component with Double-Tap Fullscreen --- */
function ChapterImg({ src, alt, index, totalPages, onChangePage, vertical }) {
  const wrapperRef = useRef(null);
  const lastTap = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const toggleOverlay = () => setOverlayOpen((prev) => !prev);

  const onTouchStart = (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setDragOffset(0);
  };

  const onTouchMove = (e) => {
    if (!overlayOpen || !e.touches || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - startX.current;
    const deltaY = e.touches[0].clientY - startY.current;
    setDragOffset(vertical ? deltaY : deltaX);
  };

  const onTouchEnd = (e) => {
    const now = Date.now();
    // double-tap detection
    if (now - lastTap.current <= 300) {
      e.preventDefault();
      toggleOverlay();
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;

    if (!overlayOpen) return;

    if (vertical) {
      if (dragOffset > 100) setOverlayOpen(false); // slide down
    } else {
      if (dragOffset < -50) onChangePage(Math.min(index + 1, totalPages - 1)); // swipe left
      if (dragOffset > 50) onChangePage(Math.max(index - 1, 0)); // swipe right
    }

    setDragOffset(0);
  };

  const onDoubleClick = (e) => {
    e.preventDefault();
    toggleOverlay();
  };

  // Lock scroll on overlay
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
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onDoubleClick={onDoubleClick}
      >
        <img src={src} alt={alt} className="chapter-img" draggable={false} />
      </div>

      {overlayOpen && (
        <div
          className="fullscreen-overlay"
          style={{
            transform: vertical ? `translateY(${dragOffset}px)` : `translateX(${dragOffset}px)`,
            transition: dragOffset === 0 ? "transform 0.25s ease-out" : "none",
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={() => setOverlayOpen(false)}
        >
          <div className="fullscreen-wrapper">
            <img src={src} alt={alt} className="fullscreen-img" draggable={false} />
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
        {pages.map((page, i) => (
  <ChapterImg
    key={page.key}
    src={page.src}
    alt={`Page ${page.key}`}
    index={i}
    totalPages={pages.length}
    onChangePage={(newIndex) => {
      // scroll to new page in horizontal mode
      const pageEl = document.getElementsByClassName("chapter-img-wrapper")[newIndex];
      pageEl?.scrollIntoView({ behavior: "smooth", inline: "center" });
    }}
    vertical={!useHorizontalScroll}
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
