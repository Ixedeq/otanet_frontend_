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
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(null);

  const pageContainerRef = useRef(null);

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

  const currentIndex = chapters.findIndex(
    (ch) => ch.numberStr === chapterNumberStr
  );
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  const toggleFullscreen = (index = null) => {
    if (index !== null) setFullscreenIndex(index);
    setFullscreen((prev) => !prev);
  };

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

      <button
        className="toggle-scroll-btn"
        onClick={() => setHorizontalScroll((prev) => !prev)}
      >
        {horizontalScroll ? "Vertical Scroll" : "Horizontal Scroll"}
      </button>

      {loadingPages && <p>Loading pages...</p>}

      <div className="chapter-images">
        {pages.map((page, idx) => (
          <ChapterImg
            key={page.key}
            src={page.src}
            alt={`Page ${page.key}`}
            index={idx}
            onOpenFullscreen={() => toggleFullscreen(idx)}
          />
        ))}
      </div>

      <ChapterNavigation
        slug={slug}
        chapters={chapters}
        currentChapterNumberStr={chapterNumberStr}
      />
    </div>
  );
}
