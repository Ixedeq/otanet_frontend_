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
import BookmarksPage from "./components/BookmarksPage";
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
          <Route path="/:slug" element={<MangaPage />} />

          {/*future chapter page */}
          <Route path="/read/:slug/:chapter" element={<ChapterPage />} />
          <Route path="/search/:search" element={<SearchResult/>} />

          {/* Bookmarks page */}
          <Route path="/bookmarks" element={<BookmarksPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

