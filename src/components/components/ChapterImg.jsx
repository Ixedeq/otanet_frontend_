import React, { useState, useRef } from "react";
import API_BASE from "../Config";

export default function ChapterImg({ src, alt, onOpenFullscreen, index, priority = false }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const imgRef = useRef(null);

  const handleDoubleClick = (e) => {
    e.preventDefault();
    onOpenFullscreen(index);
  };

  // If direct CDN fails, fall back to proxy
  const handleError = () => {
    if (!useFallback && src.includes('mangadex.network')) {
      // Try proxy fallback
      const parts = src.split('/data/');
      if (parts.length > 1) {
        const path = parts[1];
        const [hash, ...filenameParts] = path.split('/');
        const filename = filenameParts.join('/');
        const proxyUrl = `${API_BASE}/image/${hash}/${filename}`;
        setUseFallback(true);
        if (imgRef.current) {
          imgRef.current.src = proxyUrl;
        }
        return;
      }
    }
    setImageError(true);
    setImageLoaded(true);
  };

  // Determine loading strategy based on position
  const isEager = priority || index < 3;
  const imageSrc = useFallback ? undefined : src; // Will be set by handleError if fallback
  
  return (
    <div
      className={`chapter-img-wrapper ${imageLoaded ? 'loaded' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      {!imageLoaded && !imageError && <div className="chapter-img-skeleton" />}
      <img 
        ref={imgRef}
        src={imageSrc}
        alt={alt} 
        className={`chapter-img ${imageLoaded ? 'loaded' : ''}`}
        draggable={false}
        loading={isEager ? "eager" : "lazy"}
        decoding="async"
        fetchpriority={isEager ? "high" : "low"}
        referrerPolicy="no-referrer"
        onLoad={() => setImageLoaded(true)}
        onError={handleError}
      />
    </div>
  );
}
