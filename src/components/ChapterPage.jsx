import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import ChapterImg from "./components/ChapterImg";
import ChapterNavigation from "./components/ChapterNavigation";
import API_BASE from "./Config";
import "../css/ChapterPage.css";

export default function ChapterPage() {
  const { slug, chapter } = useParams();
  const chapterKey = chapter.replace("-", "_");
  const chapterNumberStr = chapter.split("-")[1];

  const [mangaTitle, setMangaTitle] = useState("");
  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [horizontalScroll, setHorizontalScroll] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(null);

  const pageContainerRef = useRef(null);
  const fullscreenRef = useRef(null);

  // Fetch pages
  useEffect(() => {
    setLoadingPages(true);
    fetch(`${API_BASE}/get_pages?title=${slug}&chapter=${chapterKey}`)
      .then((res) => res.json())
      .then(setPages)
      .catch(console.error)
      .finally(() => setLoadingPages(false));
  }, [slug, chapterKey]);

  // Fetch chapters + manga info
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

    fetch(`${API_BASE}/${slug}`)
      .then((res) => res.json())
      .then((data) => setMangaTitle(data.title || slug))
      .catch(() => setMangaTitle(slug));
  }, [slug]);

  const currentIndex = chapters.findIndex((ch) => ch.numberStr === chapterNumberStr);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  const openFullscreen = (index) => setFullscreenIndex(index);
  const closeFullscreen = () => setFullscreenIndex(null);

  // Sync scroll between fullscreen and main page
  useEffect(() => {
    if (!fullscreenRef.current || !pageContainerRef.current) return;

    const handleScroll = () => {
      pageContainerRef.current.scrollTop = fullscreenRef.current.scrollTop;
    };

    const fs = fullscreenRef.current;
    fs.addEventListener("scroll", handleScroll);
    return () => fs.removeEventListener("scroll", handleScroll);
  }, [fullscreenIndex]);

  return (
    <div className="chapter-page" ref={pageContainerRef}>
      <Link to="/" className="back-link">← Back to Home</Link>

      <h1 className="chapter-title">
        {mangaTitle} – Chapter {chapterNumberStr}
      </h1>

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
        slug={slug}
        chapters={chapters}
        currentChapterNumberStr={chapterNumberStr}
      />

      {/* Fullscreen Overlay */}
      {fullscreenIndex !== null && (
        <>
          {horizontalScroll ? (
            // Horizontal fullscreen
            <div className="fullscreen-overlay horizontal" ref={fullscreenRef} onClick={closeFullscreen}>
              <div className="horizontal-images-wrapper">
                {pages.map((page) => (
                  <div key={page.key} className="chapter-img-wrapper horizontal-fullscreen">
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
            // Vertical fullscreen (Webtoon)
            <div className="fullscreen-overlay" ref={fullscreenRef} onClick={closeFullscreen}>
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
