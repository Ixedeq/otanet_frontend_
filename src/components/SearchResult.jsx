import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import PaginationControls from "./components/PaginationControls";
import MangaCard from "./components/MangaCard";

export default function SearchResult() {
   const location = useLocation();
   const [manga, setManga] = useState([]);
   const [currentPage, setCurrentPage] = useState(1);
   const { searchValue } = location.state;

   useEffect(() => {
   // Fetch cover
      const fetchSearchResults = async () => {
      try {
         const response = await fetch(`http://localhost:8000/search?title=${searchValue}`);
         if (!response.ok) throw new Error("Network response was not ok!");
         const data = await response.json();
         setManga(data)
      } catch (error) {
         console.error("Error fetching cover!", error);
         }
      };
      fetchSearchResults()
   }, []);

  const itemsPerPage = 10;
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
 )
}