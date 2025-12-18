import { create } from 'zustand';
import { getLeaveApplications } from '../api/leave/leaveApplications';

const CACHE_DURATION = 1 * 60 * 1000; // 1 minute for manage leave (changes frequently)

export const useManageLeaveStore = create((set, get) => ({
  allLeaves: [], // Store ALL leave applications
  loading: false,
  lastFetched: null,

  // Fetch all leave applications (no filter)
  getLeaveApplications: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    // Return cached data if:
    // 1. Cache is still valid (within 1 minute)
    // 2. Not forcing refresh
    if (
      !forceRefresh &&
      state.allLeaves.length >= 0 &&
      state.lastFetched &&
      (now - state.lastFetched) < CACHE_DURATION
    ) {
      return state.allLeaves;
    }

    // Fetch all data (no filter)
    set({ loading: true });
    try {
      const data = await getLeaveApplications({}); // Fetch ALL leaves
      set({
        allLeaves: data,
        loading: false,
        lastFetched: now,
      });
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  // Update a single leave application in cache
  updateLeaveInCache: (updatedLeave) => {
    const state = get();
    const updated = state.allLeaves.map(leave =>
      leave.id === updatedLeave.id ? updatedLeave : leave
    );
    set({ allLeaves: updated });
  },

  // Clear cache (useful after approval/rejection or logout)
  clearCache: () => {
    set({
      allLeaves: [],
      lastFetched: null,
    });
  },

  // Refresh leave applications (force fetch)
  refreshLeaveApplications: async () => {
    return await get().getLeaveApplications(true);
  },
}));

