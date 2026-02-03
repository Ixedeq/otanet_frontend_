import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { FaTag } from "react-icons/fa";
import TagSelector from "./TagSelector";

export default function SearchBox() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [showTagSelector, setShowTagSelector] = useState(false);
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
    setShowTagSelector(false);
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
      setSearchOpen(true);
    } else if (searchValue.trim() !== "") {
      handleSearch();
    } else {
      inputRef.current?.focus();
    }
  };

  const openTagSelector = () => {
    setShowTagSelector(true);
  };

  const handleMouseEnter = () => setSearchOpen(true);

  const handleMouseLeave = () => {
    if (document.activeElement !== inputRef.current && searchValue === "") {
      setSearchOpen(false);
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`searchBox ${searchOpen ? "open" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {searchOpen && (
          <button
            className="search-mode-toggle"
            onClick={openTagSelector}
            title="Search by tags"
            type="button"
          >
            <FaTag size={14} />
          </button>
        )}
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
      
      {showTagSelector && createPortal(
        <TagSelector onClose={() => setShowTagSelector(false)} />,
        document.body
      )}
    </>
  );
}
