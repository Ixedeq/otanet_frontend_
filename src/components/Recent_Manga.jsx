import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MangaCard from "./components/MangaCard";
import MangaSkeleton from "./components/MangaSkeleton";
import PaginationControls from "./components/PaginationControls";
import "../css/Recent_Manga.css";
import API_BASE from "./Config.js";

export default function Recent_Manga() {
  const { page } = useParams();
  const navigate = useNavigate();

  const [manga, setManga] = useState([]);
  const [covers, setCovers] = useState({});
  const [mangaCount, setMangaCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 10;
  const currentPage = Number(page) || 1;

  // --- New: read manga tracking ---
  const [readManga, setReadManga] = useState(() => {
    const saved = localStorage.getItem("readManga");
    return saved ? JSON.parse(saved) : [];
  });

  const markAsRead = (title) => {
    if (!readManga.includes(title)) {
      const updated = [...readManga, title];
      setReadManga(updated);
      localStorage.setItem("readManga", JSON.stringify(updated));
    }
  };
  // ---------------------------------

  useEffect(() => {
    const fetchManga = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/recent_manga?page=${currentPage}`);
        const data = await res.json();
        setManga(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
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
        setMangaCount(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchManga();
    fetchCovers();
    fetchMangaCount();
    window.scrollTo(0, 0);
  }, [currentPage]);

  const totalPages = Math.ceil(mangaCount / itemsPerPage);
  const startIndex = 0;
  const currentManga = manga.slice(startIndex, startIndex + itemsPerPage);

  const goNext = () =>
    navigate(`/recent/${Math.min(currentPage + 1, totalPages)}`);
  const goPrev = () => navigate(`/recent/${Math.max(currentPage - 1, 1)}`);

  return (
    <div className="manga-list">
      {loading
        ? Array.from({ length: itemsPerPage }).map((_, idx) => (
            <MangaSkeleton key={idx} />
          ))
        : currentManga.length > 0
        ? currentManga.map(({ title, description, hash, cover_img }, idx) => (
            <div key={startIndex + idx} onClick={() => markAsRead(title)}>
              <MangaCard
                title={title}
                description={description}
		            hash={hash}
                cover={cover_img}
                read={readManga.includes(title)}
              />
            </div>
          ))
        : "No manga found."}

      {!loading && totalPages > 1 && (
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
