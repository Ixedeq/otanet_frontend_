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
  const currentPage = parseInt(page, 10) || 1;

  const [manga, setManga] = useState([]);
  const [mangaCount, setMangaCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 10;

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [mangaRes, countRes] = await Promise.all([
          fetch(`${API_BASE}/recent_manga?page=${currentPage}`),
          fetch(`${API_BASE}/manga_count`)
        ]);

        const [mangaData, countData] = await Promise.all([
          mangaRes.json(),
          countRes.json()
        ]);

        if (isMounted) {
          setManga(mangaData);
          setMangaCount(countData);
          setLoading(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [currentPage]);

  const totalPages = Math.ceil(mangaCount / itemsPerPage);

  const goNext = () =>
    navigate(`/recent/${Math.min(currentPage + 1, totalPages)}`);
  const goPrev = () =>
    navigate(`/recent/${Math.max(currentPage - 1, 1)}`);

  return (
    <div className="manga-list">
      {loading
        ? Array.from({ length: itemsPerPage }).map((_, idx) => (
            <MangaSkeleton key={idx} />
          ))
        : manga.map(({ title, description, cover }, idx) => (
            <MangaCard
              key={`${title}-${idx}`}
              title={title}
              description={description}
              cover={cover}
            />
          ))}

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




