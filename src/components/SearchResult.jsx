import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import PaginationControls from "./components/PaginationControls";
import MangaCard from "./components/MangaCard";
import API_BASE from "./Config";
import ErrorPage from "./ErrorPage";
import SEOMeta from "./SEOMeta";
import { generateSearchPageMeta } from "../utils/SEOHelpers";
import { useCache } from "../context/CacheContext";

export default function SearchResult() {
  const { search } = useParams();
  const { cachedFetch } = useCache();
  const [manga, setManga] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!search) return;

    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const data = await cachedFetch(
          `${API_BASE}/search_by_title?title=${encodeURIComponent(search)}`,
        );
        setManga(data);
      } catch (error) {
        console.error("Error fetching search results!", error);
        setManga([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSearchResults();
  }, [search, cachedFetch]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(manga.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentManga = manga.slice(startIndex, startIndex + itemsPerPage);

  const goNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));

  const seoMeta = generateSearchPageMeta(search);

  return (
    <div className="manga-list">
      <SEOMeta
        title={seoMeta.title}
        description={seoMeta.description}
        keywords={seoMeta.keywords}
        ogTitle={seoMeta.ogTitle}
        ogDescription={seoMeta.ogDescription}
        ogImage={seoMeta.ogImage}
        canonical={seoMeta.canonical}
      />
      {loading ? (
        <div className="search-loading">Searching...</div>
      ) : currentManga.length > 0 ? (
        currentManga.map(({ title, hash, cover_img }) => (
          <MangaCard
            key={hash}
            title={title}
            description=""  // Description no longer sent in search (loaded on detail page)
            hash={hash}
            cover={cover_img}
          />
        ))
      ) : (
        <ErrorPage
          type="no-manga"
          message={`No results found for "${search}"`}
        />
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
