// App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./components/Carousel";
import Recent_Manga from "./components/Recent_Manga";
import MangaPage from "./components/MangaPage";
import ChapterPage from "./components/ChapterPage";
import SearchResult from "./components/SearchResult";
import TagSearchResult from "./components/TagSearchResult";
import BookmarksPage from "./components/BookmarksPage";
import ErrorPage from "./components/ErrorPage";
import "./css/App.css";
import ScrollToTop from "./components/components/ScrollToTop";

export default function App() {
  return (
    <div className="app">
      <Helmet>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="canonical" href="https://ota-network.com" />
      </Helmet>
      <Header />
      <main>
        <ScrollToTop />
        <Routes>
          {/* Home page shows carousel only */}
          <Route
            path="/"
            element={
              <>
                <Helmet>
                  <title>Manga Reader - Read Manga Online Free | OtaNet</title>
                  <meta name="description" content="Read thousands of manga online for free. Browse latest releases, search by tags, and bookmark your favorites on OtaNet." />
                  <meta name="keywords" content="manga, read manga, manga online, free manga" />
                  <meta property="og:title" content="Manga Reader - Read Online Free" />
                  <meta property="og:description" content="Browse and read manga online with OtaNet" />
                  <meta property="og:type" content="website" />
                </Helmet>
                <Home />
                <Recent_Manga />
              </>
            }
          />
          {/* Redirect /recent → /recent/1 */}
          <Route path="/recent" element={<Navigate to="/recent/1" replace />} />

          {/* Paginated recent manga */}
          <Route path="/recent/:page" element={<Recent_Manga />} />

          {/* Individual manga page */}
          <Route path="/:slug/:hash" element={<MangaPage />} />

          {/*future chapter page */}
          <Route path="/read/:slug/:hash/:chapter" element={<ChapterPage />} />
          <Route path="/search/:search" element={<SearchResult/>} />
          <Route path="/search/tags" element={<TagSearchResult/>} />

          {/* Bookmarks page */}
          <Route path="/bookmarks" element={<BookmarksPage />} />

          {/* 404 - Page not found */}
          <Route path="*" element={<ErrorPage type="404" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

