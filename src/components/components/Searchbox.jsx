import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";

export default function SearchBox() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchValue.trim() !== "") {
      navigate(`/search/${searchValue}`, { state: { searchValue } });
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
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
        onChange={(e) => setSearchValue(e.target.value)}
      />
      <button className="searchButton" onClick={handleSearch}>
        <FiSearch size={20} color="white" />
      </button>
    </div>
  );
}
