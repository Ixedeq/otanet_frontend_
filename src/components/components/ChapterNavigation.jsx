import React from "react";
import { Link, useParams } from "react-router-dom";

export default function ChapterNavigation({ chapters, markChapterAsRead }) {
  const { slug, chapter } = useParams();

  // Normalize chapter from URL
  const chapterNumberStr = chapter.replace("chapter-", "").replace(/-/g, ".");

  // Find current chapter index
  const currentIndex = chapters.findIndex(ch => ch.numberStr === chapterNumberStr);

  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 && currentIndex < chapters.length - 1
    ? chapters[currentIndex + 1]
    : null;

  const handleClick = (chNumber) => {
    if (markChapterAsRead) markChapterAsRead(parseFloat(chNumber));
  };

  return (
    <div className="chapter-navigation">
      {prevChapter ? (
        <Link
          to={`/read/${slug}/chapter-${prevChapter.numberStr.replace(/\./g, "-")}`}
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
          to={`/read/${slug}/chapter-${nextChapter.numberStr.replace(/\./g, "-")}`}
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
