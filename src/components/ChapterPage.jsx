import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import ChapterImg from "./components/ChapterImg";
import ChapterNavigation from "./components/ChapterNavigation";
import API_BASE from "./Config";
import parseChapterNumber from "./components/ParseChapterNumber"; 
import "../css/ChapterPage.css";

export default function ChapterPage() {
  const { slug, chapter } = useParams();
  const chapterKey = chapter.replace("-", "_");
  const chapterNumberStr = parseChapterNumber(chapter); 
  const chapterNumber = parseFloat(chapterNumberStr); // numeric

  const [mangaTitle, setMangaTitle] = useState("");
  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [horizontalScroll, setHorizontalScroll] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(null);

  const pageContainerRef = useRef(null);

  // --- Mark chapter as read in localStorage immediately ---
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`${slug}-readChapters`)) || [];
    if (!saved.includes(chapterNumber)) {
      const updated = [...saved, chapterNumber];
      localStorage.setItem(`${slug}-readChapters`, JSON.stringify(updated));
    }
  }, [slug, chapterNumber]);

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

  // --- Current chapter index & navigation ---
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
    else setFullscreenIndex(null);
    setFullscreen((prev) => !prev);
  };

  // --- Prevent body scroll in fullscreen & handle scroll position ---
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = "";
      if (pageContainerRef.current) {
        const container = pageContainerRef.current;
        container.scrollTop = container.scrollHeight;
        window.scrollTo(0, container.scrollHeight);
      }
    }
    return () => (document.body.style.overflow = "");
  }, [fullscreen]);

  // --- Scroll to top on new chapter in vertical fullscreen ---
  useEffect(() => {
    if (fullscreen && !horizontalScroll && pageContainerRef.current) {
      pageContainerRef.current.scrollTop = 0;
      window.scrollTo(0, 0);
    }
  }, [chapterKey, fullscreen, horizontalScroll]);

  return (
    <div
      className={`chapter-page ${fullscreen ? "fullscreen-mode" : ""}`}
      ref={pageContainerRef}
    >
      <Link to="/" className="back-link">
        ← Back to Home
      </Link>

      <Link to={`/${slug}`}>
        <h1 className="chapter-title">
          {mangaTitle} – Chapter {chapterNumberStr}
        </h1>
      </Link>

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
            ? horizontalScroll
              ? "fullscreen horizontal-scroll"
              : "fullscreen vertical-scroll"
            : horizontalScroll
            ? "horizontal-scroll"
            : "vertical-scroll"
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

      {!horizontalScroll && <div className="chapter-bottom-spacer" />}
    </div>
  );
}
