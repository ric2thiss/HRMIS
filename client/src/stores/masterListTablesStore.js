import { create } from 'zustand';
import { getPositions } from '../api/master-lists/positions';
import { getRoles } from '../api/master-lists/roles';
import { getProjects } from '../api/master-lists/projects';
import { getOffices } from '../api/master-lists/offices';
import { getSpecialCapabilities } from '../api/master-lists/specialCapabilities';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for master list tables

// Positions Store
export const usePositionsTableStore = create((set, get) => ({
  positions: [],
  loading: false,
  lastFetched: null,

  getPositions: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    if (!forceRefresh && state.positions.length > 0 && state.lastFetched && (now - state.lastFetched) < CACHE_DURATION) {
      return state.positions;
    }

    set({ loading: true });
    try {
      const data = await getPositions();
      set({ positions: data, loading: false, lastFetched: now });
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  clearCache: () => set({ positions: [], lastFetched: null }),
  refreshPositions: async () => await get().getPositions(true),
}));

// Roles Store
export const useRolesTableStore = create((set, get) => ({
  roles: [],
  loading: false,
  lastFetched: null,

  getRoles: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    if (!forceRefresh && state.roles.length > 0 && state.lastFetched && (now - state.lastFetched) < CACHE_DURATION) {
      return state.roles;
    }

    set({ loading: true });
    try {
      const data = await getRoles();
      set({ roles: data, loading: false, lastFetched: now });
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  clearCache: () => set({ roles: [], lastFetched: null }),
  refreshRoles: async () => await get().getRoles(true),
}));

// Projects Store
export const useProjectsTableStore = create((set, get) => ({
  projects: [],
  loading: false,
  lastFetched: null,

  getProjects: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    if (!forceRefresh && state.projects.length > 0 && state.lastFetched && (now - state.lastFetched) < CACHE_DURATION) {
      return state.projects;
    }

    set({ loading: true });
    try {
      const data = await getProjects();
      set({ projects: data, loading: false, lastFetched: now });
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  clearCache: () => set({ projects: [], lastFetched: null }),
  refreshProjects: async () => await get().getProjects(true),
}));

// Offices Store
export const useOfficesTableStore = create((set, get) => ({
  offices: [],
  loading: false,
  lastFetched: null,

  getOffices: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    if (!forceRefresh && state.offices.length > 0 && state.lastFetched && (now - state.lastFetched) < CACHE_DURATION) {
      return state.offices;
    }

    set({ loading: true });
    try {
      const data = await getOffices();
      set({ offices: data, loading: false, lastFetched: now });
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  clearCache: () => set({ offices: [], lastFetched: null }),
  refreshOffices: async () => await get().getOffices(true),
}));

// Special Capabilities Store
export const useCapabilitiesTableStore = create((set, get) => ({
  capabilities: [],
  loading: false,
  lastFetched: null,

  getCapabilities: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    if (!forceRefresh && state.capabilities.length > 0 && state.lastFetched && (now - state.lastFetched) < CACHE_DURATION) {
      return state.capabilities;
    }

    set({ loading: true });
    try {
      const data = await getSpecialCapabilities();
      set({ capabilities: data, loading: false, lastFetched: now });
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  clearCache: () => set({ capabilities: [], lastFetched: null }),
  refreshCapabilities: async () => await get().getCapabilities(true),
}));

