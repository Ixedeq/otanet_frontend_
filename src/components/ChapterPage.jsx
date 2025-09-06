import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import "../css/ChapterPage.css";
import API_BASE from "./Config";

/* --- Single Page Image Component with Double-Tap Fullscreen --- */
function ChapterImg({ src, alt }) {
  const wrapperRef = useRef(null);
  const lastTap = useRef(0);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const isInNativeFullscreen = () =>
    !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.webkitIsFullScreen
    );

  const requestNativeFullscreen = async (el) => {
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
        return true;
      }
      if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
        return true;
      }
    } catch (e) {
      console.warn("Fullscreen error:", e);
    }
    return false;
  };

  const exitNativeFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } catch (e) {
      console.warn("Exit fullscreen error:", e);
    }
  };

  const openOverlay = () => setOverlayOpen(true);
  const closeOverlay = async () => {
    if (isInNativeFullscreen()) await exitNativeFullscreen();
    setOverlayOpen(false);
  };

  const toggleFullscreen = async () => {
    if (isInNativeFullscreen()) {
      await exitNativeFullscreen();
      setOverlayOpen(false);
      return;
    }

    const ok = await requestNativeFullscreen(wrapperRef.current);
    if (!ok) openOverlay(); // fallback for iOS
  };

  const onTouchEnd = (e) => {
    const now = Date.now();
    if (now - lastTap.current <= 300) {
      e.preventDefault(); // block iOS zoom
      toggleFullscreen();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  const onDoubleClick = (e) => {
    e.preventDefault();
    toggleFullscreen();
  };

  // Escape key to close overlay
  useEffect(() => {
    if (!overlayOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (ev) => ev.key === "Escape" && closeOverlay();
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
      >
        <img src={src} alt={alt} className="chapter-img" draggable={false} />
      </div>

      {overlayOpen && (
      <div className="fullscreen-overlay" onClick={closeOverlay}>
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
