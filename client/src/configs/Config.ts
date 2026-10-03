// Single source of truth for the backend URL.
// Set VITE_BASE_URL in your .env file (e.g. VITE_BASE_URL=https://aevion-ai.onrender.com)
// Falls back to localhost:3000 for local backend development.
export const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";