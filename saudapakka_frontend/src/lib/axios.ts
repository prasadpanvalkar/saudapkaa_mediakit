import axios from 'axios';
import Cookies from 'js-cookie';

// Point to your Docker Backend
const api = axios.create({
  baseURL: 'http://localhost:8000',
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