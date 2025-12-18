import { create } from 'zustand';
import { getAttendance } from '../api/attendance/attendance';

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for attendance (changes frequently)

export const useAttendanceStore = create((set, get) => ({
  attendance: [],
  filters: {}, // Store current filters
  loading: false,
  lastFetched: null,
  error: null,

  // Get cached attendance or fetch if cache expired
  getAttendance: async (filters = {}, forceRefresh = false) => {
    const state = get();
    const now = Date.now();
    const filtersKey = JSON.stringify(filters);

    // Return cached data if filters match, cache is valid, and not forcing refresh
    if (
      !forceRefresh &&
      state.attendance.length >= 0 &&
      state.lastFetched &&
      (now - state.lastFetched) < CACHE_DURATION &&
      JSON.stringify(state.filters) === filtersKey
    ) {
      return state.attendance;
    }

    // Fetch new data
    set({ loading: true, error: null });
    try {
      const response = await getAttendance(filters);
      const data = response.attendances?.data || [];
      set({
        attendance: data,
        filters,
        loading: false,
        lastFetched: now,
        error: null,
      });
      return data;
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || 'Failed to load attendance',
      });
      throw error;
    }
  },

  // Clear cache
  clearCache: () => {
    set({
      attendance: [],
      filters: {},
      lastFetched: null,
    });
  },

  // Refresh attendance (force fetch)
  refreshAttendance: async (filters = {}) => {
    return await get().getAttendance(filters, true);
  },
}));



