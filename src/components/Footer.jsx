import React from "react";
import "../css/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Random Weeb Shit</p>
    </footer>
  );
}
