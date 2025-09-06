import React from "react";

export default function ChapterImg({ src, alt, onOpenFullscreen, index }) {
  const handleTap = (e) => {
    e.preventDefault();
    onOpenFullscreen(index); // tell parent which page
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    onOpenFullscreen(index);
  };

  return (
    <div
      className="chapter-img-wrapper"
      onTouchEnd={handleTap}
      onDoubleClick={handleDoubleClick}
    >
      <img src={src} alt={alt} className="chapter-img" draggable={false} />
    </div>
  );
}
