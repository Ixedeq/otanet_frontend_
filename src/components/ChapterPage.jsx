import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ChapterImg from "./components/ChapterImg";
import ChapterNavigation from "./components/ChapterNavigation";
import API_BASE from "./Config";
import parseChapterNumber from "./components/ParseChapterNumber";
import SEOMeta from "./SEOMeta";
import { generateChapterPageMeta } from "../utils/SEOHelpers";
import "../css/ChapterPage.css";

export default function ChapterPage() {
  const { slug, hash, chapter } = useParams();
  const navigate = useNavigate();
  const chapterKey = chapter.replace("-", "_");
  const chapterNumberStr = parseChapterNumber(chapter);
  const chapterNumber = parseFloat(chapterNumberStr); // numeric

  const [mangaTitle, setMangaTitle] = useState("");
  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [horizontalScroll, setHorizontalScroll] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(null);
  const [showChapterMenu, setShowChapterMenu] = useState(false);

  const pageContainerRef = useRef(null);

  // Mark chapter as read
  const markChapterAsRead = (number) => {
    const saved =
      JSON.parse(localStorage.getItem(`${slug}-readChapters`)) || [];
    if (!saved.includes(number)) {
      const updated = [...saved, number];
      localStorage.setItem(`${slug}-readChapters`, JSON.stringify(updated));

      // Dispatch custom event so MangaPage updates immediately
      window.dispatchEvent(
        new CustomEvent("readChaptersUpdated", {
          detail: { slug, updatedChapters: updated },
        }),
      );
    }
  };

  // Scroll to top helper
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (pageContainerRef.current) {
      pageContainerRef.current.scrollTop = 0;
    }
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, []);

  // Navigate to chapter with proper scroll reset
  const goToChapter = useCallback(
    (chapterData, exitFullscreen = false) => {
      if (!chapterData) return;

      markChapterAsRead(parseFloat(chapterData.numberStr));

      if (exitFullscreen && fullscreen) {
        setFullscreen(false);
        setFullscreenIndex(null);
      }

      // Scroll to top before navigation
      scrollToTop();

      const chapterPath = `/read/${slug}/${hash}/chapter-${chapterData.numberStr.replace(/\./g, "-")}`;
      navigate(chapterPath);
    },
    [slug, hash, fullscreen, navigate, scrollToTop],
  );

  // --- Scroll to top when chapter changes ---
  useEffect(() => {
    scrollToTop();
  }, [chapterKey, scrollToTop]);

  // --- Fetch pages ---
  useEffect(() => {
    const fetchPages = async () => {
      setLoadingPages(true);
      try {
        const res = await fetch(
          `${API_BASE}/get_pages?title=${slug}&hash=${hash}&chapter=${chapterKey}`,
        );
        const data = await res.json();
        setPages(data);
      } catch (err) {
        console.error("Failed to fetch pages:", err);
        setPages([]);
      } finally {
        setLoadingPages(false);
      }
    };
    fetchPages();
  }, [slug, chapterKey]);

  // --- Fetch chapters + manga info ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chaptersRes, mangaRes] = await Promise.all([
          fetch(`${API_BASE}/get_chapters?hash=${hash}`),
          fetch(`${API_BASE}/manga/${hash}`),
        ]);

        if (chaptersRes.ok) {
          const chaptersData = await chaptersRes.json();
          setChapters(chaptersData);
        }

        if (mangaRes.ok) {
          const mangaData = await mangaRes.json();
          setMangaTitle(mangaData.title || "");
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchData();
  }, [hash]);

  // --- Current chapter index & navigation ---
  const currentIndex = useMemo(
    () => chapters.findIndex((ch) => ch.numberStr === chapterNumberStr),
    [chapters, chapterNumberStr],
  );
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  // --- Preload adjacent chapter images ---
  useEffect(() => {
    if (!hash || chapters.length === 0) return;

    const preloadedUrls = new Set();

    const preloadChapterImages = async (chapter, priority = "low") => {
      if (!chapter) return;

      try {
        const chapterKey = `chapter_${chapter.numberStr.replace(/\./g, "_")}`;
        const res = await fetch(
          `${API_BASE}/get_pages?title=${slug}&hash=${hash}&chapter=${chapterKey}`,
        );

        if (!res.ok) return;

        const chapterPages = await res.json();

        // Preload images using link prefetch or Image objects
        chapterPages.forEach((pageUrl, index) => {
          // Preload first 8 images of next chapter, first 3 of previous
          const limit = priority === "high" ? 8 : 3;
          if (index < limit && !preloadedUrls.has(pageUrl)) {
            preloadedUrls.add(pageUrl);

            // Use link prefetch for low priority, Image for high priority
            if (priority === "high") {
              const img = new Image();
              img.src = pageUrl;
            } else {
              const link = document.createElement("link");
              link.rel = "prefetch";
              link.as = "image";
              link.href = pageUrl;
              document.head.appendChild(link);
            }
          }
        });
      } catch (err) {
        // Silently fail - preloading is optional
      }
    };

    // Delay preloading to prioritize current chapter loading
    const timeoutId = setTimeout(() => {
      // Preload next chapter with higher priority
      preloadChapterImages(nextChapter, "high");

      // Preload previous chapter with lower priority (for back navigation)
      setTimeout(() => {
        preloadChapterImages(prevChapter, "low");
      }, 2000);
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [nextChapter, prevChapter, hash, slug, chapters.length]);

  // Store scroll position before entering fullscreen
  const scrollPositionRef = useRef(0);

  // --- Fullscreen toggle ---
  const toggleFullscreen = (index = null) => {
    if (!fullscreen) {
      // Entering fullscreen - save current scroll position
      scrollPositionRef.current = window.scrollY;
      if (index !== null) setFullscreenIndex(index);
    } else {
      // Exiting fullscreen
      setFullscreenIndex(null);
    }
    setFullscreen((prev) => !prev);
  };

  // --- Prevent body scroll in fullscreen ---
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // Restore scroll position after exiting fullscreen (only if not navigating)
      if (scrollPositionRef.current > 0) {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPositionRef.current);
          scrollPositionRef.current = 0;
        });
      }
    }
    return () => (document.body.style.overflow = "");
  }, [fullscreen]);

  return (
    <div
      className={`chapter-page ${fullscreen ? "fullscreen-mode" : ""} ${horizontalScroll && !fullscreen ? "horizontal-mode" : ""}`}
      ref={pageContainerRef}
    >
      <SEOMeta
        title={
          generateChapterPageMeta(mangaTitle, chapterNumber, slug, hash).title
        }
        description={
          generateChapterPageMeta(mangaTitle, chapterNumber, slug, hash)
            .description
        }
        keywords={
          generateChapterPageMeta(mangaTitle, chapterNumber, slug, hash)
            .keywords
        }
        ogTitle={
          generateChapterPageMeta(mangaTitle, chapterNumber, slug, hash).ogTitle
        }
        ogDescription={
          generateChapterPageMeta(mangaTitle, chapterNumber, slug, hash)
            .ogDescription
        }
        ogImage={
          generateChapterPageMeta(mangaTitle, chapterNumber, slug, hash).ogImage
        }
        canonical={
          generateChapterPageMeta(mangaTitle, chapterNumber, slug, hash)
            .canonical
        }
        structuredData={
          generateChapterPageMeta(mangaTitle, chapterNumber, slug, hash)
            .structuredData
        }
      />
      {!fullscreen && (
        <div className="chapter-header">
          <Link to={`/${slug}/${hash}`} className="back-link">
            ← {mangaTitle}
          </Link>
          <h1 className="chapter-title">Chapter {chapterNumberStr}</h1>
          <div className="header-right">
            <button
              className="toggle-scroll-btn"
              onClick={() => setHorizontalScroll((prev) => !prev)}
              title={
                horizontalScroll
                  ? "Switch to vertical scroll"
                  : "Switch to horizontal scroll"
              }
            >
              {horizontalScroll ? "↕" : "↔"}
            </button>
          </div>
        </div>
      )}

      {!fullscreen && (
        <div className="chapter-navigation top-nav">
          {prevChapter ? (
            <Link
              to={`/read/${slug}/${hash}/chapter-${prevChapter.numberStr.replace(/\./g, "-")}`}
              className="nav-btn prev"
              onClick={() =>
                markChapterAsRead(parseFloat(prevChapter.numberStr))
              }
            >
              ‹ Prev
            </Link>
          ) : (
            <span className="nav-btn prev disabled">‹ Prev</span>
          )}
          <span className="nav-chapter-indicator">Ch. {chapterNumberStr}</span>
          {nextChapter ? (
            <Link
              to={`/read/${slug}/${hash}/chapter-${nextChapter.numberStr.replace(/\./g, "-")}`}
              className="nav-btn next"
              onClick={() =>
                markChapterAsRead(parseFloat(nextChapter.numberStr))
              }
            >
              Next ›
            </Link>
          ) : (
            <span className="nav-btn next disabled">Next ›</span>
          )}
        </div>
      )}

      {loadingPages && <p className="loading-text">Loading pages...</p>}

      <div
        className={`chapter-images ${
          fullscreen
            ? horizontalScroll
              ? "fullscreen horizontal-scroll"
              : "fullscreen vertical-scroll"
            : horizontalScroll
              ? "horizontal-scroll"
              : "vertical-scroll"
        }`}
      >
        {pages.map((page, idx) => (
          <ChapterImg
            key={page.key || idx}
            src={page.src}
            alt={`Page ${page.key || idx}`}
            index={idx}
            priority={idx < 3} // Load first 3 images immediately
            onOpenFullscreen={() => toggleFullscreen(idx)}
          />
        ))}
      </div>

      {/* Fullscreen navigation overlay */}
      {fullscreen && (
        <div
          className="fullscreen-nav-overlay"
          onClick={() => setShowChapterMenu(false)}
        >
          <button
            className="fullscreen-exit-btn"
            onClick={() => toggleFullscreen()}
            title="Exit fullscreen (ESC)"
          >
            ✕
          </button>

          <div className="fullscreen-chapter-nav">
            {prevChapter ? (
              <button
                className="fullscreen-nav-btn prev"
                onClick={(e) => {
                  e.preventDefault();
                  goToChapter(prevChapter, true);
                }}
              >
                ← Prev Chapter
              </button>
            ) : (
              <span className="fullscreen-nav-btn prev disabled">
                ← Prev Chapter
              </span>
            )}

            <div className="chapter-selector-container">
              <button
                className="fullscreen-chapter-indicator"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChapterMenu(!showChapterMenu);
                }}
              >
                Ch. {chapterNumberStr} ▾
              </button>

              {showChapterMenu && (
                <div
                  className="chapter-menu"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="chapter-menu-header">Select Chapter</div>
                  <div className="chapter-menu-list">
                    {chapters.map((ch) => (
                      <button
                        key={ch.numberStr}
                        className={`chapter-menu-item ${ch.numberStr === chapterNumberStr ? "active" : ""}`}
                        onClick={() => {
                          setShowChapterMenu(false);
                          if (ch.numberStr !== chapterNumberStr) {
                            goToChapter(ch, true);
                          }
                        }}
                      >
                        Chapter {ch.numberStr}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {nextChapter ? (
              <button
                className="fullscreen-nav-btn next"
                onClick={(e) => {
                  e.preventDefault();
                  goToChapter(nextChapter, true);
                }}
              >
                Next Chapter →
              </button>
            ) : (
              <span className="fullscreen-nav-btn next disabled">
                Next Chapter →
              </span>
            )}
          </div>
        </div>
      )}

      {!fullscreen && (
        <div className="chapter-navigation bottom-nav">
          {prevChapter ? (
            <button
              className="nav-btn prev"
              onClick={() => goToChapter(prevChapter)}
            >
              ← Previous Chapter
            </button>
          ) : (
            <span className="nav-btn prev disabled">← Previous Chapter</span>
          )}
          {nextChapter ? (
            <button
              className="nav-btn next"
              onClick={() => goToChapter(nextChapter)}
            >
              Next Chapter →
            </button>
          ) : (
            <span className="nav-btn next disabled">Next Chapter →</span>
          )}
        </div>
      )}

      {!horizontalScroll && <div className="chapter-bottom-spacer" />}
    </div>
  );
}
