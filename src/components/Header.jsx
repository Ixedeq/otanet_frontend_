import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import "../css/Header.css";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header>
      {/* Search Box on the left */}
      <div
        className={`searchBox ${searchOpen ? "open" : ""}`}
        onMouseEnter={() => setSearchOpen(true)}
        onMouseLeave={() => setSearchOpen(false)}
      >
        <input
          type="text"
          placeholder="Search..."
          className="searchInput"
        />
        <button className="searchButton">
          <FiSearch size={20} color="white"/>
        </button>
      </div>

      {/* Centered Logo */}
      <h1 className="site-title">
        <span className="ota">
          <Link to="/">Ota</Link>
        </span>
        <span className="net">
          <Link to="/">Net</Link>
        </span>
      </h1>

      {/* Menu Box on the right */}
      <div className="MenuBox">
        <button className="searchButton">☰</button>
      </div>
    </header>
  );
}


