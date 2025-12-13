import { create } from 'zustand';
import api from '../api/axios';

// Helper function to normalize user object (handle both snake_case and camelCase)
const normalizeUser = (user) => {
  if (!user) return null;
  
  // Normalize employmentTypes - Laravel returns as employment_types (snake_case)
  if (user.employment_types && !user.employmentTypes) {
    user.employmentTypes = user.employment_types;
  }
  
  return user;
};

// Global interceptor reference
let interceptorId = null;

const setupInterceptor = (get) => {
  // Remove existing interceptor if any
  if (interceptorId !== null) {
    api.interceptors.response.eject(interceptorId);
  }

  interceptorId = api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const { user, logout, isForceLoggingOut, isInMaintenanceRedirect } = get();

      // Skip maintenance logic if flagged
      if (originalRequest?.headers?.['X-Skip-Interceptor']) {
        return Promise.reject(error);
      }

      // Handle HTTP 503 errors (maintenance mode)
      if (error.response?.status === 503 && !originalRequest._retry) {
        // Do NOT logout admin
        if (user?.roles?.[0]?.name === 'admin') {
          return Promise.reject(error);
        }

        // Prevent double-trigger
        if (isForceLoggingOut) {
          return Promise.reject(error);
        }

        get().setIsForceLoggingOut(true);
        originalRequest._retry = true;

        try {
          await api.post(
            '/api/logout',
            {},
            {
              withCredentials: true,
              headers: { 'X-Skip-Interceptor': 'true' },
            }
          );
        } catch (err) {
          console.error('Logout during maintenance failed:', err);
        }

        get().setUser(null);

        // Redirect to maintenance ONCE only
        if (!isInMaintenanceRedirect) {
          get().setIsInMaintenanceRedirect(true);
          window.location.replace('/maintenance');
        }

        return Promise.reject(error);
      }

      // Handle 401 Unauthorized
      if (error.response?.status === 401 && user && !isForceLoggingOut) {
        await logout();
      }

      // Handle 403 Forbidden for locked accounts
      // Don't handle password change requirement here - let axios interceptor handle it
      if (error.response?.status === 403) {
        const message = error.response?.data?.message;
        const mustChangePassword = error.response?.data?.must_change_password;
        const requestUrl = originalRequest?.url || '';
        
        // Skip handling if it's a password change requirement (let axios interceptor handle it)
        // Skip handling for /api/user endpoint to prevent clearing user state
        if (mustChangePassword || requestUrl.includes('/api/user')) {
          return Promise.reject(error);
        }
        
        if (message === 'Your account has been locked out! - HR') {
          if (!isForceLoggingOut) {
            try {
              get().setIsForceLoggingOut(true);
              // Perform a best-effort logout without re-triggering interceptors
              await api.post(
                '/api/logout',
                {},
                {
                  withCredentials: true,
                  headers: { 'X-Skip-Interceptor': 'true' },
                }
              );
            } catch (err) {
              console.error('Error during forced logout for locked account:', err);
            } finally {
              get().setUser(null);
              get().setIsForceLoggingOut(false);
              // Redirect to locked account information page
              window.location.replace('/locked-account');
            }
          }
        }
      }

      return Promise.reject(error);
    }
  );
};

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  isForceLoggingOut: false,
  isInMaintenanceRedirect: false,

  // Setters for interceptor access
  setIsForceLoggingOut: (value) => set({ isForceLoggingOut: value }),
  setIsInMaintenanceRedirect: (value) => set({ isInMaintenanceRedirect: value }),

  // Initialize user on app load
  initialize: async () => {
    try {
      await api.get('/sanctum/csrf-cookie', { withCredentials: true });
      const res = await api.get('/api/user', { withCredentials: true });
      const normalizedUser = normalizeUser(res.data.user);
      set({ user: normalizedUser, loading: false });
      setupInterceptor(get);
    } catch (err) {
      set({ user: null, loading: false });
      setupInterceptor(get);
    }
  },

  // Login
  login: async (email, password) => {
    try {
      // Fetch CSRF cookie and ensure it's set before proceeding
      await api.get('/sanctum/csrf-cookie', { withCredentials: true });
      
      // Wait for cookie to be available (with retry mechanism)
      let retries = 3;
      let tokenAvailable = false;
      
      while (retries > 0 && !tokenAvailable) {
        await new Promise(resolve => setTimeout(resolve, 50));
        const tokenMatch = document.cookie.match(/XSRF-TOKEN=([^;]*)/);
        if (tokenMatch && tokenMatch[1]) {
          tokenAvailable = true;
        } else {
          retries--;
          if (retries > 0) {
            // Retry fetching CSRF cookie
            await api.get('/sanctum/csrf-cookie', { withCredentials: true });
          }
        }
      }
      
      await api.post('/api/login', { email, password }, { withCredentials: true });
      
      // Fetch complete user data after login
      const userRes = await api.get('/api/user', { withCredentials: true });
      const normalizedUser = normalizeUser(userRes.data.user);
      set({ user: normalizedUser });
      setupInterceptor(get);
    } catch (err) {
      set({ user: null });
      throw err;
    }
  },

  // Register
  register: async (name, email, password, role_id) => {
    try {
      await api.get('/sanctum/csrf-cookie');
      await api.post('/api/register', { name, email, password, role_id }, { withCredentials: true });
    } catch (err) {
      throw err;
    }
  },

  // Logout
  logout: async () => {
    try {
      set({ isForceLoggingOut: true });
      await api.get('/sanctum/csrf-cookie');
      await api.post('/api/logout', {}, { withCredentials: true });
    } catch (err) {
      console.error(err);
    } finally {
      set({ user: null, isForceLoggingOut: false });
      // Re-setup interceptor after logout
      setupInterceptor(get);
    }
  },

  // Refresh user data
  refreshUser: async () => {
    try {
      await api.get('/sanctum/csrf-cookie', { withCredentials: true });
      const res = await api.get('/api/user', { withCredentials: true });
      const normalizedUser = normalizeUser(res.data.user);
      set({ user: normalizedUser });
      return normalizedUser;
    } catch (err) {
      console.error('Error refreshing user:', err);
      return null;
    }
  },

  // Set user directly (for updates)
  setUser: (user) => set({ user: normalizeUser(user) }),
}));
