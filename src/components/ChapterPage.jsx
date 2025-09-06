import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "../css/ChapterPage.css";
import API_BASE from "./Config";
import ChapterImg from "./components/ChapterImg";
import ChapterNavigation from "./components/ChapterNavigation";

export default function ChapterPage() {
  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [horizontalScroll, setHorizontalScroll] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const { slug, chapter } = useParams();

  const chapterKey = chapter.replace("-", "_");
  const chapterNumberStr = chapter.replace("-", ".");

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
          <ChapterImg
            key={page.key}
            src={page.src}
            alt={`Page ${page.key}`}
            index={i}
            totalPages={pages.length}
            onChangePage={(newIndex) => {
              const pageEl = document.getElementsByClassName("chapter-img-wrapper")[newIndex];
              pageEl?.scrollIntoView({ behavior: "smooth", inline: "center" });
            }}
            vertical={!useHorizontalScroll}
          />
        ))}
      </div>

      <ChapterNavigation prevChapter={prevChapter} nextChapter={nextChapter} slug={slug} />
    </div>
  );
}
