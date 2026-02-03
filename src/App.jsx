// App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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
      <Header />
      <main>
        <ScrollToTop />
        <Routes>
          {/* Home page shows carousel only */}
          <Route
            path="/"
            element={
              <>
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

