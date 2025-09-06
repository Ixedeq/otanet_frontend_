import React from "react";
import { Link } from "react-router-dom";

export default function ChapterNavigation({ prevChapter, nextChapter, slug }) {
  // Helper to ensure numberStr is always formatted consistently
  const formatNumberStr = (ch) => {
    if (!ch) return null;
    return ch.numberStr.includes(".") ? ch.numberStr : `${ch.numberStr}.0`;
  };

  const prevNumberStr = formatNumberStr(prevChapter);
  const nextNumberStr = formatNumberStr(nextChapter);

  return (
    <div className="chapter-navigation">
      {prevChapter ? (
        <Link
          to={`/read/${slug}/chapter-${prevNumberStr.replace(".", "-")}`}
          className="prev-chapter"
        >
          ← Previous Chapter
        </Link>
      ) : (
        <span className="prev-chapter disabled">← Previous Chapter</span>
      )}

      {nextChapter ? (
        <Link
          to={`/read/${slug}/chapter-${nextNumberStr.replace(".", "-")}`}
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
