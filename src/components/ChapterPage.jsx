import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import ChapterImg from "./components/ChapterImg";
import ChapterNavigation from "./components/ChapterNavigation";
import API_BASE from "./Config";
import "../css/ChapterPage.css";

export default function ChapterPage() {
  const { slug, chapter } = useParams();
  const chapterKey = chapter.replace("-", "_");
  const chapterNumberStr = chapter.replace("-", ".");

  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [horizontalScroll, setHorizontalScroll] = useState(false);

  const [fullscreenIndex, setFullscreenIndex] = useState(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragOffset = useRef(0);
  const [overlayTransform, setOverlayTransform] = useState(0);

  // Fetch pages
  useEffect(() => {
    setLoadingPages(true);
    fetch(`${API_BASE}/get_pages?title=${slug}&chapter=${chapterKey}`)
      .then((res) => res.json())
      .then(setPages)
      .catch(console.error)
      .finally(() => setLoadingPages(false));
  }, [slug, chapterKey]);

  // Fetch chapters
  useEffect(() => {
    fetch(`${API_BASE}/get_chapters?title=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = data
          .map((ch) => ({ ...ch, numberStr: ch.number.toString() }))
          .sort((a, b) => parseFloat(a.number) - parseFloat(b.number));
        setChapters(sorted);
      })
      .catch(console.error);
  }, [slug]);

  const currentIndex = chapters.findIndex(
    (ch) => ch.numberStr === chapterNumberStr
  );
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  // Fullscreen handlers
  const openFullscreen = (index) => setFullscreenIndex(index);
  const closeFullscreen = () => setFullscreenIndex(null);

  const handlePrev = () => {
    setFullscreenIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };
  const handleNext = () => {
    setFullscreenIndex((prev) =>
      prev < pages.length - 1 ? prev + 1 : prev
    );
  };

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    dragOffset.current = 0;
  };

  const handleTouchMove = (e) => {
    const deltaX = e.touches[0].clientX - startX.current;
    const deltaY = e.touches[0].clientY - startY.current;

    if (horizontalScroll) dragOffset.current = deltaX;
    else dragOffset.current = deltaY;

    setOverlayTransform(dragOffset.current);
  };

  const handleTouchEnd = () => {
    if (horizontalScroll) {
      if (dragOffset.current < -50) handleNext();
      else if (dragOffset.current > 50) handlePrev();
    } else {
      if (dragOffset.current < -50) handleNext(); // swipe up → next page
      else if (dragOffset.current > 50) handlePrev(); // swipe down → prev page
    }

    dragOffset.current = 0;
    setOverlayTransform(0);
  };

  return (
    <div className="chapter-page">
      <Link to="/" className="back-link">
        ← Back to Home
      </Link>
      <h1 className="chapter-title">{slug}</h1>

      <button
        className="toggle-scroll-btn"
        onClick={() => setHorizontalScroll((prev) => !prev)}
      >
        {horizontalScroll ? "Vertical Scroll" : "Horizontal Scroll"}
      </button>

      {loadingPages && <p>Loading pages...</p>}

      <div
        className={`chapter-images ${
          horizontalScroll ? "horizontal-scroll" : ""
        }`}
      >
        {pages.map((page, idx) => (
          <ChapterImg
            key={page.key}
            src={page.src}
            alt={`Page ${page.key}`}
            index={idx}
            onOpenFullscreen={openFullscreen}
          />
        ))}
      </div>

      <ChapterNavigation
        prevChapter={prevChapter}
        nextChapter={nextChapter}
        slug={slug}
      />

      {/* Fullscreen Overlay */}
      {fullscreenIndex !== null && (
        <div
          className={`fullscreen-overlay ${
            !horizontalScroll ? "vertical" : ""
          }`}
          onClick={closeFullscreen}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {!horizontalScroll ? (
            <div
              className="fullscreen-vertical-wrapper"
              style={{
                transform: `translateY(-${fullscreenIndex * 100}%)`,
                transition: `transform 0.25s ease-out`,
              }}
            >
              {pages.map((page) => (
                <img
                  key={page.key}
                  src={page.src}
                  alt={`Page ${page.key}`}
                  className="fullscreen-img"
                  draggable={false}
                />
              ))}
            </div>
          ) : (
            <img
              src={pages[fullscreenIndex].src}
              alt={`Page ${pages[fullscreenIndex].key}`}
              className="fullscreen-img"
              draggable={false}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}
