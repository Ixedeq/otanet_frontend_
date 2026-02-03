// src/config.js

const isDev = process.env.NODE_ENV === 'development';

// In development, use Flask API on port 5001
// Use window.location.hostname to work across devices on local network
const API_BASE = isDev 
  ? `http://${window.location.hostname}:5001` 
  : "/api";

export default API_BASE;
