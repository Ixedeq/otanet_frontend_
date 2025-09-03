import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../css/MangaPage.css";
import API_BASE from "./Config";

const DEFAULT_COVER =
  "https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg.512.jpg";

export default function MangaPage() {
  const { slug } = useParams();
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const response = await fetch(`${API_BASE}/${slug}`);
        if(!response.ok) throw new Error("Chpaters not found!")
        const data = await response.json();
        setChapters(data)
      }catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const fetchManga = async () => {
      try {
        const response = await fetch(`${API_BASE}/${slug}`);
        if (!response.ok) throw new Error("Manga not found");
        const data = await response.json();

        if (!data.cover) data.cover = DEFAULT_COVER;

        // normalize tags
        if (typeof data.tags === "string") {
          data.tags = data.tags
            .replace(/[\[\]']/g, "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
        } else if (!Array.isArray(data.tags)) {
          data.tags = [];
        }

        // generate chapters from single number
        const latestChapterNumber = Number(data.chapters) || 0;
        data.chapters = Array.from(
          { length: latestChapterNumber },
          (_, i) => ({ number: i + 1, title: `Chapter ${i + 1}` })
        );

        setManga(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
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

      <div className="chapter-wrapper">
        <h2 className="chapter-title">Chapters</h2>
        {chapters && chapters.length > 0 ? (
          <div className="chapter-grid">
            {chapters.map((ch) => (
              <a
                key={ch.number}
                href={`/read/${slug}/chapter-${ch.number}`}
                className="chapter-item"
              >
                {ch.title || `Chapter ${ch.number}`}
              </a>
            ))}
          </div>
        ) : (
          <p>No chapters available.</p>
        )}
      </div>
    </>
  );
}
