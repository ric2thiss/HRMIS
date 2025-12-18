import { create } from 'zustand';
import getAccounts from '../api/user/get_accounts';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for user accounts (changes occasionally)

export const useUserAccountsStore = create((set, get) => ({
  accounts: [],
  loading: false,
  lastFetched: null,
  error: null,

  // Get cached user accounts or fetch if cache expired
  getAccounts: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    // Return cached data if still valid and not forcing refresh
    if (
      !forceRefresh &&
      state.accounts.length > 0 &&
      state.lastFetched &&
      (now - state.lastFetched) < CACHE_DURATION
    ) {
      return state.accounts;
    }

    // Fetch new data
    set({ loading: true, error: null });
    try {
      const accounts = await getAccounts();
      set({
        accounts: accounts || [],
        loading: false,
        lastFetched: now,
        error: null,
      });
      return accounts || [];
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || 'Failed to load user accounts',
      });
      throw error;
    }
  },

  // Update a single account in cache (useful after edit)
  updateAccountInCache: (updatedAccount) => {
    const state = get();
    const updated = state.accounts.map(account =>
      account.id === updatedAccount.id ? updatedAccount : account
    );
    set({ accounts: updated });
  },

  // Add a new account to cache
  addAccountToCache: (newAccount) => {
    const state = get();
    set({ accounts: [...state.accounts, newAccount] });
  },

  // Remove an account from cache
  removeAccountFromCache: (accountId) => {
    const state = get();
    const filtered = state.accounts.filter(account => account.id !== accountId);
    set({ accounts: filtered });
  },

  // Clear cache (useful after CRUD operations or logout)
  clearCache: () => {
    set({
      accounts: [],
      lastFetched: null,
    });
  },

  // Refresh user accounts (force fetch)
  refreshAccounts: async () => {
    return await get().getAccounts(true);
  },
}));

