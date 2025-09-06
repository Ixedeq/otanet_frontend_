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
  const [animating, setAnimating] = useState(false);
  const overlayRef = useRef(null);
  const startY = useRef(0);
  const dragOffset = useRef(0);

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
    if (fullscreenIndex > 0) setFullscreenIndex(fullscreenIndex - 1);
  };
  const handleNext = () => {
    if (fullscreenIndex < pages.length - 1) setFullscreenIndex(fullscreenIndex + 1);
  };

  // Vertical swipe handlers
  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    dragOffset.current = 0;
  };

  const handleTouchMove = (e) => {
    if (horizontalScroll) return;
    const deltaY = e.touches[0].clientY - startY.current;
    dragOffset.current = deltaY;
    if (overlayRef.current) {
      overlayRef.current.style.transform = `translateY(${deltaY}px)`;
      overlayRef.current.style.transition = "none";
    }
  };

  const handleTouchEnd = () => {
    if (horizontalScroll) return;
    const threshold = 100; // swipe distance to change page
    if (!overlayRef.current) return;

    if (dragOffset.current < -threshold && fullscreenIndex < pages.length - 1) {
      // Swipe up → next page
      setAnimating(true);
      overlayRef.current.style.transform = `translateY(-100%)`;
      overlayRef.current.style.transition = "transform 0.3s ease-out";
      setTimeout(() => {
        handleNext();
        overlayRef.current.style.transition = "none";
        overlayRef.current.style.transform = "translateY(0)";
        setAnimating(false);
      }, 300);
    } else if (dragOffset.current > threshold && fullscreenIndex > 0) {
      // Swipe down → previous page
      setAnimating(true);
      overlayRef.current.style.transform = `translateY(100%)`;
      overlayRef.current.style.transition = "transform 0.3s ease-out";
      setTimeout(() => {
        handlePrev();
        overlayRef.current.style.transition = "none";
        overlayRef.current.style.transform = "translateY(0)";
        setAnimating(false);
      }, 300);
    } else if (dragOffset.current > threshold && fullscreenIndex === 0) {
      // Swipe down on first page → close
      closeFullscreen();
    } else {
      // Reset if swipe not enough
      overlayRef.current.style.transform = "translateY(0)";
      overlayRef.current.style.transition = "transform 0.2s ease-out";
    }

    dragOffset.current = 0;
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
          className="fullscreen-overlay"
          onClick={closeFullscreen}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            ref={overlayRef}
            src={pages[fullscreenIndex].src}
            alt={`Page ${pages[fullscreenIndex].key}`}
            className="fullscreen-img"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
