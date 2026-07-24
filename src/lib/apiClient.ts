// Base URL for the Waypoint backend (server/). Override with VITE_API_URL
// in a .env file — see .env.example at the repo root.
export const API_URL: string = import.meta.env.VITE_API_URL || "http://localhost:8787";
