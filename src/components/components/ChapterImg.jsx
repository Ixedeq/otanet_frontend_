import React, { useState, useRef, useEffect } from "react";

export default function ChapterImg({ src, alt, index, totalPages, onChangePage, vertical }) {
  const lastTap = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragOffset = useRef(0);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayTransform, setOverlayTransform] = useState(0);

  const toggleOverlay = () => setOverlayOpen((prev) => !prev);

  const onTouchEndImage = (e) => {
    const now = Date.now();
    if (now - lastTap.current <= 300) {
      e.preventDefault();
      toggleOverlay();
      lastTap.current = 0;
    } else lastTap.current = now;
  };

  const onDoubleClick = (e) => {
    e.preventDefault();
    toggleOverlay();
  };

  // Lock scroll when overlay is open
  useEffect(() => {
    if (!overlayOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (ev) => ev.key === "Escape" && setOverlayOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [overlayOpen]);

  return (
    <>
      <div
        className="chapter-img-wrapper"
        onTouchEnd={onTouchEndImage}
        onDoubleClick={onDoubleClick}
      >
        <img src={src} alt={alt} className="chapter-img" draggable={false} />
      </div>

      {overlayOpen && (
        <div
          className="fullscreen-overlay"
          style={{
            transform: vertical ? `translateY(${overlayTransform}px)` : `translateX(${overlayTransform}px)`,
            transition: overlayTransform === 0 ? "transform 0.25s ease-out" : "none",
          }}
          onTouchStart={(e) => {
            startX.current = e.touches[0].clientX;
            startY.current = e.touches[0].clientY;
            dragOffset.current = 0;
          }}
          onTouchMove={(e) => {
            const deltaX = e.touches[0].clientX - startX.current;
            const deltaY = e.touches[0].clientY - startY.current;
            dragOffset.current = vertical ? deltaY : deltaX;
            setOverlayTransform(dragOffset.current);
          }}
          onTouchEnd={() => {
            if (vertical) {
              if (dragOffset.current > 100) setOverlayOpen(false);
            } else {
              if (dragOffset.current < -50) onChangePage(Math.min(index + 1, totalPages - 1));
              else if (dragOffset.current > 50) onChangePage(Math.max(index - 1, 0));
            }
            setOverlayTransform(0);
          }}
        >
          <div className="fullscreen-wrapper">
            <img src={src} alt={alt} className="fullscreen-img" draggable={false} />
          </div>
        </div>
      )}
    </>
  );
}
