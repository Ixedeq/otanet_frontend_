import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaSearch } from "react-icons/fa";
import "../css/Header.css";

export default function Header() {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="header">
      {/* Search container */}
      <div className={`search-container ${mobileSearchOpen ? "open" : ""}`}>
        <FaSearch
          className="search-icon"
          size={34}
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
        />
        <input
          type="text"
          placeholder="Search..."
          className="search-input"
          onBlur={() => setMobileSearchOpen(false)}
        />
      </div>

      {/* Logo */}
      <h1 className="site-title">
        <span className="ota">
          <Link to="/">Ota</Link>
        </span>
        <span className="net">
          <Link to="/">Net</Link>
        </span>
      </h1>

      {/* Menu icon */}
      <button className="menu-icon" aria-label="Menu">
        <FaBars size={34} />
      </button>
    </header>
  );
}
