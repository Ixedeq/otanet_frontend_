import React from "react";
import { FiHome, FiClock, FiBookmark, FiX } from "react-icons/fi";

export default function Sidebar({ isOpen, onClose }) {
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
          <span>OtaNet © 2026</span>
        </div>
      </div>
    </>
  );
}