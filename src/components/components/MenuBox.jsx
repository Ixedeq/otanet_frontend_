import React, { useState } from "react";
import Sidebar from "./Sidebar"; // your sidebar component

export default function MenuBox() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="menu-box">
      <button className="menu-button" onClick={toggleMenu}>
        ☰
      </button>

      {/* Toggleable sidebar */}
      {isOpen && <Sidebar onClose={toggleMenu} />}
    </div>
  );
}

