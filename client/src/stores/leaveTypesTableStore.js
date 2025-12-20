import { create } from 'zustand';
import { getLeaveTypes } from '../api/master-lists/leaveTypes';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for leave types (in master lists tab)

export const useLeaveTypesTableStore = create((set, get) => ({
  leaveTypes: [],
  loading: false,
  lastFetched: null,

  getLeaveTypesForTable: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    // Return cached data if still valid and not forcing refresh
    if (!forceRefresh && state.leaveTypes.length > 0 && state.lastFetched && (now - state.lastFetched) < CACHE_DURATION) {
      return state.leaveTypes;
    }

    // If already loading and not forcing refresh, return cached data (prevent duplicate requests)
    if (state.loading && !forceRefresh) {
      return state.leaveTypes.length > 0 ? state.leaveTypes : [];
    }

    // Fetch new data (includes both active and inactive)
    set({ loading: true });
    try {
      const data = await getLeaveTypes();
      set({ leaveTypes: data, loading: false, lastFetched: now });
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  clearCache: () => set({ leaveTypes: [], lastFetched: null }),
  refreshLeaveTypes: async () => await get().getLeaveTypesForTable(true),
}));

