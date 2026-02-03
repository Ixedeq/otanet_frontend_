import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaExclamationTriangle, FaHome, FaSearch, FaDatabase, FaRedo } from "react-icons/fa";
import "../css/ErrorPage.css";

export default function ErrorPage({ type = "404", message, onRetry }) {
  const location = useLocation();

  const errorContent = {
    "404": {
      title: "Page Not Found",
      description: message || "The page you're looking for doesn't exist or has been moved.",
      icon: <FaExclamationTriangle />,
    },
    "no-manga": {
      title: "No Manga Found",
      description: message || "We couldn't find any manga matching your search.",
      icon: <FaSearch />,
    },
    "no-connection": {
      title: "Connection Failed",
      description: message || "Unable to connect to the server. Please check your connection and try again.",
      icon: <FaDatabase />,
    },
    "error": {
      title: "Something Went Wrong",
      description: message || "An unexpected error occurred. Please try again later.",
      icon: <FaExclamationTriangle />,
    },
  };

  const content = errorContent[type] || errorContent["404"];

  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-icon">{content.icon}</div>
        <h1 className="error-title">{content.title}</h1>
        <p className="error-description">{content.description}</p>
        {type === "404" && (
          <p className="error-path">
            <code>{location.pathname}</code>
          </p>
        )}
        <div className="error-actions">
          {type === "no-connection" && onRetry && (
            <button onClick={onRetry} className="error-btn primary">
              <FaRedo /> Try Again
            </button>
          )}
          <Link to="/" className="error-btn primary">
            <FaHome /> Go Home
          </Link>
          <Link to="/recent/1" className="error-btn secondary">
            Browse Manga
          </Link>
        </div>
      </div>
    </div>
  );
}
