import React, { useState, useEffect } from "react";
import MangaCard from "./components/MangaCard";
import PaginationControls from "./components/PaginationControls";
import "../css/Recent_Manga.css";
import API_BASE from "./Config";


export default function Recent_Manga() {
  const [manga, setManga] = useState([]);
  const [covers, setCovers] = useState({});
  const [mangaCount, setMangaCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const pages = 10;

  useEffect(() => {
    const fetchManga = async () => {
      try {
        const res = await fetch(`${API_BASE}/recent_manga?page=${(currentPage)}`);
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
    
    const fetchMangaCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/manga_count`);
        const data = await res.json();
        console.log(data)
        setMangaCount(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchManga();
    fetchCovers();
    fetchMangaCount();
    window.scrollTo(0, 0)
  }, [currentPage]);

  const totalPages = Math.ceil(mangaCount / itemsPerPage);
  const startIndex = 0
  const currentManga = manga.slice(startIndex, startIndex + itemsPerPage);

  const goNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  console.log(manga)
  console.log(currentManga)
  return (
    <div className="manga-list">
      {currentManga.length > 0
        ? currentManga.map(({ title, description, cover_img }, idx) => (
            <MangaCard
              key={startIndex + idx}
              title={title}
              description={description}
              cover={cover_img}
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
