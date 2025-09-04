import React from "react";
import "../css/Sidebar.css";

export default function Sidebar({ onClose }) {
  return (
    <div className="sidebar">
      <button className="close-button" onClick={onClose}>×</button>
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
