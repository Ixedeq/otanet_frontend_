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
  const [imagesLoaded, setImagesLoaded] = useState(0);

  const itemsPerPage = 10;
  const currentPage = Number(page) || 1;

  // Fetch manga data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mangaRes, coversRes, countRes] = await Promise.all([
          fetch(`${API_BASE}/recent_manga?page=${currentPage}`),
          fetch(`${API_BASE}/get_cover`),
          fetch(`${API_BASE}/manga_count`),
        ]);

        const [mangaData, coversData, countData] = await Promise.all([
          mangaRes.json(),
          coversRes.json(),
          countRes.json(),
        ]);

        setManga(mangaData);
        setCovers(coversData);
        setMangaCount(countData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false); // API finished
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [currentPage]);

  const totalPages = Math.ceil(mangaCount / itemsPerPage);
  const startIndex = 0;
  const currentManga = manga.slice(startIndex, startIndex + itemsPerPage);

  // Reset image counter when new manga is loaded
  useEffect(() => {
    setImagesLoaded(0);
  }, [currentManga]);

  const handleImageLoad = () => {
    setImagesLoaded((prev) => prev + 1);
  };

  // True when all images in currentManga have loaded
  const allImagesLoaded =
    !loading && currentManga.length > 0 && imagesLoaded >= currentManga.length;

  const goNext = () =>
    navigate(`/recent/${Math.min(currentPage + 1, totalPages)}`);
  const goPrev = () => navigate(`/recent/${Math.max(currentPage - 1, 1)}`);

  return (
    <div className="manga-list">
      {!allImagesLoaded
        ? Array.from({ length: itemsPerPage }).map((_, idx) => (
            <MangaSkeleton key={idx} />
          ))
        : currentManga.length > 0
        ? currentManga.map(({ title, description, cover_img }, idx) => (
            <MangaCard
              key={startIndex + idx}
              title={title}
              description={description}
              cover={cover_img}
              onImageLoad={handleImageLoad} // callback for image load
            />
          ))
        : "No manga found."}

      {allImagesLoaded && totalPages > 1 && (
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
