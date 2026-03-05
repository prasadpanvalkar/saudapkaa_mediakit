// src/lib/axios.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    // baseURL is relative/empty by default so Next.js internal API rewrites handle the proxying securely. 
    // It can be overridden via NEXT_PUBLIC_API_URL if needed (e.g., pointing directly to backend).
    baseURL: process.env.NEXT_PUBLIC_API_URL || '',
    timeout: 10000, // Timeout detection
});

// Public endpoints that should NOT send Authorization headers
const PUBLIC_ENDPOINTS = [
    '/api/auth/login/',
    '/api/auth/verify/',
    '/api/auth/register/',
];

export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
    _retryCount?: number;
}

// Token Refresh State
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Retry Configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Interceptor helper: Safely serialize circular errors if needed
const getSafeErrorDetails = (error: any) => {
    try {
        const cache: any[] = [];
        return JSON.stringify(error, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (cache.includes(value)) return '[Circular]';
                cache.push(value);
            }
            return value;
        }, 2);
    } catch {
        return String(error);
    }
};

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint =>
            config.url?.includes(endpoint)
        );

        if (isPublicEndpoint) {
            delete config.headers.Authorization;
        } else {
            const token = Cookies.get('access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        // --- 1. Enhanced Logging ---
        // Display colored and structured error logs in the console
        const statusStr = error.response ? String(error.response.status) : 'NETWORK/TIMEOUT';
        const urlStr = originalRequest ? originalRequest.url : 'Unknown URL';

        console.groupCollapsed(`%c [API ERROR] %c ${statusStr} %c ${urlStr}`,
            'background: #dc2626; color: white; border-radius: 3px; font-weight: bold; padding: 2px 4px;',
            'color: #dc2626; font-weight: bold;',
            'color: #6b7280; font-weight: normal;'
        );

        if (error.code === 'ECONNABORTED' || !error.response) {
            console.error('%c [NETWORK/TIMEOUT] The request took too long or the server is unreachable.', 'color: #f59e0b; font-weight: bold;');
        } else {
            // Log structured response
            console.log('%c [DATA]', 'color: #059669; font-weight: bold;', error.response.data);
        }

        // Log serialized error string as a fallback for external loggers if needed
        console.log('%c [RAW ERROR TRACE]', 'color: #6b7280;', getSafeErrorDetails(error));
        console.groupEnd();


        if (!originalRequest) return Promise.reject(error);

        // --- 2. Retry Logic for 5xx Errors ---
        // Exponential backoff strategy for server-side errors
        if (error.response && error.response.status >= 500 && error.response.status <= 599) {
            originalRequest._retryCount = originalRequest._retryCount || 0;
            if (originalRequest._retryCount < MAX_RETRIES) {
                originalRequest._retryCount++;
                const backoffDelay = INITIAL_RETRY_DELAY * Math.pow(2, originalRequest._retryCount - 1);
                console.warn(`%c [API RETRY] %c Retrying request (${originalRequest._retryCount}/${MAX_RETRIES}) in ${backoffDelay}ms...`,
                    'background: #f59e0b; color: white; padding: 2px 4px; border-radius: 3px;',
                    'color: #f59e0b;'
                );
                await delay(backoffDelay);
                return api(originalRequest);
            } else {
                console.error(`%c [FAILED] %c Giving up after ${MAX_RETRIES} attempts.`,
                    'background: #dc2626; color: white; padding: 2px 4px; border-radius: 3px;',
                    'color: #dc2626;'
                );
            }
        }

        const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint =>
            originalRequest.url?.includes(endpoint)
        );

        if (isPublicEndpoint || originalRequest.url?.includes('/api/auth/token/refresh/')) {
            return Promise.reject(error);
        }

        // --- 3. Token Refresh Logic for 401 Errors ---
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (typeof window === 'undefined') {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = Cookies.get('refresh_token');

            if (!refreshToken) {
                Cookies.remove('access_token');
                Cookies.remove('refresh_token');
                localStorage.removeItem('saudapakka-auth');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(
                    '/api/auth/token/refresh/',
                    { refresh: refreshToken }
                );

                if (response.status === 200) {
                    const { access } = response.data;
                    Cookies.set('access_token', access, { expires: 7 });
                    api.defaults.headers.common['Authorization'] = 'Bearer ' + access;
                    originalRequest.headers['Authorization'] = 'Bearer ' + access;
                    processQueue(null, access);
                    isRefreshing = false;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;
                Cookies.remove('access_token');
                Cookies.remove('refresh_token');
                localStorage.removeItem('saudapakka-auth');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
