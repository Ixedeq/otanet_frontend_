import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../css/Home2.css";

// Dynamically import all covers from src/assets/covers
const importAllCovers = (r) =>
  r.keys().map((key) => ({
    src: r(key),
    filename: key.replace("./", "").replace(/\.(png|jpe?g|svg)$/i, "").toLowerCase(),
  }));

const images = importAllCovers(require.context("../assets/covers", false, /\.(png|jpe?g|svg)$/));

export default function Home2() {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [descriptions, setDescriptions] = useState({});
  const [killSwitch, setKillSwitch] = useState(true)

  const totalPages = Math.ceil(images.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentImages = images.slice(startIndex, startIndex + itemsPerPage);

  images.forEach(({ filename }) => {
    console.log(filename);
    const bs = async () => {
      var res = await fetch(`${process.env.PUBLIC_URL}/descriptions/${filename}.txt`)
        .then(res => {
          if (!res.ok) throw new Error("No description found");
          return res.text();
        })
        .then((text) => {
          setDescriptions((prev) => ({
            ...prev,
            [filename]: text && text.trim().length > 0 ? text : "No description available.",
          }));
          setKillSwitch(false)
        })
        .catch(() =>
          setDescriptions((prev) => ({ ...prev, [filename]: "No description available." }))
        );
    };
    if(killSwitch){
      bs()
    }
    
  });

  const goNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goPrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const prettifyTitle = (filename) =>
    filename.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="home2">
      {currentImages.map(({ src, filename }, idx) => (
        <Link
          to={`/chapter/${filename}`}
          className="manga-item2"
          key={startIndex + idx}
          style={{ textDecoration: "none" }}
        >
          <img src={src} alt={filename} className="home2-cover" />
          <div className="manga-text">
            <div className="manga-title2">{prettifyTitle(filename)}</div>
            <div className="manga-description">
              {descriptions[filename]}
            </div>
          </div>
        </Link>
      ))}

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
