import { create } from 'zustand';
import { getMyLeaveCredits } from '../api/leave/leaveCredits';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const useLeaveCreditsStore = create((set, get) => ({
  leaveCredits: [],
  loading: false,
  lastFetched: null,
  error: null,

  // Get cached leave credits or fetch if cache expired
  getLeaveCredits: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    // Return cached data if still valid and not forcing refresh
    if (
      !forceRefresh &&
      state.leaveCredits.length > 0 &&
      state.lastFetched &&
      (now - state.lastFetched) < CACHE_DURATION
    ) {
      return state.leaveCredits;
    }

    // Fetch new data
    set({ loading: true, error: null });
    try {
      const credits = await getMyLeaveCredits();
      set({
        leaveCredits: credits,
        loading: false,
        lastFetched: now,
        error: null,
      });
      return credits;
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || 'Failed to load leave credits',
      });
      throw error;
    }
  },

  // Get only VL, SL, SPL for hero section
  getHeroLeaveCredits: () => {
    const state = get();
    const heroCredits = {
      VL: { remaining: 0, name: 'VACATION LEAVE' },
      SL: { remaining: 0, name: 'SICK LEAVE' },
      SPL: { remaining: 0, name: 'SPECIAL LEAVE' },
    };

    state.leaveCredits.forEach((credit) => {
      if (credit.code === 'VL' || credit.code === 'SL' || credit.code === 'SPL') {
        heroCredits[credit.code] = {
          remaining: credit.remaining_days,
          name: credit.name.toUpperCase(),
        };
      }
    });

    return heroCredits;
  },

  // Get other leave credits (excluding VL, SL, SPL)
  getOtherLeaveCredits: () => {
    const state = get();
    return state.leaveCredits.filter(
      (credit) => credit.code !== 'VL' && credit.code !== 'SL' && credit.code !== 'SPL'
    );
  },

  // Clear cache (useful after submitting a leave application)
  clearCache: () => {
    set({
      leaveCredits: [],
      lastFetched: null,
    });
  },

  // Refresh leave credits (force fetch)
  refreshLeaveCredits: async () => {
    return await get().getLeaveCredits(true);
  },
}));

