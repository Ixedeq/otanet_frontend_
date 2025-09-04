import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "../css/ChapterPage.css";
import API_BASE from "./Config";

export default function ChapterPage() {
  const { slug, chapter } = useParams();
  const chapterNumber = Number(chapter);

  const [pages, setPages] = useState([]);
  const [totalChapters, setTotalChapters] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch pages and total chapters whenever slug or chapter changes
  useEffect(() => {
    const fetchPages = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/get_pages?title=${slug}&chapter=${chapterNumber}`
        );
        const data = await res.json();
        setPages(data || []);
      } catch (err) {
        console.error(err);
        setPages([]);
      } finally {
        setLoading(false);
        window.scrollTo(0, 0); // scroll to top when chapter changes
      }
    };

    const fetchTotalChapters = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_chapters?title=${slug}`);
        const data = await res.json();
        setTotalChapters(data.length || 0);
      } catch (err) {
        console.error(err);
        setTotalChapters(0);
      }
    };

    fetchPages();
    fetchTotalChapters();
  }, [slug, chapterNumber]);

  return (
    <div className="chapter-page">
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="chapter-title">{slug}</h1>

      {loading && <p>Loading pages...</p>}
      {!loading && pages.length === 0 && <p>No pages found for this manga.</p>}

      <div className="chapter-images">
        {pages.map((page, idx) => (
          <img
            key={idx}
            src={page.src}
            className="chapter-img"
            alt={`Page ${idx + 1}`}
          />
        ))}
      </div>

      <div className="chapter-navigation">
        {chapterNumber > 1 ? (
          <Link
            to={`/${slug}/chapter/${chapterNumber - 1}`}
            className="prev-chapter"
          >
            ← Previous Chapter
          </Link>
        ) : (
          <span className="prev-chapter disabled">← Previous Chapter</span>
        )}

        {chapterNumber < totalChapters ? (
          <Link
            to={`/${slug}/chapter/${chapterNumber + 1}`}
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
