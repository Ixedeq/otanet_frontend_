import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "../css/ChapterPage.css";
import API_BASE from "./Config"

export default function ChapterPage() {
  const [pages, setPages] = useState([])
  const { slug, chapter } = useParams();
  console.log("Params: ", slug, chapter)
;
  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_pages?title=${slug}&chapter=${chapter}`);
        const data = await res.json();
        console.log(data)
        setPages(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchPages()
  },[pages]);

  console.log(pages)

  return (
    <div className="chapter-page">
      <div>Hello World </div>
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="chapter-title">{slug}</h1>

      {pages.length === 0 && <p>No pages found for this manga.</p>}

      <div className="chapter-images">
        {pages.map(({src}) => (
          <img src={src} className="chapter-img" />
        ))}
      </div>
    </div>
  );
}

