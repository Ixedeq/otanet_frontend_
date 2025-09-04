import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "../css/ChapterPage.css";
import API_BASE from "./Config";

export default function ChapterPage() {
  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const { slug, chapter } = useParams();

  // Fetch pages
  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_pages?title=${slug}&chapter=${chapter}`);
        const data = await res.json();
        setPages(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPages();
  }, [slug, chapter]);

  // Fetch chapters
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_chapters?title=${slug}`);
        const data = await res.json();

        // sort chapters numerically
        const sorted = data.sort((a, b) => parseFloat(a.number) - parseFloat(b.number));
        setChapters(sorted);
      } catch (err) {
        console.error(err);
      }
    };
    fetchChapters();
  }, [slug]);

  // Determine previous and next chapter
  const chapterNumber = parseFloat(chapter);
  const currentIndex = chapters.findIndex(ch => parseFloat(ch.number) === chapterNumber);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  return (
    <div className="chapter-page">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="chapter-title">{slug}</h1>

      {pages.length === 0 && <p>No pages found for this manga.</p>}

      <div className="chapter-images">
        {pages.map(({ src, key }) => (
          <img key={key} src={src} className="chapter-img" alt={`Page ${key}`} />
        ))}
      </div>

      <div className="chapter-navigation">
        {prevChapter ? (
          <Link
            to={`/${slug}/chapter/${prevChapter.number.toString().replace(/\./g, "-")}`}
            className="prev-chapter"
          >
            ← Previous Chapter
          </Link>
        ) : (
          <span className="prev-chapter disabled">← Previous Chapter</span>
        )}

        {nextChapter ? (
          <Link
            to={`/${slug}/chapter/${nextChapter.number.toString().replace(/\./g, "-")}`}
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
