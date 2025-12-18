import { create } from 'zustand';
import { getMyLeaveApplications } from '../api/leave/leaveApplications';

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for leave applications (changes more frequently)

export const useLeaveApplicationsStore = create((set, get) => ({
  leaveApplications: [],
  filters: {}, // Store current filters
  loading: false,
  lastFetched: null,
  error: null,

  // Get cached leave applications or fetch if cache expired
  getLeaveApplications: async (filters = {}, forceRefresh = false) => {
    const state = get();
    const now = Date.now();
    const filtersKey = JSON.stringify(filters);

    // Return cached data if filters match, cache is valid, and not forcing refresh
    if (
      !forceRefresh &&
      state.leaveApplications.length >= 0 &&
      state.lastFetched &&
      (now - state.lastFetched) < CACHE_DURATION &&
      JSON.stringify(state.filters) === filtersKey
    ) {
      return state.leaveApplications;
    }

    // Fetch new data
    set({ loading: true, error: null });
    try {
      const data = await getMyLeaveApplications(filters);
      set({
        leaveApplications: data,
        filters,
        loading: false,
        lastFetched: now,
        error: null,
      });
      return data;
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || 'Failed to load leave applications',
      });
      throw error;
    }
  },

  // Add or update a leave application in cache
  updateLeaveApplicationInCache: (updatedLeave) => {
    const state = get();
    const updated = state.leaveApplications.map(leave =>
      leave.id === updatedLeave.id ? updatedLeave : leave
    );
    set({ leaveApplications: updated });
  },

  // Remove a leave application from cache
  removeLeaveApplicationFromCache: (leaveId) => {
    const state = get();
    const filtered = state.leaveApplications.filter(leave => leave.id !== leaveId);
    set({ leaveApplications: filtered });
  },

  // Clear cache
  clearCache: () => {
    set({
      leaveApplications: [],
      filters: {},
      lastFetched: null,
    });
  },

  // Refresh leave applications (force fetch)
  refreshLeaveApplications: async (filters = {}) => {
    return await get().getLeaveApplications(filters, true);
  },
}));



