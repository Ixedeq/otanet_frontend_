import React, { useState, useEffect } from "react";
import MangaCard from "./components/MangaCard";
import PaginationControls from "./components/PaginationControls";
import "../css/Recent_Manga.css";

const API_BASE = "http://localhost:8000";

export default function Recent_Manga() {
  const [manga, setManga] = useState([]);
  const [covers, setCovers] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const pages = 10;

  useEffect(() => {
    const fetchManga = async () => {
      try {
        const res = await fetch(`${API_BASE}/recent_manga?per_page=${(pages*itemsPerPage)}`);
        const data = await res.json();
        setManga(data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchCovers = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_cover`);
        const data = await res.json();
        setCovers(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchManga();
    fetchCovers();
  }, []);

  const totalPages = Math.ceil(manga.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentManga = manga.slice(startIndex, startIndex + itemsPerPage);

  const goNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));

  return (
    <div className="manga-list">
      {currentManga.length > 0
        ? currentManga.map(({ title, description }, idx) => (
            <MangaCard
              key={startIndex + idx}
              title={title}
              description={description}
              cover={''}
            />
          ))
        : "Loading..."}

      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          goNext={goNext}
          goPrev={goPrev}
        />
      )}
    </div>
  );
}
