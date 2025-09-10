// BookmarkButton.jsx
import React from "react";

export default function BookmarkButton({ chapter, bookmarks, toggleBookmark }) {
  const isBookmarked = bookmarks.includes(chapter);
  return (
    <button
      className={`bookmark-btn ${isBookmarked ? "bookmarked" : ""}`}
      onClick={(e) => {
        e.preventDefault(); // prevents link navigation
        toggleBookmark(chapter);
      }}
    >
      {isBookmarked ? "★" : "☆"}
    </button>
  );
}
