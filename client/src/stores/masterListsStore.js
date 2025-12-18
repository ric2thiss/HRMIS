import { create } from 'zustand';
import { getAllMasterLists } from '../api/master-lists/masterLists';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for master lists (rarely change)

export const useMasterListsStore = create((set, get) => ({
  masterLists: {
    positions: [],
    roles: [],
    projects: [],
    offices: [],
    special_capabilities: [],
    approval_names: [],
  },
  loading: false,
  lastFetched: null,
  error: null,

  // Get cached master lists or fetch if cache expired
  getMasterLists: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    // Return cached data if still valid and not forcing refresh
    if (
      !forceRefresh &&
      state.masterLists.positions.length > 0 &&
      state.lastFetched &&
      (now - state.lastFetched) < CACHE_DURATION
    ) {
      return state.masterLists;
    }

    // Fetch new data
    set({ loading: true, error: null });
    try {
      const data = await getAllMasterLists();
      const masterLists = {
        positions: data.positions || [],
        roles: data.roles || [],
        projects: data.projects || [],
        offices: data.offices || [],
        special_capabilities: data.special_capabilities || [],
        approval_names: data.approval_names || [],
      };
      set({
        masterLists,
        loading: false,
        lastFetched: now,
        error: null,
      });
      return masterLists;
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || 'Failed to load master lists',
      });
      throw error;
    }
  },

  // Get specific master list (cached)
  getPositions: () => {
    return get().masterLists.positions;
  },

  getRoles: () => {
    return get().masterLists.roles;
  },

  getProjects: () => {
    return get().masterLists.projects;
  },

  getOffices: () => {
    return get().masterLists.offices;
  },

  getSpecialCapabilities: () => {
    return get().masterLists.special_capabilities;
  },

  getApprovalNames: () => {
    return get().masterLists.approval_names;
  },

  // Clear cache (useful after CRUD operations)
  clearCache: () => {
    set({
      masterLists: {
        positions: [],
        roles: [],
        projects: [],
        offices: [],
        special_capabilities: [],
        approval_names: [],
      },
      lastFetched: null,
    });
  },

  // Refresh master lists (force fetch)
  refreshMasterLists: async () => {
    return await get().getMasterLists(true);
  },
}));



