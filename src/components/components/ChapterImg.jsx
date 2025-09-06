import React, { useState, useRef, useEffect } from "react";

export default function ChapterImg({ src, alt, vertical }) {
  const lastTap = useRef(0);
  const startY = useRef(0);
  const dragOffset = useRef(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [transformY, setTransformY] = useState(0);

  // Toggle fullscreen on double-tap / double-click
  const handleTap = (e) => {
    const now = Date.now();
    if (now - lastTap.current <= 300) {
      e.preventDefault();
      setFullscreen(true);
      lastTap.current = 0;
    } else lastTap.current = now;
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    setFullscreen(true);
  };

  // Slide-down to close in vertical mode
  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    dragOffset.current = 0;
  };

  const handleTouchMove = (e) => {
    const deltaY = e.touches[0].clientY - startY.current;
    dragOffset.current = deltaY;
    setTransformY(dragOffset.current);
  };

  const handleTouchEnd = () => {
    if (transformY > 100) setFullscreen(false); // slide down to close
    setTransformY(0);
  };

  // Escape key closes overlay
  useEffect(() => {
    if (!fullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [fullscreen]);

  return (
    <>
      <div
        className="chapter-img-wrapper"
        onTouchEnd={handleTap}
        onDoubleClick={handleDoubleClick}
      >
        <img src={src} alt={alt} className="chapter-img" draggable={false} />
      </div>

      {fullscreen && (
        <div
          className="fullscreen-overlay"
          onClick={() => setFullscreen(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: vertical ? `translateY(${transformY}px)` : "none",
            transition: transformY === 0 ? "transform 0.25s ease-out" : "none",
          }}
        >
          <img
            src={src}
            alt={alt}
            className="fullscreen-img"
            draggable={false}
            onClick={(e) => e.stopPropagation()} // prevent closing on image tap
          />
        </div>
      )}
    </>
  );
}
