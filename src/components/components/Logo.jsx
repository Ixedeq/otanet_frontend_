import React from "react";
import { useNavigate } from "react-router-dom";

export default function Logo() {
  const navigate = useNavigate();

  const goHome = () => {
    navigate("/", { replace: false }); // Navigate home
    window.scrollTo({ top: 0, behavior: "smooth" }); // Optional: scroll to top
  };

  return (
    <h1 className="site-title" onClick={goHome} style={{ cursor: "pointer" }}>
      <span className="ota">Ota</span>
      <span className="net">Net</span>
    </h1>
  );
}

