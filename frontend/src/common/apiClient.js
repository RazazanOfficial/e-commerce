//? 🔵 Required Modules
import axios from "axios";


//* 🟢 Backend URL
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9999";


//* 🟢 Axios Client
const apiClient = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  timeout: 30_000,
});

//? 🔵 Export Client
export default apiClient;
