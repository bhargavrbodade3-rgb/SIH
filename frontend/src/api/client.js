import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL 
  ? (import.meta.env.VITE_API_URL.endsWith('/api') 
      ? import.meta.env.VITE_API_URL 
      : `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`)
  : '/api';

const api = axios.create({
  baseURL: apiBase,
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let friendlyMessage = 'An unexpected error occurred. Please try again.';

    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        friendlyMessage = 'Your session has expired. Please sign in again.';
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else if (status === 403) {
        friendlyMessage = 'Access denied. You do not have permission to view or modify this resource.';
      } else if (status === 404) {
        friendlyMessage = 'The requested resource or record could not be found.';
      } else if (status === 422) {
        friendlyMessage = 'Validation error: Please review the entered form fields and try again.';
      } else if (status === 429) {
        friendlyMessage = 'Too many requests. Please wait a moment before trying again.';
      } else if (status >= 500) {
        friendlyMessage = 'Compliance server encountered an issue. The engineering team has been notified.';
      } else if (error.response.data && typeof error.response.data.detail === 'string') {
        friendlyMessage = error.response.data.detail;
      }
    } else if (error.request) {
      friendlyMessage = 'Unable to connect to the compliance server. Please ensure the backend service is running.';
    }

    // Attach friendlyMessage so components can display it directly
    error.userMessage = friendlyMessage;
    return Promise.reject(error);
  }
);

export default api;
