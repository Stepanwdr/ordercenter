import axios from 'axios';
import { toast } from 'react-toastify';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:6000';
// const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://dev.deliverydepartment.am/api';
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  // Attach access token from localStorage if available
  try {
    // Primary: token stored separately
    const tokenFromStore = localStorage.getItem('order_center_access_token');
    if (tokenFromStore) {
      config.headers.Authorization = `Bearer ${tokenFromStore}`;
      return config;
    }
    // Fallback: token inside user payload if stored in a legacy way
    const storedUser = localStorage.getItem('order_center_user');
    const parsed = storedUser ? JSON.parse(storedUser) : null;
    const token = parsed?.accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore localStorage errors
  }
  // Debug: log outgoing requests in non-prod environments
  // if (typeof window !== 'undefined' && (process.env.NODE_ENV ?? 'development') !== 'production') {
  //   // eslint-disable-next-line no-console
  //   console.debug('API request', { baseURL: config?.baseURL, url: config?.url, headers: config?.headers });
  // }
  return config;
});

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
    const message = error?.response?.data?.message || error.message || 'Network error';
    // Show user-friendly error toast
    try {
      toast.error(message);
    } catch {
      // ignore toast failures
    }
    return Promise.reject(new Error(message));
    }
  );
