// src/lib/axios.ts
import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
});

// Public endpoints that should NOT send Authorization headers
const PUBLIC_ENDPOINTS = [
  '/api/auth/login/',
  '/api/auth/verify/',
  '/api/auth/register/',
];

api.interceptors.request.use((config) => {
  // Client-only check
  if (typeof window !== 'undefined') {
    // Skip token for public auth endpoints
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint =>
      config.url?.includes(endpoint)
    );

    if (!isPublicEndpoint) {
      const token = Cookies.get('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  }
  return config;
});

// Add response interceptor to handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 and not a public endpoint, redirect to login
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint =>
        error.config?.url?.includes(endpoint)
      );

      if (!isPublicEndpoint) {
        Cookies.remove('access_token');
        localStorage.removeItem('saudapakka-auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
