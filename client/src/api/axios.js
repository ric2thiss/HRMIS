import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000", // Ensure this matches your Laravel .env
    withCredentials: true,
});

// FIX for 419 error: Manually set the X-XSRF-TOKEN header
api.interceptors.request.use((config) => {
    if (['post', 'put', 'patch', 'delete', 'get'].includes(config.method)) {
        const tokenMatch = document.cookie.match(/XSRF-TOKEN=([^;]*)/);
        if (tokenMatch) {
            config.headers['X-XSRF-TOKEN'] = decodeURIComponent(tokenMatch[1]);
        }
    }
    return config;
});

export default api;