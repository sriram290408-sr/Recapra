import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const ASSET_BASE_URL =
  import.meta.env.VITE_ASSET_URL || "http://localhost:8000";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("recapra_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor to handle token expiry / 401s
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("recapra_token");
      // Optionally redirect to login, but let's let AuthContext check it
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
