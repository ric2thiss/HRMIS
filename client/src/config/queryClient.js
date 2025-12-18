import { QueryClient } from '@tanstack/react-query';

// Create a QueryClient instance with caching configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Keep unused data in cache for 5 minutes before garbage collection
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      // Retry failed requests once
      retry: 1,
      // Retry delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

