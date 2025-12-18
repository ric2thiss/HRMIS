import { create } from 'zustand';
import { getLeaveTypes } from '../api/leave/leaveApplications';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for leave types (rarely change)

export const useLeaveTypesStore = create((set, get) => ({
  leaveTypes: [],
  loading: false,
  lastFetched: null,
  error: null,

  // Get cached leave types or fetch if cache expired
  getLeaveTypes: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    // Return cached data if still valid and not forcing refresh
    if (
      !forceRefresh &&
      state.leaveTypes.length > 0 &&
      state.lastFetched &&
      (now - state.lastFetched) < CACHE_DURATION
    ) {
      return state.leaveTypes;
    }

    // Fetch new data
    set({ loading: true, error: null });
    try {
      const types = await getLeaveTypes();
      // Filter only active leave types
      const activeLeaveTypes = types.filter(type => type.is_active === true);
      set({
        leaveTypes: activeLeaveTypes,
        loading: false,
        lastFetched: now,
        error: null,
      });
      return activeLeaveTypes;
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || 'Failed to load leave types',
      });
      throw error;
    }
  },

  // Clear cache (useful after CRUD operations)
  clearCache: () => {
    set({
      leaveTypes: [],
      lastFetched: null,
    });
  },

  // Refresh leave types (force fetch)
  refreshLeaveTypes: async () => {
    return await get().getLeaveTypes(true);
  },
}));



