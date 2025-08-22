import React, { useEffect, useRef } from "react";
import "../css/Home.css";

const importAll = (r) => r.keys().map(r);
const images = importAll(require.context("../assets/covers", false, /\.(png|jpe?g)$/));

export default function Home() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    let scrollPos = 0;

    const isMobile = window.innerWidth <= 768; // tweak breakpoint as needed
    const speed = isMobile ? 0.5 : 0.3; // Faster on mobile, slower on desktop

    const scrollStep = () => {
      if (!container) return;

      scrollPos += speed;
      if (scrollPos >= container.scrollWidth - container.clientWidth) {
        scrollPos = 0; // loop back to start
      }

      container.scrollLeft = scrollPos;
      requestAnimationFrame(scrollStep);
    };

    const anim = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(anim);
  }, []);

  return (
    <main className="home" ref={containerRef}>
      {images.map((src, idx) => (
        <div key={idx} className="manga-item">
          <img src={src} alt={`cover-${idx}`} className="home-cover" />
          <div className="manga-title">Manga {idx + 1}</div>
        </div>
      ))}
    </main>
  );
}




