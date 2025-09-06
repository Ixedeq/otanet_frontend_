import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import API_BASE from "../Config";

export default function ChapterNavigation() {
  const { slug, chapter } = useParams();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Normalize URL chapter to match API numbers
  const normalizeChapterStr = (str) => str.replace(/-/g, ".");

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_chapters?title=${slug}`);
        if (!res.ok) throw new Error("Chapters not found");
        const data = await res.json();

        // Sort and normalize
        const sortedChapters = data
          .map((ch) => ({
            ...ch,
            numberStr: ch.number.toString(),
          }))
          .sort((a, b) => parseFloat(a.number) - parseFloat(b.number));

        setChapters(sortedChapters);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, [slug]);

  if (loading || chapters.length === 0) return null;

  const normalizedChapter = normalizeChapterStr(chapter);
  const currentIndex = chapters.findIndex(
    (ch) => ch.numberStr === normalizedChapter
  );

  // If currentIndex not found, don't show navigation
  if (currentIndex === -1) return null;

  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  return (
    <div className="chapter-navigation">
      {prevChapter ? (
        <Link
          to={`/read/${slug}/chapter-${prevChapter.numberStr.replace(".", "-")}`}
          className="prev-chapter"
        >
          ← Previous Chapter
        </Link>
      ) : (
        <span className="prev-chapter disabled">← Previous Chapter</span>
      )}

      {nextChapter ? (
        <Link
          to={`/read/${slug}/chapter-${nextChapter.numberStr.replace(".", "-")}`}
          className="next-chapter"
        >
          Next Chapter →
        </Link>
      ) : (
        <span className="next-chapter disabled">Next Chapter →</span>
      )}
    </div>
  );
}
