import axios from 'axios';

const baseURL =
  import.meta.env.VITE_API_BASE ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');

const api = axios.create({ baseURL });

// Request interceptor to add auth token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor to handle token expiration
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      
      // Handle token expiration or invalid token
      if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN' || errorCode === 'AUTH_ERROR') {
        // Clear local storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
