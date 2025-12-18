import { create } from 'zustand';
import { getApprovalNames } from '../api/master-lists/approvalNames';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for approval names

export const useApprovalNamesTableStore = create((set, get) => ({
  approvalNames: [],
  loading: false,
  lastFetched: null,

  getApprovalNames: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    // Return cached data if still valid and not forcing refresh
    if (!forceRefresh && state.approvalNames.length > 0 && state.lastFetched && (now - state.lastFetched) < CACHE_DURATION) {
      return state.approvalNames;
    }

    // Fetch new data
    set({ loading: true });
    try {
      const data = await getApprovalNames();
      set({ approvalNames: data, loading: false, lastFetched: now });
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  clearCache: () => set({ approvalNames: [], lastFetched: null }),
  refreshApprovalNames: async () => await get().getApprovalNames(true),
}));

