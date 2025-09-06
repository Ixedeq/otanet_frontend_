import React, { useState, useRef, useEffect } from "react";

export default function ChapterImg({ src, alt }) {
  const wrapperRef = useRef(null);
  const lastTap = useRef(0);
  const [overlayOpen, setOverlayOpen] = useState(false);

  // Check if native fullscreen is active
  const isInNativeFullscreen = () =>
    !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.webkitIsFullScreen
    );

  // Attempt native fullscreen (desktop)
  const requestNativeFullscreen = async (el) => {
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else return false;
      return true;
    } catch {
      return false;
    }
  };

  const exitNativeFullscreen = async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } catch {}
  };

  const toggleFullscreen = async () => {
    // Exit fullscreen if already in it
    if (isInNativeFullscreen()) {
      await exitNativeFullscreen();
      setOverlayOpen(false);
      return;
    }

    // Try native fullscreen first
    const ok = await requestNativeFullscreen(wrapperRef.current);
    if (!ok) setOverlayOpen(true); // fallback overlay (iOS)
  };

  // Double-tap / quick tap detection
  const onTouchEnd = (e) => {
    const now = Date.now();
    if (now - lastTap.current <= 300) {
      e.preventDefault(); // prevent iOS zoom
      toggleFullscreen();
      lastTap.current = 0;
    } else lastTap.current = now;
  };

  // Desktop: double click opens fullscreen
  const onDoubleClick = (e) => {
    e.preventDefault();
    toggleFullscreen();
  };

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (!overlayOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (ev) => ev.key === "Escape" && setOverlayOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [overlayOpen]);

  return (
    <>
      <div
        ref={wrapperRef}
        className="chapter-img-wrapper"
        onTouchEnd={onTouchEnd}
        onDoubleClick={onDoubleClick}
        role="button"
        aria-label={alt}
      >
        <img src={src} alt={alt} className="chapter-img" draggable={false} />
      </div>

      {overlayOpen && (
        <div
          className="fullscreen-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setOverlayOpen(false)}
        >
          <div className="fullscreen-wrapper">
            <img
              src={src}
              alt={alt}
              className="fullscreen-img"
              draggable={false}
            />
          </div>
        </div>
      )}
    </>
  );
}
