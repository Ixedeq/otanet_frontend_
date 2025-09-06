import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import API_BASE from "../Config";

export default function ChapterNavigation() {
  const { slug, chapter } = useParams();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_chapters?title=${slug}`);
        if (!res.ok) throw new Error("Chapters not found");
        const data = await res.json();

        const normalized = data
          .map((ch) => ({
            ...ch,
            numberFloat: Number(ch.number),
          }))
          .sort((a, b) => a.numberFloat - b.numberFloat);

        setChapters(normalized);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, [slug]);

  // Convert current URL chapter to float
  const currentChapterFloat = parseFloat(chapter.replace(/-/g, "."));

  // Find index in chapters array
  const currentIndex = chapters.findIndex(
    (ch) => Math.abs(ch.numberFloat - currentChapterFloat) < 0.001
  );

  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  const chapterUrl = (num) =>
    `/read/${slug}/chapter-${num.toString().replace(".", "-")}`;

  return (
    <div className="chapter-navigation">
      {prevChapter ? (
        <Link to={chapterUrl(prevChapter.numberFloat)} className="prev-chapter">
          ← Previous Chapter
        </Link>
      ) : (
        <span className="prev-chapter disabled">← Previous Chapter</span>
      )}

      {nextChapter ? (
        <Link to={chapterUrl(nextChapter.numberFloat)} className="next-chapter">
          Next Chapter →
        </Link>
      ) : (
        <span className="next-chapter disabled">Next Chapter →</span>
      )}
    </div>
  );
}
