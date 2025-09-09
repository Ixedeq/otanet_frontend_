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
          <li><a href="/recent/1">Recent Manga</a></li>
          <li><a href="/search">Search</a></li>
        </ul>
      </nav>
    </div>
  );
}
