import React from "react";
import { Link } from "react-router-dom";

export default function ChapterNavigation({ slug, hash, chapters, currentChapterNumberStr, markChapterAsRead }) {
  // Find current chapter index
  const currentIndex = chapters.findIndex((ch) => ch.numberStr === currentChapterNumberStr);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  const handleClick = (chNumber) => {
    if (markChapterAsRead) markChapterAsRead(parseFloat(chNumber));
  };

  return (
    <div className="chapter-navigation">
      {prevChapter ? (
        <Link
          to={`/read/${slug}/${hash}/chapter-${prevChapter.numberStr.replace(/\./g, "-")}`}
          className="prev-chapter"
          onClick={() => handleClick(prevChapter.numberStr)}
        >
          ← Previous Chapter
        </Link>
      ) : (
        <span className="prev-chapter disabled">← Previous Chapter</span>
      )}

      {nextChapter ? (
        <Link
          to={`/read/${slug}/${hash}/chapter-${nextChapter.numberStr.replace(/\./g, "-")}`}
          className="next-chapter"
          onClick={() => handleClick(nextChapter.numberStr)}
        >
          Next Chapter →
        </Link>
      ) : (
        <span className="next-chapter disabled">Next Chapter →</span>
      )}
    </div>
  );
}
