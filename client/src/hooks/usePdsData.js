import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllPds, getEmployeesWithoutPds } from '../api/pds/pds';

// Query keys for caching
export const pdsQueryKeys = {
  all: ['pds'],
  list: (statusFilter) => ['pds', 'list', statusFilter],
  counts: () => ['pds', 'counts'],
  noPds: () => ['pds', 'no-pds'],
};

/**
 * Hook to fetch all PDS with optional status filter
 */
export const useAllPds = (statusFilter = null) => {
  return useQuery({
    queryKey: pdsQueryKeys.list(statusFilter),
    queryFn: async () => {
      const response = await getAllPds(statusFilter);
      return response.pds || [];
    },
    staleTime: 0, // Always consider stale - refetch on invalidate/WebSocket events
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

/**
 * Hook to fetch employees without PDS
 */
export const useEmployeesWithoutPds = () => {
  return useQuery({
    queryKey: pdsQueryKeys.noPds(),
    queryFn: async () => {
      const response = await getEmployeesWithoutPds();
      return response.employees || [];
    },
    staleTime: 0, // Real-time - no caching
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to get all counts (for badges)
 * This fetches all PDS data and computes counts on the client
 */
export const usePdsCounts = () => {
  const { data: allPds = [], isLoading } = useAllPds(null);
  const { data: noPdsEmployees = [] } = useEmployeesWithoutPds();

  const counts = {
    allPdsCount: allPds.length,
    pendingCount: allPds.filter(pds => pds.status === 'pending').length,
    forRevisionCount: allPds.filter(pds => pds.status === 'for-revision' || pds.status === 'declined').length,
    approvedCount: allPds.filter(pds => pds.status === 'approved').length,
    declinedCount: allPds.filter(pds => pds.status === 'declined').length,
    noPdsCount: noPdsEmployees.length,
  };

  return { counts, isLoading };
};

/**
 * Hook to prefetch PDS data
 * Call this before navigating to the manage-pds page
 */
export const usePrefetchPdsData = () => {
  const queryClient = useQueryClient();

  const prefetchPdsData = async () => {
    // Prefetch all PDS data
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: pdsQueryKeys.list(null),
        queryFn: async () => {
          const response = await getAllPds(null);
          return response.pds || [];
        },
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: pdsQueryKeys.noPds(),
        queryFn: async () => {
          const response = await getEmployeesWithoutPds();
          return response.employees || [];
        },
        staleTime: 5 * 60 * 1000,
      }),
    ]);
  };

  return { prefetchPdsData };
};

/**
 * Hook to invalidate all PDS queries (for use after mutations)
 */
export const useInvalidatePdsQueries = () => {
  const queryClient = useQueryClient();

  const invalidateAllPdsQueries = () => {
    // Invalidate all PDS queries and force refetch of active ones
    queryClient.invalidateQueries({ 
      queryKey: pdsQueryKeys.all,
      refetchType: 'active' // Only refetch active queries
    });
  };

  return { invalidateAllPdsQueries };
};

