import React from "react";
import { Link } from "react-router-dom";

export default function MangaCard({ title, description, hash, cover, markAsRead }) {
  const toSlug = (text) =>
    text.toLowerCase().trim().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, "-");

  const prettifyTitle = (title) =>
    title.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  console.log(cover)
  
  const handleClick = () => {
    if (markAsRead) markAsRead(title);
  };
  return (
    <Link to={`/${toSlug(title)}/${hash}`} className="manga-card" onClick={handleClick}>
      <img src={cover} alt={title} className="manga-thumb" />
      <div className="manga-info">
        <div className="manga-title-text">{prettifyTitle(title)}</div>
        <div className="manga-description-text">
          {description || "No description available."}
        </div>
      </div>
    </Link>
  );
}
