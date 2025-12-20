import { QueryClient } from '@tanstack/react-query';

// Create a QueryClient instance with caching configuration
// Optimized caching strategy: static data cached longer, real-time data cached shorter
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default staleTime: 30 seconds for real-time data
      // Static data (master lists, roles, etc.) should override with longer staleTime
      staleTime: 30 * 1000, // 30 seconds - balance between freshness and performance
      // Keep unused data in cache for 10 minutes before garbage collection
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Refetch on window focus (but only if data is stale)
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Refetch on mount only if data is stale
      refetchOnMount: 'always', // Changed to always for better UX
      // Retry failed requests twice
      retry: 2,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Network mode: prefer cache but refetch in background
      networkMode: 'online',
    },
  },
});

