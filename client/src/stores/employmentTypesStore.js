import { create } from 'zustand';
import api from '../api/axios';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for employment types (rarely changes)

export const useEmploymentTypesStore = create((set, get) => ({
  employmentTypes: [],
  loading: false,
  lastFetched: null,
  error: null,

  // Get cached employment types or fetch if cache expired
  getEmploymentTypes: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    // Return cached data if still valid and not forcing refresh
    if (
      !forceRefresh &&
      state.employmentTypes.length > 0 &&
      state.lastFetched &&
      (now - state.lastFetched) < CACHE_DURATION
    ) {
      return state.employmentTypes;
    }

    // Fetch new data
    set({ loading: true, error: null });
    try {
      await api.get("/sanctum/csrf-cookie");
      const response = await api.get("/api/employment/types");
      const types = response.data.employment_types || response.data || [];
      
      set({
        employmentTypes: types,
        loading: false,
        lastFetched: now,
        error: null,
      });
      return types;
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || 'Failed to load employment types',
      });
      throw error;
    }
  },

  // Clear cache (useful after CRUD operations or logout)
  clearCache: () => {
    set({
      employmentTypes: [],
      lastFetched: null,
    });
  },

  // Refresh employment types (force fetch)
  refreshEmploymentTypes: async () => {
    return await get().getEmploymentTypes(true);
  },
}));

