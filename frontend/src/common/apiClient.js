import axios from "axios";

// Backend base URL (configure in .env.local)
// Example: NEXT_PUBLIC_BACKEND_URL=http://localhost:9999
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9999";

// Shared axios instance for all backend calls
const apiClient = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  timeout: 30_000,
});

export default apiClient;
