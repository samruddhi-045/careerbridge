import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true, // so the httpOnly refresh cookie gets sent
});

// access token is kept in memory only, not localStorage (safer against XSS)
// it's gone on page refresh, but AuthContext fetches a new one on load
let accessToken = null;
export const setAccessToken = (token) => { accessToken = token; };
export const getAccessToken = () => accessToken;

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// if a request fails with 401, try to refresh the token once and retry it
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.includes("/auth/login") || original?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && !original._retried && !isAuthCall) {
      original._retried = true;
      try {
        refreshing = refreshing || api.post("/auth/refresh");
        const { data } = await refreshing;
        refreshing = null;
        setAccessToken(data.data.accessToken);
        return api(original);
      } catch (e) {
        refreshing = null;
        setAccessToken(null);
      }
    }
    return Promise.reject(error);
  }
);

export default api;