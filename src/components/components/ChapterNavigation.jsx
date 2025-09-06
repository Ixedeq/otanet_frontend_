import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import API_BASE from "../Config";

export default function ChapterNavigation() {
  const { slug, chapter } = useParams();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Convert URL chapter string "1-5" → number 1.5
  const parseChapterNumber = (str) => parseFloat(str.replace(/-/g, "."));

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_chapters?title=${slug}`);
        if (!res.ok) throw new Error("Chapters not found");
        const data = await res.json();

        // Normalize chapters to numbers and sort ascending
        const sortedChapters = data
          .map((ch) => ({
            ...ch,
            numberFloat: parseFloat(ch.number), // convert string/number to float
          }))
          .sort((a, b) => a.numberFloat - b.numberFloat);

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

  const currentChapterNum = parseChapterNumber(chapter);

  // Find index by comparing floats
  const currentIndex = chapters.findIndex(
    (ch) => ch.numberFloat === currentChapterNum
  );

  if (currentIndex === -1) return null; // Chapter not found

  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const chapterUrl = (num) => `/read/${slug}/chapter-${num.toString().replace(".", "-")}`;

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
