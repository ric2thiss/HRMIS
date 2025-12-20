import { create } from 'zustand';
import { getAnnouncements } from '../api/announcement/announcement';

const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes cache duration (middle of 1-5 mins range)

export const useAnnouncementsStore = create((set, get) => ({
  announcements: [],
  filters: {}, // Store current filters
  loading: false,
  lastFetched: null,
  error: null,

  // Get cached announcements or fetch if cache expired
  getAnnouncements: async (filters = {}, forceRefresh = false) => {
    const state = get();
    const now = Date.now();
    const filtersKey = JSON.stringify(filters);

    // Return cached data if filters match, cache is valid, and not forcing refresh
    if (
      !forceRefresh &&
      state.announcements.length > 0 &&
      state.lastFetched &&
      (now - state.lastFetched) < CACHE_DURATION &&
      JSON.stringify(state.filters) === filtersKey
    ) {
      return state.announcements;
    }

    // Fetch new data
    set({ loading: true, error: null });
    try {
      const response = await getAnnouncements(filters);
      const data = response.announcements || [];
      set({
        announcements: data,
        filters,
        loading: false,
        lastFetched: now,
        error: null,
      });
      return data;
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || 'Failed to load announcements',
      });
      throw error;
    }
  },

  // Add or update an announcement in cache
  updateAnnouncementInCache: (updatedAnnouncement) => {
    const state = get();
    const exists = state.announcements.some(a => a.id === updatedAnnouncement.id);
    if (exists) {
      // Update existing announcement
      const updated = state.announcements.map(announcement =>
        announcement.id === updatedAnnouncement.id ? updatedAnnouncement : announcement
      );
      set({ announcements: updated });
    } else {
      // Add new announcement if it doesn't exist
      set({ announcements: [updatedAnnouncement, ...state.announcements] });
    }
  },

  // Add a new announcement to cache
  addAnnouncementToCache: (newAnnouncement) => {
    const state = get();
    // Check if announcement already exists (avoid duplicates)
    const exists = state.announcements.some(a => a.id === newAnnouncement.id);
    if (!exists) {
      set({ announcements: [newAnnouncement, ...state.announcements] });
    }
  },

  // Remove an announcement from cache
  removeAnnouncementFromCache: (announcementId) => {
    const state = get();
    const filtered = state.announcements.filter(announcement => announcement.id !== announcementId);
    set({ announcements: filtered });
  },

  // Clear cache
  clearCache: () => {
    set({
      announcements: [],
      filters: {},
      lastFetched: null,
    });
  },

  // Refresh announcements (force fetch)
  refreshAnnouncements: async (filters = null) => {
    const state = get();
    // Use current filters if none provided
    const filtersToUse = filters !== null ? filters : state.filters;
    return await get().getAnnouncements(filtersToUse, true);
  },
}));

