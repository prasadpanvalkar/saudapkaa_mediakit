// axios.ts
import axios from 'axios';
import Cookies from 'js-cookie';

// Production: Use relative paths (handled by Next.js rewrites or reverse proxy)
// The API URL is configured via NEXT_PUBLIC_API_URL environment variable
// The API URL is configured via NEXT_PUBLIC_API_URL environment variable
const api_url = process.env.NEXT_PUBLIC_API_URL || '';
if (typeof window !== 'undefined') {
  console.log('API_URL being used:', api_url);
}

const api = axios.create({
  baseURL: api_url,
});

// Automatically add the Token to every request if it exists
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401 error, clear the invalid token
    if (error.response?.status === 401) {
      const token = Cookies.get('access_token');
      if (token) {
        // Clear the invalid token
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');

        // Retry the request without authentication
        const config = error.config;
        delete config.headers.Authorization;
        return axios.request(config);
      }
    }
    return Promise.reject(error);
  }
);

export default api;