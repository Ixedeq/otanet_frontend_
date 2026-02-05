import React, { useState, memo } from "react";
import { Link } from "react-router-dom";

const MangaCard = memo(function MangaCard({ title, description, hash, cover, markAsRead }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const toSlug = (text) =>
    text.toLowerCase().trim().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, "-");

  const prettifyTitle = (title) =>
    title.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const handleClick = () => {
    if (markAsRead) markAsRead(title);
  };

  const fallbackCover = "/noimages.jpg";

  return (
    <Link to={`/${toSlug(title)}/${hash}`} className="manga-card" onClick={handleClick}>
      <div className={`manga-thumb-wrapper ${imageLoaded ? 'loaded' : ''}`}>
        {!imageLoaded && !imageError && <div className="manga-thumb-skeleton" />}
        <img 
          src={imageError ? fallbackCover : cover} 
          alt={title} 
          className={`manga-thumb ${imageLoaded ? 'loaded' : ''}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
        />
      </div>
      <div className="manga-info">
        <div className="manga-title-text">{prettifyTitle(title)}</div>
        <div className="manga-description-text">
          {description || "No description available."}
        </div>
      </div>
    </Link>
  );
});

export default MangaCard;
