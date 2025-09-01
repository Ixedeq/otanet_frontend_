import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = "http://localhost:8000";

export default function MangaPage() {
  const { slug } = useParams(); // get slug from URL
  const [manga, setManga] = useState(null);

  useEffect(() => {
    const fetchManga = async () => {
      try {
        const response = await fetch(`${API_BASE}/manga/${slug}`);
        if (!response.ok) throw new Error("Failed to fetch manga");
        const data = await response.json();
        setManga(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchManga();
  }, [slug]);

  if (!manga) return <div>Loading...</div>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>{manga.title}</h1>
      <img src={manga.cover} alt={manga.title} style={{ width: "200px", borderRadius: "8px" }} />
      <p style={{ marginTop: "1rem", fontSize: "1.2rem" }}>{manga.description}</p>
    </div>
  );
}
