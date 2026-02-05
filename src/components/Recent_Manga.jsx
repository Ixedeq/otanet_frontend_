import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MangaCard from "./components/MangaCard";
import MangaSkeleton from "./components/MangaSkeleton";
import PaginationControls from "./components/PaginationControls";
import ErrorPage from "./ErrorPage";
import "../css/Recent_Manga.css";
import API_BASE from "./Config.js";

export default function Recent_Manga() {
  const { page } = useParams();
  const navigate = useNavigate();

  const [manga, setManga] = useState([]);
  const [mangaCount, setMangaCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
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

  const fetchData = async () => {
    setLoading(true);
    setConnectionError(false);
    try {
      // Parallel load: fetch both manga data and count at the same time
      const [mangaRes, countRes] = await Promise.all([
        fetch(`${API_BASE}/recent_manga?page=${currentPage}`),
        fetch(`${API_BASE}/manga_count`)
      ]);
      
      if (!mangaRes.ok && !countRes.ok) throw new Error("Failed to fetch");
      
      if (mangaRes.ok) {
        const mangaData = await mangaRes.json();
        setManga(mangaData);
      }
      
      if (countRes.ok) {
        const countData = await countRes.json();
        setMangaCount(countData);
      }
    } catch (err) {
      console.error(err);
      setConnectionError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.scrollTo(0, 0);
  }, [currentPage]);

  const totalPages = Math.ceil(mangaCount / itemsPerPage);
  const startIndex = 0;
  const currentManga = manga.slice(startIndex, startIndex + itemsPerPage);

  const goNext = () =>
    navigate(`/recent/${Math.min(currentPage + 1, totalPages)}`);
  const goPrev = () => navigate(`/recent/${Math.max(currentPage - 1, 1)}`);

  if (connectionError) {
    return <ErrorPage type="no-connection" message="Unable to connect to the database. The server may be down." onRetry={fetchData} />;
  }

  return (
    <div className="manga-list">
      {loading
        ? Array.from({ length: itemsPerPage }).map((_, idx) => (
            <MangaSkeleton key={idx} />
          ))
        : currentManga.length > 0
        ? currentManga.map(({ title, description, hash, cover_img }, idx) => (
            <MangaCard
              key={hash}
              title={title}
              description={description}
              hash={hash}
              cover={cover_img}
              read={readManga.includes(title)}
              markAsRead={markAsRead}
            />
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
