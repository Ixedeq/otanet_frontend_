import React from "react";
import { Link } from "react-router-dom";

export default function MangaCard({ title, description, cover, onImageLoad }) {
  const toSlug = (text) =>
    text.toLowerCase().trim().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, "-");

  const prettifyTitle = (title) =>
    title.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const noCover =
    "https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg.512.jpg";

  return (
    <Link to={`/${toSlug(title)}`} className="manga-card">
      <img
        src={cover || noCover}
        alt={title}
        className="manga-thumb"
        onLoad={onImageLoad} // ✅ notify parent when loaded
      />
      <div className="manga-info">
        <div className="manga-title-text">{prettifyTitle(title)}</div>
        <div className="manga-description-text">
          {description || "No description available."}
        </div>
      </div>
    </Link>
  );
}
