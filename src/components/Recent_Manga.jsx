import React, { useState, useEffect } from "react";
import MangaCard from "./components/MangaCard";
import PaginationControls from "./components/PaginationControls";
import "../css/Recent_Manga.css";
import API_BASE from "./Config";

export default function Recent_Manga() {
  const [manga, setManga] = useState([]);
  const [covers, setCovers] = useState({});
  const [mangaCount, setMangaCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // Fetch manga, covers, and count
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mangaRes, coversRes, countRes] = await Promise.all([
          fetch(`${API_BASE}/recent_manga?page=${currentPage}`),
          fetch(`${API_BASE}/get_cover`),
          fetch(`${API_BASE}/manga_count`)
        ]);

        const [mangaData, coversData, countData] = await Promise.all([
          mangaRes.json(),
          coversRes.json(),
          countRes.json()
        ]);

        setManga(mangaData);
        setCovers(coversData);
        setMangaCount(countData);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [currentPage]);

  // Pagination calculations
  const totalPages = Math.ceil(mangaCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentManga = manga.slice(startIndex, startIndex + itemsPerPage);

  const goNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));

  return (
    <div className="manga-list">
      {currentManga.length > 0 ? (
        currentManga.map(({ title, description, cover }, idx) => (
          <MangaCard
            key={startIndex + idx}
            title={title}
            description={description}
            cover={cover}
          />
        ))
      ) : (
        <div className="loading">Loading...</div>
      )}

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

