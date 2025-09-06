import React from "react";

export default function ChapterImg({ src, alt, onOpenFullscreen, index }) {

  const handleDoubleClick = (e) => {
    e.preventDefault();
    onOpenFullscreen(index);
  };

  return (
    <div
      className="chapter-img-wrapper"
      onDoubleClick={handleDoubleClick}
    >
      <img src={src} alt={alt} className="chapter-img" draggable={false} />
    </div>
  );
}
