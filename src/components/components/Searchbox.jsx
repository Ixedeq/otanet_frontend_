import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiSearch } from "react-icons/fi";

export default function SearchBox() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-focus input when search opens
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (searchValue === "") {
          setSearchOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchValue]);

  // Close search when route changes
  useEffect(() => {
    setSearchOpen(false);
  }, [location.pathname]);

  const handleSearch = useCallback(() => {
    const trimmedValue = searchValue.trim();
    if (trimmedValue !== "") {
      navigate(`/search/${encodeURIComponent(trimmedValue)}`);
      setSearchValue("");
      setSearchOpen(false);
      inputRef.current?.blur();
    }
  }, [searchValue, navigate]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setSearchValue("");
      setSearchOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleButtonClick = () => {
    if (!searchOpen) {
      // First click opens the search
      setSearchOpen(true);
    } else if (searchValue.trim() !== "") {
      // If open and has value, search
      handleSearch();
    } else {
      // If open but empty, focus input
      inputRef.current?.focus();
    }
  };

  const handleMouseEnter = () => setSearchOpen(true);

  const handleMouseLeave = () => {
    // Only close if not focused and no value
    if (document.activeElement !== inputRef.current && searchValue === "") {
      setSearchOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`searchBox ${searchOpen ? "open" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <input
        ref={inputRef}
        type="text"
        placeholder="Search manga..."
        className="searchInput"
        onKeyDown={handleKeyDown}
        onFocus={() => setSearchOpen(true)}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        aria-label="Search manga"
        autoComplete="off"
        spellCheck="false"
      />
      <button
        className="searchButton"
        onClick={handleButtonClick}
        aria-label={searchOpen ? "Submit search" : "Open search"}
        type="button"
      >
        <FiSearch size={20} color="white" />
      </button>
    </div>
  );
}
