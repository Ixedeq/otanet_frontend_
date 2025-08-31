import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../css/Recent_Manga.css";

const API_BASE = "http://localhost:8000";

export default function Home2() {
  const [manga, setManga] = useState([]);
  const [covers, setCovers] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch recent manga from API
  const fetchManga = async () => {
    try {
      const response = await fetch(`${API_BASE}/recent_manga?per_page=50`);
      if (!response.ok) throw new Error("Failed to fetch manga");
      const data = await response.json();
      setManga(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch covers for manga
  const fetchCovers = async () => {
    try {
      const response = await fetch(`${API_BASE}/get_cover`);
      if (!response.ok) throw new Error("Failed to fetch covers");
      const data = await response.json();
      setCovers(data); // data should be { filename: cover_url }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchManga();
    fetchCovers();
  }, []);

  const totalPages = Math.ceil(manga.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentManga = manga.slice(startIndex, startIndex + itemsPerPage);

  const goNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goPrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const prettifyTitle = (title) =>
    title.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const noCover = "https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg.512.jpg";

  return (
    <div className="home2">
      {currentManga.length > 0 ? (
        currentManga.map(({ title, filename, description }, idx) => (
          <Link
            to={`/chapter/${filename}`}
            key={startIndex + idx}
            className="manga-item2"
          >
            <img
              src={covers[filename] || noCover}
              alt={title}
              className="home2-cover"
            />
            <div className="manga-text">
              <div className="manga-title2">{prettifyTitle(title)}</div>
              <div className="manga-description">
                {description || "No description available."}
              </div>
            </div>
          </Link>
        ))
      ) : (
        <div>Loading...</div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={goPrev} disabled={currentPage === 1}>
            Previous
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button onClick={goNext} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
