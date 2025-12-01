// Compatibility hook for useAuth - wraps Zustand store
import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const setUser = useAuthStore((state) => state.setUser);

  return {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    setUser,
  };
};

