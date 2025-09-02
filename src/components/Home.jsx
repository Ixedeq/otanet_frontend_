import React, { useState, useEffect, useRef } from "react";
import "../css/Home.css";

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "http://76.123.162.109:8000";

export default function Recent_Manga() {
  const [manga, setManga] = useState([]);
  const [cover, setCover] = useState("");
  const isPausedRef = useRef(false);  // use ref for latest paused state
  const scrollRef = useRef(null);
  const perPage = 8;
  const noCover =
    "https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg.512.jpg";

  // Fetch manga
  const fetchManga = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/recent_manga?per_page=${perPage}`
      );
      if (!response.ok) throw new Error("Network response was not ok!");
      const data = await response.json();
      setManga(data);
    } catch (error) {
      console.error("Error fetching manga!", error);
    }
  };

  // Fetch cover
  const fetchCover = async () => {
    try {
      const response = await fetch("http://localhost:8000/get_cover");
      if (!response.ok) throw new Error("Network response was not ok!");
      const data = await response.json();
      setCover(data);
    } catch (error) {
      console.error("Error fetching cover!", error);
    }
  };

  // Fetch data once on mount
  useEffect(() => {
    fetchManga();
    fetchCover();
  }, []);

  // Infinite scroll with pause-on-hover
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const scrollSpeed = 1; // pixels per frame

    const step = () => {
      if (!isPausedRef.current) {
        scrollContainer.scrollLeft += scrollSpeed;

        // Reset seamlessly at halfway (duplicated list)
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
          scrollContainer.scrollLeft = 0;
        }
      }
      requestAnimationFrame(step);
    };

    const animationId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationId);
  }, []); // run once on mount

  return (
    <main
      className="home"
      ref={scrollRef}
      onMouseEnter={() => (isPausedRef.current = true)}
      onMouseLeave={() => (isPausedRef.current = false)}
    >
      {manga.length > 0 ? (
        [...manga, ...manga].map(({ title, description }, index) => (
          <div key={index} className="manga-item">
            <img
              src={cover || noCover}
              alt={title}
              className="home-cover"
            />
            <div className="manga-title">{title}</div>
          </div>
        ))
      ) : (
        <div>Loading...</div>
      )}
    </main>
  );
}
