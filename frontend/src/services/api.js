import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const TOKEN_STORAGE_KEY = "transitops.accessToken";

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);
export const setStoredToken = (token) => localStorage.setItem(TOKEN_STORAGE_KEY, token);
export const clearStoredToken = () => localStorage.removeItem(TOKEN_STORAGE_KEY);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event("transitops:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export default api;
