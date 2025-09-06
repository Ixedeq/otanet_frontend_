import React from "react";
import { Link } from "react-router-dom";

export default function ChapterNavigation({ prevChapter, nextChapter, slug }) {
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
