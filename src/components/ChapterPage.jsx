import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "../css/ChapterPage.css";
import API_BASE from "./Config";

export default function ChapterPage() {
  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const { slug, chapter } = useParams();

  // Convert chapter param for API and numeric comparison
  const chapterKey = chapter.replace("-", "_");
  const chapterNumberFloat = parseFloat(chapter.replace("-", "."));

  // Fetch pages for current chapter
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
        console.error(err);
        setPages([]);
      } finally {
        setLoadingPages(false);
      }
    };
    fetchPages();
  }, [slug, chapterKey]);

  // Fetch all chapters
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_chapters?title=${slug}`);
        const data = await res.json();

        // Sort chapters numerically
        const sorted = data
          .map((ch) => ({ ...ch, number: parseFloat(ch.number) }))
          .sort((a, b) => a.number - b.number);

        setChapters(sorted);
      } catch (err) {
        console.error(err);
      }
    };
    fetchChapters();
  }, [slug]);

  // Determine previous and next chapters
  const currentIndex = chapters.findIndex(
    (ch) => ch.number === chapterNumberFloat
  );
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  return (
    <div className="chapter-page">
      <Link to="/" className="back-link">
        ← Back to Home
      </Link>
      <h1 className="chapter-title">{slug}</h1>

      {loadingPages && <p>Loading pages...</p>}

      <div className="chapter-images">
        {pages.map(({ src, key }) => (
          <img
            key={key}
            src={src}
            className="chapter-img"
            alt={`Page ${key}`}
          />
        ))}
      </div>

      <div className="chapter-navigation">
        {prevChapter ? (
          <Link
            to={`/read/${slug}/chapter-${prevChapter.number.toString().replace(".", "-")}`}
            className="prev-chapter"
          >
            ← Previous Chapter
          </Link>
        ) : (
          <span className="prev-chapter disabled">← Previous Chapter</span>
        )}

        {nextChapter ? (
          <Link
            to={`/read/${slug}/chapter-${nextChapter.number.toString().replace(".", "-")}`}
            className="next-chapter"
          >
            Next Chapter →
          </Link>
        ) : (
          <span className="next-chapter disabled">Next Chapter →</span>
        )}
      </div>
    </div>
  );
}
