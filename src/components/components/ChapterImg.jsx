import React, { useRef } from "react";

export default function ChapterImg({ src, alt, index, onOpenOverlay }) {
  const lastTap = useRef(0);

  const handleTouchEnd = (e) => {
    const now = Date.now();
    if (now - lastTap.current <= 300) {
      e.preventDefault(); // prevent iOS zoom
      onOpenOverlay(index);
      lastTap.current = 0;
    } else lastTap.current = now;
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    onOpenOverlay(index);
  };

  return (
    <div
      className="chapter-img-wrapper"
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
    >
      <img src={src} alt={alt} className="chapter-img" draggable={false} />
    </div>
  );
}
