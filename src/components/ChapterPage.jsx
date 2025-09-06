import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import ChapterImg from "./components/ChapterImg";
import ChapterNavigation from "./components/ChapterNavigation";
import API_BASE from "./Config";

export default function ChapterPage() {
  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [horizontalScroll, setHorizontalScroll] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const overlayRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragOffset = useRef(0);

  const { slug, chapter } = useParams();
  const chapterKey = chapter.replace("-", "_");
  const chapterNumberStr = chapter.replace("-", ".");

  // Fetch pages
  useEffect(() => {
    setLoadingPages(true);
    const fetchPages = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_pages?title=${slug}&chapter=${chapterKey}`);
        const data = await res.json();
        setPages(data);
        setCurrentPage(0);
      } catch (err) {
        console.error(err);
        setPages([]);
      } finally {
        setLoadingPages(false);
      }
    };
    fetchPages();
  }, [slug, chapterKey]);

  // Fetch chapters
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

  const currentIndex = chapters.findIndex((ch) => ch.numberStr === chapterNumberStr);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
  const useHorizontalScroll = horizontalScroll !== null ? horizontalScroll : false;

  // Overlay swipe handlers
  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    dragOffset.current = 0;
  };

  const handleTouchMove = (e) => {
    const deltaX = e.touches[0].clientX - startX.current;
    const deltaY = e.touches[0].clientY - startY.current;
    dragOffset.current = useHorizontalScroll ? deltaX : deltaY;
  };

  const handleTouchEnd = () => {
    if (useHorizontalScroll) {
      if (dragOffset.current < -50) setCurrentPage(Math.min(currentPage + 1, pages.length - 1));
      else if (dragOffset.current > 50) setCurrentPage(Math.max(currentPage - 1, 0));
    } else {
      if (dragOffset.current > 100) setOverlayOpen(false);
    }
  };

  const openOverlay = (index) => {
    setCurrentPage(index);
    setOverlayOpen(true);
  };

  const handleNext = () => setCurrentPage(Math.min(currentPage + 1, pages.length - 1));
  const handlePrev = () => setCurrentPage(Math.max(currentPage - 1, 0));

  return (
    <div className="chapter-page">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="chapter-title">{slug}</h1>

      <button className="toggle-scroll-btn" onClick={() => setHorizontalScroll(prev => !prev)}>
        {useHorizontalScroll ? "Vertical Scroll" : "Horizontal Scroll"}
      </button>

      {loadingPages && <p>Loading pages...</p>}

      <div className={`chapter-images ${useHorizontalScroll ? "horizontal-scroll" : ""}`}>
        {pages.map((page, i) => (
          <ChapterImg key={page.key} src={page.src} alt={`Page ${page.key}`} index={i} onOpenOverlay={openOverlay} />
        ))}
      </div>

      <ChapterNavigation prevChapter={prevChapter} nextChapter={nextChapter} slug={slug} />

      {/* Fullscreen overlay */}
      {overlayOpen && pages[currentPage] && (
        <div
          className="fullscreen-overlay"
          ref={overlayRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="fullscreen-wrapper">
            <img src={pages[currentPage].src} alt={`Page ${currentPage + 1}`} className="fullscreen-img" draggable={false} />
            <div className="fullscreen-page-counter">{currentPage + 1} / {pages.length}</div>
            {!useHorizontalScroll && <button className="fullscreen-close" onClick={() => setOverlayOpen(false)}>✕</button>}
            {useHorizontalScroll && <>
              <button className="fullscreen-prev" onClick={handlePrev}>◀</button>
              <button className="fullscreen-next" onClick={handleNext}>▶</button>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}
