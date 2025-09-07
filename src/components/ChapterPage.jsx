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

  const chapterContainerRef = useRef(null); // main scroll container
  const fullscreenRef = useRef(null); // fullscreen container
  const savedScrollPos = useRef(0); // track vertical scroll

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

  const openFullscreen = (index) => {
    // save current scroll position before opening fullscreen
    if (chapterContainerRef.current) {
      savedScrollPos.current = chapterContainerRef.current.scrollTop;
    }
    setFullscreenIndex(index);
  };

  const closeFullscreen = () => {
    setFullscreenIndex(null);
    // restore scroll position after exiting fullscreen
    if (chapterContainerRef.current) {
      chapterContainerRef.current.scrollTo({
        top: savedScrollPos.current,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="chapter-page" ref={chapterContainerRef}>
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

      {fullscreenIndex !== null && (
        <>
          {horizontalScroll ? (
            <div className="fullscreen-overlay horizontal" ref={fullscreenRef} onClick={closeFullscreen}>
              <div className="horizontal-images-wrapper">
                {pages.map((page) => (
                  <div key={page.key} className="chapter-img-wrapper horizontal-fullscreen">
                    <img
                      src={page.src}
                      alt={`Page ${page.key}`}
                      className="fullscreen-img"
                      draggable={false}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="fullscreen-overlay" ref={fullscreenRef} onClick={closeFullscreen}>
              <div className="vertical-images-container">
                {pages.map((page) => (
                  <img
                    key={page.key}
                    src={page.src}
                    alt={`Page ${page.key}`}
                    className="fullscreen-img"
                    draggable={false}
                    onClick={(e) => e.stopPropagation()}
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
