import axios from 'axios';
import { toast } from 'react-toastify';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
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

// Fired once per "session expired" episode so we don't spam the user with a toast
// per failed request. Reset on any successful response (e.g. after re-login).
let sessionExpiredHandled = false;

api.interceptors.response.use(
  (response) => {
    sessionExpiredHandled = false;
    return response;
  },
  async (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url || '');
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    const message = error?.response?.data?.message || error.message || 'Network error';

    // Invalid/expired token: clear the session and prompt a single re-login modal
    // instead of showing one error toast per failed request.
    if (status === 401 && !isAuthEndpoint) {
      try {
        localStorage.removeItem('order_center_user');
        localStorage.removeItem('order_center_access_token');
        localStorage.removeItem('order_center_refresh_token');
      } catch {
        // ignore localStorage errors
      }
      if (!sessionExpiredHandled) {
        sessionExpiredHandled = true;
        try {
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        } catch {
          // ignore
        }
      }
      return Promise.reject(new Error(message));
    }

    // Other errors: a single toast, deduped by message so identical errors don't stack.
    try {
      toast.error(message, { toastId: message });
    } catch {
      // ignore toast failures
    }
    return Promise.reject(new Error(message));
  }
);
