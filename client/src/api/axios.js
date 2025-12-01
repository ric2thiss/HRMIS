import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"; //localhost:8000

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request interceptor: Add CSRF token to all requests
api.interceptors.request.use(
    (config) => {
        const tokenMatch = document.cookie.match(/XSRF-TOKEN=([^;]*)/);
        if (tokenMatch) {
            config.headers['X-XSRF-TOKEN'] = decodeURIComponent(tokenMatch[1]);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: Handle common errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Handle 419 CSRF Token Mismatch - retry with fresh token
        if (error.response?.status === 419 && !error.config._retry) {
            error.config._retry = true;
            try {
                // Fetch fresh CSRF cookie
                await api.get('/sanctum/csrf-cookie', { withCredentials: true });
                // Wait a bit for cookie to be set
                await new Promise(resolve => setTimeout(resolve, 100));
                // Retry the original request
                return api.request(error.config);
            } catch (retryError) {
                return Promise.reject(retryError);
            }
        }
        
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            // Could redirect to login here if needed
        }
        
        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            // Could show access denied message
        }

        // Handle 500 Server Error
        if (error.response?.status === 500) {
            // Could show server error message
        }

        return Promise.reject(error);
    }
);

export default api;