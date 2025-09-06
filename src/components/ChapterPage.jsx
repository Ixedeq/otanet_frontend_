import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import ChapterImg from "./ChapterImg";
import ChapterNavigation from "./ChapterNavigation";
import API_BASE from "./Config";

export default function ChapterPage() {
  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [horizontalScroll, setHorizontalScroll] = useState(false);
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
    fetch(`${API_BASE}/get_pages?title=${slug}&chapter=${chapterKey}`)
      .then(res => res.json())
      .then(data => {
        setPages(data);
        setCurrentPage(0);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingPages(false));
  }, [slug, chapterKey]);

  // Fetch chapters
  useEffect(() => {
    fetch(`${API_BASE}/get_chapters?title=${slug}`)
      .then(res => res.json())
      .then(data => {
        const sorted = data
          .map(ch => ({ ...ch, numberStr: ch.number.toString() }))
          .sort((a, b) => parseFloat(a.number) - parseFloat(b.number));
        setChapters(sorted);
      })
      .catch(err => console.error(err));
  }, [slug]);

  const currentIndex = chapters.findIndex(ch => ch.numberStr === chapterNumberStr);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const handleOpenOverlay = (index) => {
    setCurrentPage(index);
    setOverlayOpen(true);
  };

  const handleCloseOverlay = () => setOverlayOpen(false);
  const handleNext = () => setCurrentPage(Math.min(currentPage + 1, pages.length - 1));
  const handlePrev = () => setCurrentPage(Math.max(currentPage - 1, 0));

  // Swipe handlers
  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    dragOffset.current = 0;
  };

  const handleTouchMove = (e) => {
    const deltaX = e.touches[0].clientX - startX.current;
    const deltaY = e.touches[0].clientY - startY.current;
    dragOffset.current = horizontalScroll ? deltaX : deltaY;
  };

  const handleTouchEnd = () => {
    if (horizontalScroll) {
      if (dragOffset.current < -50) handleNext();
      else if (dragOffset.current > 50) handlePrev();
    } else {
      if (dragOffset.current > 100) handleCloseOverlay();
    }
  };

  return (
    <div className="chapter-page">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="chapter-title">{slug}</h1>

      <button className="toggle-scroll-btn" onClick={() => setHorizontalScroll(prev => !prev)}>
        {horizontalScroll ? "Vertical Scroll" : "Horizontal Scroll"}
      </button>

      {loadingPages && <p>Loading pages...</p>}

      <div className={`chapter-images ${horizontalScroll ? "horizontal-scroll" : ""}`}>
        {pages.map((page, i) => (
          <ChapterImg key={page.key} src={page.src} alt={`Page ${page.key}`} index={i} onOpenOverlay={handleOpenOverlay} />
        ))}
      </div>

      <ChapterNavigation prevChapter={prevChapter} nextChapter={nextChapter} slug={slug} />

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

            {!horizontalScroll && (
              <button className="fullscreen-close" onClick={handleCloseOverlay}>✕</button>
            )}

            {horizontalScroll && <>
              <button className="fullscreen-prev" onClick={handlePrev}>◀</button>
              <button className="fullscreen-next" onClick={handleNext}>▶</button>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}
