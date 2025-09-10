import React from "react";

export default function Sidebar({ isOpen, onClose }) {
  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <button className="close-button" onClick={onClose}>
        ×
      </button>
      <nav>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/recent/1">Recently updated Manga</a></li>
          <li><a href="/bookmarks">Bookmarked Manga</a></li>
        </ul>
      </nav>
    </div>
  );
}