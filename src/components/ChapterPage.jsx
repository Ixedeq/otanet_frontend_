import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ChapterImg from "./components/ChapterImg";
import ChapterNavigation from "./components/ChapterNavigation";
import API_BASE from "./Config";

export default function ChapterPage() {
  const { slug, chapter } = useParams();
  const chapterKey = chapter.replace("-", "_");
  const chapterNumberStr = chapter.replace("-", ".");

  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [horizontalScroll, setHorizontalScroll] = useState(false);

  useEffect(() => {
    setLoadingPages(true);
    fetch(`${API_BASE}/get_pages?title=${slug}&chapter=${chapterKey}`)
      .then(res => res.json())
      .then(data => setPages(data))
      .catch(err => console.error(err))
      .finally(() => setLoadingPages(false));
  }, [slug, chapterKey]);

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

  return (
    <div className="chapter-page">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="chapter-title">{slug}</h1>

      <button
        className="toggle-scroll-btn"
        onClick={() => setHorizontalScroll(prev => !prev)}
      >
        {horizontalScroll ? "Vertical Scroll" : "Horizontal Scroll"}
      </button>

      {loadingPages && <p>Loading pages...</p>}

      <div className={`chapter-images ${horizontalScroll ? "horizontal-scroll" : ""}`}>
        {pages.map(page => (
          <ChapterImg
            key={page.key}
            src={page.src}
            alt={`Page ${page.key}`}
            vertical={!horizontalScroll}
          />
        ))}
      </div>

      <ChapterNavigation prevChapter={prevChapter} nextChapter={nextChapter} slug={slug} />
    </div>
  );
}
