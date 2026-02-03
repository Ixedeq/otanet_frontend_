import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaTag, FaPlus, FaMinus, FaSearch, FaTimes } from "react-icons/fa";
import API_BASE from "../Config";
import { getTagStyle } from "../utils/tagColors";
import "../../css/TagSelector.css";

export default function TagSelector({ onClose }) {
  const [allTags, setAllTags] = useState([]);
  const [includeTags, setIncludeTags] = useState([]);
  const [excludeTags, setExcludeTags] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isLightMode, setIsLightMode] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Check for light mode
  useEffect(() => {
    const checkTheme = () => {
      setIsLightMode(document.documentElement.getAttribute("data-theme") === "light");
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Fetch all available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_all_tags`);
        if (res.ok) {
          const data = await res.json();
          setAllTags(data);
        }
      } catch (err) {
        console.error("Failed to fetch tags:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Handle tag click: none -> include -> exclude -> none
  const handleTagClick = (tag) => {
    if (includeTags.includes(tag)) {
      // Move from include to exclude
      setIncludeTags((prev) => prev.filter((t) => t !== tag));
      setExcludeTags((prev) => [...prev, tag]);
    } else if (excludeTags.includes(tag)) {
      // Remove from exclude (back to none)
      setExcludeTags((prev) => prev.filter((t) => t !== tag));
    } else {
      // Add to include
      setIncludeTags((prev) => [...prev, tag]);
    }
  };

  // Get tag state for styling
  const getTagState = (tag) => {
    if (includeTags.includes(tag)) return "include";
    if (excludeTags.includes(tag)) return "exclude";
    return "none";
  };

  // Filter tags based on search
  const filteredTags = allTags.filter((tag) =>
    tag.toLowerCase().includes(filterText.toLowerCase())
  );

  // Handle search
  const handleSearch = () => {
    if (includeTags.length === 0 && excludeTags.length === 0) return;
    
    const params = new URLSearchParams();
    if (includeTags.length > 0) {
      params.set("include", includeTags.join(","));
    }
    if (excludeTags.length > 0) {
      params.set("exclude", excludeTags.join(","));
    }
    
    navigate(`/search/tags?${params.toString()}`);
    onClose?.();
  };

  // Clear all selections
  const handleClear = () => {
    setIncludeTags([]);
    setExcludeTags([]);
  };

  return (
    <div className="tag-selector-overlay">
      <div className="tag-selector" ref={containerRef}>
        <div className="tag-selector-header">
          <h3><FaTag /> Select Tags</h3>
          <button className="tag-selector-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="tag-selector-legend">
          <span className="legend-item">
            <span className="legend-dot include"></span> Include
          </span>
          <span className="legend-item">
            <span className="legend-dot exclude"></span> Exclude
          </span>
          <span className="legend-hint">Click: include → exclude → none</span>
        </div>

        <div className="tag-selector-filter">
          <FaSearch className="filter-icon" />
          <input
            type="text"
            placeholder="Filter tags..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            autoFocus
          />
        </div>

        <div className="tag-selector-selected">
          {includeTags.length > 0 && (
            <div className="selected-group include">
              <FaPlus size={12} />
              {includeTags.map((tag) => (
                <span 
                  key={tag} 
                  className="selected-tag" 
                  onClick={() => handleTagClick(tag)}
                  style={getTagStyle(tag, isLightMode)}
                >
                  {tag} <FaTimes size={10} />
                </span>
              ))}
            </div>
          )}
          {excludeTags.length > 0 && (
            <div className="selected-group exclude">
              <FaMinus size={12} />
              {excludeTags.map((tag) => (
                <span 
                  key={tag} 
                  className="selected-tag" 
                  onClick={() => handleTagClick(tag)}
                  style={getTagStyle(tag, isLightMode)}
                >
                  {tag} <FaTimes size={10} />
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="tag-selector-list">
          {loading ? (
            <div className="tag-selector-loading">Loading tags...</div>
          ) : filteredTags.length > 0 ? (
            filteredTags.map((tag) => {
              const state = getTagState(tag);
              const baseStyle = getTagStyle(tag, isLightMode);
              return (
                <button
                  key={tag}
                  className={`tag-option ${state}`}
                  onClick={() => handleTagClick(tag)}
                  style={baseStyle}
                >
                  {state === "include" && <FaPlus size={10} />}
                  {state === "exclude" && <FaMinus size={10} />}
                  {tag}
                </button>
              );
            })
          ) : (
            <div className="tag-selector-empty">No tags found</div>
          )}
        </div>

        <div className="tag-selector-actions">
          <button className="tag-action-btn clear" onClick={handleClear}>
            Clear
          </button>
          <button
            className="tag-action-btn search"
            onClick={handleSearch}
            disabled={includeTags.length === 0 && excludeTags.length === 0}
          >
            <FaSearch /> Search ({includeTags.length + excludeTags.length})
          </button>
        </div>
      </div>
    </div>
  );
}
