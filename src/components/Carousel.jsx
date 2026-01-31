import React, { useState, useEffect, useRef } from "react";
import "../css/Carousel.css";
import API_BASE from "./Config";

export default function Carousel() {
  const [manga, setManga] = useState([]);
  const [cover, setCover] = useState("");
  const isPausedRef = useRef(false);
  const scrollRef = useRef(null);

  const perPage = 1;
  
  const noCover =
    "https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg.512.jpg";

  // Fetch manga and cover
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mangaRes, coverRes] = await Promise.all([
          fetch(`${API_BASE}/recent_manga?per_page=${perPage}`),
          fetch(`${API_BASE}/get_cover`),
        ]);

        if (!mangaRes.ok || !coverRes.ok) throw new Error("Network response was not ok!");

        const [mangaData, coverData] = await Promise.all([mangaRes.json(), coverRes.json()]);

        setManga(mangaData);
        setCover(coverData);
      } catch (err) {
        console.error("Error fetching data!", err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Carousel is now static — no auto-scrolling.
    // Keep isPausedRef set so future code knows carousel is paused.
    isPausedRef.current = true;
  }, []);

  return (
    <main
      className="home"
      ref={scrollRef}
    >
      {manga.length > 0 ? (
        <>
          {manga.map(({ title, description }, index) => (
            <div key={index} className="manga-item">
              <img src={cover || noCover} alt={title} className="home-cover" />
              <div className="manga-title">{title}</div>
            </div>
          ))}
          {/* Spacer at end for smooth wrapping */}
          <div style={{ display: "inline-block", width: "100%" }} />
        </>
      ) : (
        <div>Loading...</div>
      )}
    </main>
  );
}

