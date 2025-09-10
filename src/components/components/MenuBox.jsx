import React, { useState } from "react";
import Sidebar from "./Sidebar";

export default function MenuBox() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(prev => !prev);

  return (
    <div className="MenuBox">
      {/* Hamburger / menu button styled like your searchButton */}
      <button
        className="searchButton"
        onClick={toggleMenu}
        aria-label="Toggle Menu"
      >
        ☰
      </button>

      {/* Sidebar */}
      <Sidebar isOpen={isOpen} onClose={toggleMenu} />
    </div>
  );
}
