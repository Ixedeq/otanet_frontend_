import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import PaginationControls from "./components/PaginationControls";
import MangaCard from "./components/MangaCard";
import API_BASE from "./Config";
import ErrorPage from "./ErrorPage";
import SEOMeta from "./SEOMeta";
import { generateTagPageMeta } from "../utils/SEOHelpers";
import { FaTag, FaPlus, FaMinus } from "react-icons/fa";
import { getTagStyle } from "./utils/tagColors";
import { useCache } from "../context/CacheContext";
import "../css/TagSearch.css";

export default function TagSearchResult() {
  const [searchParams] = useSearchParams();
  const { cachedFetch } = useCache();
  const [manga, setManga] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Parse include/exclude tags from URL params
  const includeTags = searchParams.get("include")
    ? searchParams
        .get("include")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const excludeTags = searchParams.get("exclude")
    ? searchParams
        .get("exclude")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  useEffect(() => {
    if (includeTags.length === 0 && excludeTags.length === 0) {
      setLoading(false);
      return;
    }

    const fetchTagResults = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (includeTags.length > 0) {
          params.set("include_tags", includeTags.join(","));
        }
        if (excludeTags.length > 0) {
          params.set("exclude_tags", excludeTags.join(","));
        }

        const data = await cachedFetch(
          `${API_BASE}/search_by_tags?${params.toString()}`,
        );
        setManga(data);
      } catch (error) {
        console.error("Error fetching tag search results!", error);
        setManga([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTagResults();
    setCurrentPage(1);
  }, [searchParams, cachedFetch]);

  // Theme detection for tag colors
  const [isLightMode, setIsLightMode] = useState(false);
  useEffect(() => {
    const checkTheme = () => {
      setIsLightMode(
        document.documentElement.getAttribute("data-theme") === "light",
      );
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(manga.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentManga = manga.slice(startIndex, startIndex + itemsPerPage);

  const goNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));

  const seoMeta = generateTagPageMeta(includeTags);

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
      <div className="tag-search-header">
        <FaTag className="tag-search-icon" />
        <span>Filter by tags:</span>
        <div className="tag-search-tags">
          {includeTags.map((tag, idx) => (
            <span
              key={`inc-${idx}`}
              className="tag-search-chip include"
              style={getTagStyle(tag, isLightMode)}
            >
              <FaPlus size={10} /> {tag}
            </span>
          ))}
          {excludeTags.map((tag, idx) => (
            <span
              key={`exc-${idx}`}
              className="tag-search-chip exclude"
              style={getTagStyle(tag, isLightMode)}
            >
              <FaMinus size={10} /> {tag}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="search-loading">Searching by tags...</div>
      ) : currentManga.length > 0 ? (
        currentManga.map(({ title, description, hash, cover_img }) => (
          <MangaCard
            key={hash || title}
            title={title}
            description={description}
            hash={hash}
            cover={cover_img}
          />
        ))
      ) : (
        <ErrorPage
          type="no-manga"
          message={`No manga found with the selected tag filters`}
        />
      )}
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
