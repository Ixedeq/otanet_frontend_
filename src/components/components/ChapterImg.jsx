import React, { useState, memo } from "react";

const ChapterImg = memo(function ChapterImg({ src, alt, onOpenFullscreen, index }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDoubleClick = (e) => {
    e.preventDefault();
    onOpenFullscreen(index);
  };

  return (
    <div
      className={`chapter-img-wrapper ${imageLoaded ? 'loaded' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      {!imageLoaded && !imageError && <div className="chapter-img-skeleton" />}
      <img 
        src={src} 
        alt={alt} 
        className={`chapter-img ${imageLoaded ? 'loaded' : ''}`}
        draggable={false}
        loading="lazy"
        decoding="async"
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageError(true);
          setImageLoaded(true);
        }}
      />
    </div>
  );
});

export default ChapterImg;
