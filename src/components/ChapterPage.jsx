import React, { useState, useEffect } from "react";
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

  const openFullscreen = (index) => setFullscreenIndex(index);
  const closeFullscreen = () => setFullscreenIndex(null);

  return (
    <div className="chapter-page">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="chapter-title">{slug}</h1>

      <button
        className="toggle-scroll-btn"
        onClick={() => setHorizontalScroll((prev) => !prev)}
      >
        {horizontalScroll ? "Vertical Scroll" : "Horizontal Scroll"}
      </button>

      {loadingPages && <p>Loading pages...</p>}

      <div className={`chapter-images ${horizontalScroll ? "horizontal-scroll" : ""}`}>
        {pages.map((page, idx) => (
          <ChapterImg
            key={page.key}
            src={page.src}
            alt={`Page ${page.key}`}
            index={idx}
            onOpenFullscreen={() => openFullscreen(idx)}
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
        <>
          {horizontalScroll ? (
            // Horizontal fullscreen
            <div className="fullscreen-overlay horizontal" onClick={closeFullscreen}>
              <div className="horizontal-images-wrapper">
                {pages.map((page, idx) => (
                  <div
                    key={page.key}
                    className="chapter-img-wrapper"
                    style={{
                      flex: "0 0 85%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      scrollSnapAlign: "center",
                    }}
                  >
                    <img
                      src={page.src}
                      alt={`Page ${page.key}`}
                      className="fullscreen-img"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Vertical fullscreen (stacked Webtoon)
            <div className="fullscreen-overlay" onClick={closeFullscreen}>
              <div className="vertical-images-container">
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
