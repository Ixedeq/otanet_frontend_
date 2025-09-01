// App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./components/Home";
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
          {/* Home page shows both Home and Recent_Manga */}
          <Route
            path="/"
            element={
              <>
                <Home />
                <Recent_Manga />
              </>
            }
          />

          {/* Individual manga page */}
          <Route path="/:slug" element={<MangaPage />} />

          {/*future chapter page */}
          <Route path="/:slug/chapter/" element={<ChapterPage />} />
           <Route path="/search/:search" element={<SearchResult/>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

