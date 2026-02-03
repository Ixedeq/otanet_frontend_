import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import PaginationControls from "./components/PaginationControls";
import MangaCard from "./components/MangaCard";
import API_BASE from "./Config";
import ErrorPage from "./ErrorPage";

export default function SearchResult() {
   const { search } = useParams();
   const [manga, setManga] = useState([]);
   const [currentPage, setCurrentPage] = useState(1);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      if (!search) return;
      
      const fetchSearchResults = async () => {
         setLoading(true);
         try {
            const response = await fetch(`${API_BASE}/search_by_title?title=${encodeURIComponent(search)}`);
            if (!response.ok) throw new Error("Network response was not ok!");
            const data = await response.json();
            setManga(data);
         } catch (error) {
            console.error("Error fetching search results!", error);
            setManga([]);
         } finally {
            setLoading(false);
         }
      };
      fetchSearchResults();
   }, [search]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(manga.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentManga = manga.slice(startIndex, startIndex + itemsPerPage);

  const goNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));

 return (
    <div className="manga-list">
      {loading ? (
        <div className="search-loading">Searching...</div>
      ) : currentManga.length > 0 ? (
        currentManga.map(({ title, description, hash, cover_img }) => (
          <MangaCard
            key={hash}
            title={title}
            description={description}
            hash={hash}
            cover={cover_img}
          />
        ))
      ) : (
        <ErrorPage type="no-manga" message={`No results found for "${search}"`} />
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