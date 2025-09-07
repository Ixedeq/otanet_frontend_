import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import ChapterImg from "./components/ChapterImg";
import ChapterNavigation from "./components/ChapterNavigation";
import API_BASE from "./Config";
import "../css/ChapterPage.css";

export default function ChapterPage() {
  const { slug, chapter } = useParams();
  const chapterKey = chapter.replace("-", "_");
  const chapterNumberStr = chapter.split("-")[1] || "0";

  const [mangaTitle, setMangaTitle] = useState("");
  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [horizontalScroll, setHorizontalScroll] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(null);

  const pageContainerRef = useRef(null);

  // --- Fetch pages ---
  useEffect(() => {
    const fetchPages = async () => {
      setLoadingPages(true);
      try {
        const res = await fetch(
          `${API_BASE}/get_pages?title=${slug}&chapter=${chapterKey}`
        );
        const data = await res.json();
        setPages(data);
      } catch (err) {
        console.error("Failed to fetch pages:", err);
        setPages([]);
      } finally {
        setLoadingPages(false);
      }
    };
    fetchPages();
  }, [slug, chapterKey]);

  // --- Fetch chapters + manga info ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chaptersRes, mangaRes] = await Promise.all([
          fetch(`${API_BASE}/get_chapters?title=${slug}`),
          fetch(`${API_BASE}/${slug}`),
        ]);

        const chaptersData = await chaptersRes.json();
        const sortedChapters = chaptersData
          .map((ch) => ({ ...ch, numberStr: ch.number.toString() }))
          .sort((a, b) => parseFloat(a.number) - parseFloat(b.number));
        setChapters(sortedChapters);

        const mangaData = await mangaRes.json();
        setMangaTitle(mangaData.title || slug);
      } catch (err) {
        console.error("Failed to fetch chapters/manga info:", err);
        setMangaTitle(slug);
        setChapters([]);
      }
    };
    fetchData();
  }, [slug]);

  // --- Current chapter index ---
  const currentIndex = useMemo(
    () => chapters.findIndex((ch) => ch.numberStr === chapterNumberStr),
    [chapters, chapterNumberStr]
  );
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  // --- Fullscreen toggle ---
  const toggleFullscreen = (index = null) => {
    if (!fullscreen && index !== null) setFullscreenIndex(index);
    if (fullscreen) setFullscreenIndex(null);
    setFullscreen((prev) => !prev);
  };

  // --- Disable body scroll in fullscreen ---
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0); // hides iOS toolbar
    } else {
      document.body.style.overflow = "";
    }
    return () => (document.body.style.overflow = "");
  }, [fullscreen]);

  return (
    <div
      className={`chapter-page ${fullscreen ? "fullscreen-mode" : ""} ${
        horizontalScroll ? "horizontal-scroll" : ""
      }`}
      ref={pageContainerRef}
    >
      <Link to="/" className="back-link">
        ← Back to Home
      </Link>

      <h1 className="chapter-title">
        {mangaTitle} – Chapter {chapterNumberStr}
      </h1>

      {/* Toggle button only when NOT in fullscreen */}
      {!fullscreen && (
        <button
          className="toggle-scroll-btn"
          onClick={() => setHorizontalScroll((prev) => !prev)}
        >
          {horizontalScroll ? "Vertical Scroll" : "Horizontal Scroll"}
        </button>
      )}

      {loadingPages && <p>Loading pages...</p>}

      <div
        className={`chapter-images ${
          fullscreen
            ? "fullscreen horizontal-scroll" // fullscreen respects horizontal mode
            : horizontalScroll
            ? "horizontal-scroll"
            : ""
        }`}
      >
        {pages.map((page, idx) => (
          <ChapterImg
            key={page.key || idx}
            src={page.src}
            alt={`Page ${page.key || idx}`}
            index={idx}
            onOpenFullscreen={() => toggleFullscreen(idx)}
          />
        ))}
      </div>

      <ChapterNavigation
        slug={slug}
        chapters={chapters}
        currentChapterNumberStr={chapterNumberStr}
        prevChapter={prevChapter}
        nextChapter={nextChapter}
      />
    </div>
  );
}
