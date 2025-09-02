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
import "./css/App.css";

export default function App() {
  return (
    <div className="app">
      <Header />
      <main>
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

          {/* Chapter page */}
          <Route path="/:slug/chapter/:chapterId" element={<ChapterPage />} />

          {/* Search results */}
          <Route path="/search/:search" element={<SearchResult />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

