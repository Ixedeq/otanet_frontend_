import React, { useState, useEffect } from "react";
import { FiHome, FiClock, FiBookmark, FiX } from "react-icons/fi";
import { FaMoon, FaSun } from "react-icons/fa";

export default function Sidebar({ isOpen, onClose }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`sidebar-backdrop ${isOpen ? "open" : ""}`} 
        onClick={onClose}
      />
      
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">Menu</span>
          <button className="close-button" onClick={onClose} aria-label="Close menu">
            <FiX size={20} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <a href="/" className="sidebar-link" onClick={onClose}>
            <FiHome size={20} />
            <span>Home</span>
          </a>
          <a href="/recent/1" className="sidebar-link" onClick={onClose}>
            <FiClock size={20} />
            <span>Recent Updates</span>
          </a>
          <a href="/bookmarks" className="sidebar-link" onClick={onClose}>
            <FiBookmark size={20} />
            <span>Bookmarks</span>
          </a>
        </nav>
        
        <div className="sidebar-footer">
          <button
            className="theme-toggle-sidebar"
            onClick={toggleTheme}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <FaSun size={16} /> : <FaMoon size={16} />}
            <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <span className="sidebar-copyright">OtaNet © 2026</span>
        </div>
      </div>
    </>
  );
}