import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../css/MangaPage.css";

const API_BASE = "http://localhost:8000";
const DEFAULT_COVER =
  "https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg.512.jpg";

export default function MangaPage() {
  const { slug } = useParams();
  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManga = async () => {
      try {
        const response = await fetch(`${API_BASE}/${slug}`);
        if (!response.ok) throw new Error("Manga not found");
        const data = await response.json();

        if (!data.cover) data.cover = DEFAULT_COVER;

        // normalize tags: if string, split by comma; if array, ensure strings
        if (typeof data.tags === "string") {
        try {
            // Try parsing as JSON first
            const parsed = JSON.parse(data.tags.replace(/'/g, '"')); // replace single quotes with double quotes
            if (Array.isArray(parsed)) {
            data.tags = parsed.map((tag) => String(tag).trim());
            } else {
            // fallback: split by comma
            data.tags = data.tags
                .replace(/[\[\]']/g, "")
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean);
            }
        } 
        catch {
        // fallback if JSON.parse fails
            data.tags = data.tags
            .replace(/[\[\]']/g, "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
        }
        } 
        else if (Array.isArray(data.tags)) {
            data.tags = data.tags.map((tag) => String(tag).trim());
        } 
        else {
            data.tags = [];
        }

        setManga(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchManga();
  }, [slug]);

  if (loading) return <div>Loading...</div>;
  if (!manga) return <div>Manga not found</div>;

  return (
    <>
      <div className="detail-wrapper">
        <img src={manga.cover} alt={manga.title} className="detail-cover" />
        <div className="detail-info">
          <h1 className="detail-title">{manga.title}</h1>
          <p className="detail-description">
            {manga.description || "No description available."}
          </p>
        </div>
      </div>

      <div className="tags-wrapper">
        {manga.tags.length > 0 ? (
          manga.tags.map((tag, idx) => (
            <span key={idx} className="tag-item">
              {tag}
            </span>
          ))
        ) : (
          <span className="tag-item">No tags available</span>
        )}
      </div>
    </>
  );
}



