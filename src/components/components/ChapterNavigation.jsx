import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import API_BASE from "../Config";

export default function ChapterNavigation() {
  const { slug, chapter } = useParams();
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_chapters?title=${slug}`);
        if (!res.ok) throw new Error("Chapters not found");
        const data = await res.json();

        // Sort chapters numerically
        const sorted = data
          .sort((a, b) => Number(a.number) - Number(b.number))
          .map((ch) => ({
            ...ch,
            numberStr: ch.number.toString(),
          }));

        setChapters(sorted);
      } catch (err) {
        console.error(err);
      }
    };

    fetchChapters();
  }, [slug]);

  const currentIndex = chapters.findIndex((ch) => ch.numberStr === chapter);

  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  const chapterUrl = (numStr) => `/read/${slug}/chapter-${numStr}`;

  return (
    <div className="chapter-navigation">
      {prevChapter ? (
        <Link to={chapterUrl(prevChapter.numberStr)} className="prev-chapter">
          ← Previous Chapter
        </Link>
      ) : (
        <span className="prev-chapter disabled">← Previous Chapter</span>
      )}

      {nextChapter ? (
        <Link to={chapterUrl(nextChapter.numberStr)} className="next-chapter">
          Next Chapter →
        </Link>
      ) : (
        <span className="next-chapter disabled">Next Chapter →</span>
      )}
    </div>
  );
}
