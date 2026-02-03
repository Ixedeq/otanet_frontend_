import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import ChapterImg from "./components/ChapterImg";
import ChapterNavigation from "./components/ChapterNavigation";
import API_BASE from "./Config";
import parseChapterNumber from "./components/ParseChapterNumber"; 
import "../css/ChapterPage.css";

export default function ChapterPage() {
  const { slug, hash, chapter } = useParams();
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

  // inside ChapterPage component, add this function:
  const markChapterAsRead = (number) => {
    const saved = JSON.parse(localStorage.getItem(`${slug}-readChapters`)) || [];
    if (!saved.includes(number)) {
      const updated = [...saved, number];
      localStorage.setItem(`${slug}-readChapters`, JSON.stringify(updated));

      // Dispatch custom event so MangaPage updates immediately
      window.dispatchEvent(
        new CustomEvent("readChaptersUpdated", {
          detail: { slug, updatedChapters: updated },
        })
      );
    }
  };


  // --- Fetch pages ---
  useEffect(() => {
    const fetchPages = async () => {
      setLoadingPages(true);
      try {
        const res = await fetch(
          `${API_BASE}/get_pages?title=${slug}&hash=${hash}&chapter=${chapterKey}`
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
          fetch(`${API_BASE}/get_chapters?hash=${hash}`),
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

  // Store scroll position before entering fullscreen
  const scrollPositionRef = useRef(0);

  // --- Fullscreen toggle ---
  const toggleFullscreen = (index = null) => {
    if (!fullscreen) {
      // Entering fullscreen - save current scroll position
      scrollPositionRef.current = window.scrollY;
      if (index !== null) setFullscreenIndex(index);
    } else {
      // Exiting fullscreen
      setFullscreenIndex(null);
    }
    setFullscreen((prev) => !prev);
  };

  // --- Prevent body scroll in fullscreen & handle scroll position ---
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // Restore scroll position after exiting fullscreen
      if (scrollPositionRef.current > 0) {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPositionRef.current);
        });
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
      className={`chapter-page ${fullscreen ? "fullscreen-mode" : ""} ${horizontalScroll && !fullscreen ? "horizontal-mode" : ""}`}
      ref={pageContainerRef}
    >
      {!fullscreen && (
        <div className="chapter-header">
          <Link to={`/${slug}`} className="back-link">
            ← {mangaTitle}
          </Link>
          <h1 className="chapter-title">Chapter {chapterNumberStr}</h1>
          <div className="header-right">
            <button
              className="toggle-scroll-btn"
              onClick={() => setHorizontalScroll((prev) => !prev)}
              title={horizontalScroll ? "Switch to vertical scroll" : "Switch to horizontal scroll"}
            >
              {horizontalScroll ? "↕" : "↔"}
            </button>
          </div>
        </div>
      )}

      {!fullscreen && (
        <div className="chapter-navigation top-nav">
          {prevChapter ? (
            <Link
              to={`/read/${slug}/${hash}/chapter-${prevChapter.numberStr.replace(/\./g, "-")}`}
              className="nav-btn prev"
              onClick={() => markChapterAsRead(parseFloat(prevChapter.numberStr))}
            >
              ‹ Prev
            </Link>
          ) : (
            <span className="nav-btn prev disabled">‹ Prev</span>
          )}
          <span className="nav-chapter-indicator">Ch. {chapterNumberStr}</span>
          {nextChapter ? (
            <Link
              to={`/read/${slug}/${hash}/chapter-${nextChapter.numberStr.replace(/\./g, "-")}`}
              className="nav-btn next"
              onClick={() => markChapterAsRead(parseFloat(nextChapter.numberStr))}
            >
              Next ›
            </Link>
          ) : (
            <span className="nav-btn next disabled">Next ›</span>
          )}
        </div>
      )}

      {loadingPages && <p className="loading-text">Loading pages...</p>}

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

      {!fullscreen && (
        <div className="chapter-navigation bottom-nav">
          {prevChapter ? (
            <Link
              to={`/read/${slug}/${hash}/chapter-${prevChapter.numberStr.replace(/\./g, "-")}`}
              className="nav-btn prev"
              onClick={() => markChapterAsRead(parseFloat(prevChapter.numberStr))}
            >
              ← Previous Chapter
            </Link>
          ) : (
            <span className="nav-btn prev disabled">← Previous Chapter</span>
          )}
          {nextChapter ? (
            <Link
              to={`/read/${slug}/${hash}/chapter-${nextChapter.numberStr.replace(/\./g, "-")}`}
              className="nav-btn next"
              onClick={() => markChapterAsRead(parseFloat(nextChapter.numberStr))}
            >
              Next Chapter →
            </Link>
          ) : (
            <span className="nav-btn next disabled">Next Chapter →</span>
          )}
        </div>
      )}

      {!horizontalScroll && <div className="chapter-bottom-spacer" />}
    </div>
  );
}
