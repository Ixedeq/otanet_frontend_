// App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Home2 from "./components/Home2";
import ChapterPage from "./components/ChapterPage"; // make sure this exists
import "./css/App.css";

export default function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chapter/:manga" element={<ChapterPage />} />
        </Routes>
        <Home2 />
      </main>
      <Footer />
    </div>
  );
}
