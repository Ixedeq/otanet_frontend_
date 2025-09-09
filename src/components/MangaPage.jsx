import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../css/MangaPage.css";
import API_BASE from "./Config";
import BookmarkButton from "./components/BookmarkButton";

const DEFAULT_COVER = "https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg.512.jpg";

export default function MangaPage() {
  const { slug } = useParams();
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Track read chapters ---
  const [readChapters, setReadChapters] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(`${slug}-readChapters`);
    setReadChapters(saved ? JSON.parse(saved) : []);
  }, [slug]); // re-run whenever slug changes (including return from ChapterPage)

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const response = await fetch(`${API_BASE}/get_chapters?title=${slug}`);
        const data = await response.json();
        setChapters(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const fetchManga = async () => {
      try {
        const response = await fetch(`${API_BASE}/${slug}`);
        const data = await response.json();
        if (!data.cover) data.cover = DEFAULT_COVER;

        // normalize tags
        if (typeof data.tags === "string") {
          data.tags = data.tags.replace(/[\[\]']/g, "").split(",").map((tag) => tag.trim()).filter(Boolean);
        } else if (!Array.isArray(data.tags)) {
          data.tags = [];
        }

        // generate chapters if needed
        const latestChapterNumber = Number(data.chapters) || 0;
        data.chapters = Array.from({ length: latestChapterNumber }, (_, i) => ({ number: i + 1, title: `Chapter ${i + 1}` }));

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

  return (
    <>
      {loading ? (
        <div>Loading...</div>
      ) : !manga ? (
        <div>Manga not found</div>
      ) : (
        <div className="chapter-wrapper">
          {chapters.map((ch) => (
            <div
              key={ch.number}
              className={`chapter-item ${readChapters.includes(ch.number) ? "read" : ""}`}
            >
              <a href={`/${slug}/chapter-${ch.number.toString().replace(/\./g, "-")}`}>
                {ch.title || `Chapter ${ch.number}`}
              </a>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
