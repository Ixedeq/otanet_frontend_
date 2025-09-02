// src/config.js

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "http://76.123.162.109:8000";

export default API_BASE;