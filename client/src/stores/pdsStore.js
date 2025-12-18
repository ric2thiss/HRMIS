import { create } from 'zustand';
import { getMyPds } from '../api/pds/pds';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for PDS (user-specific, changes occasionally)

export const usePdsStore = create((set, get) => ({
  pds: null,
  loading: false,
  lastFetched: null,
  error: null,

  // Get cached PDS or fetch if cache expired
  getPds: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    // Return cached data if still valid and not forcing refresh
    if (
      !forceRefresh &&
      state.pds !== null &&
      state.lastFetched &&
      (now - state.lastFetched) < CACHE_DURATION
    ) {
      return state.pds;
    }

    // Fetch new data
    set({ loading: true, error: null });
    try {
      const pds = await getMyPds();
      set({
        pds,
        loading: false,
        lastFetched: now,
        error: null,
      });
      return pds;
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || 'Failed to load PDS',
        pds: null, // Set to null on error
      });
      throw error;
    }
  },

  // Set PDS (useful after update/create)
  setPds: (pds) => {
    set({
      pds,
      lastFetched: Date.now(),
    });
  },

  // Clear cache
  clearCache: () => {
    set({
      pds: null,
      lastFetched: null,
    });
  },

  // Refresh PDS (force fetch)
  refreshPds: async () => {
    return await get().getPds(true);
  },
}));



