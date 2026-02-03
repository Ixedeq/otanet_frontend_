// src/config.js

const isDev = process.env.NODE_ENV === 'development';

// In development, use local Flask API on port 5001
// In production, use the /api path (proxied by server)
const API_BASE = isDev ? "http://localhost:5001" : "/api";

export default API_BASE;
