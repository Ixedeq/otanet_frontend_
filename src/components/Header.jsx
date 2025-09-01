import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import "../css/Header.css";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSerachValue] = useState("")
  const navigate = useNavigate();

  const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        console.log('Enter key pressed!'); 
        navigate(`/search/${searchValue}`, { state: { searchValue: searchValue} });
      }
    };
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
          onKeyDown={handleKeyDown}
          value={searchValue}
          onChange={(e) => setSerachValue(e.target.value)}
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


