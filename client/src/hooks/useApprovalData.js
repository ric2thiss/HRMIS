import { useQuery, useQueryClient } from '@tanstack/react-query';
import { checkIfApprover } from '../api/master-lists/approvalNames';
import { getMyPendingApprovals, getLeaveApplications } from '../api/leave/leaveApplications';
import { getAllPds } from '../api/pds/pds';
import { getAllMasterLists } from '../api/master-lists/masterLists';
import { getUserRole } from '../utils/userHelpers';

// Query keys for caching
export const approvalQueryKeys = {
  all: ['approvals'],
  isApprover: () => ['approvals', 'is-approver'],
  pendingLeaves: (role) => ['approvals', 'pending-leaves', role],
  pendingPds: () => ['approvals', 'pending-pds'],
  forRevisionPds: () => ['approvals', 'for-revision-pds'],
  masterLists: () => ['approvals', 'master-lists'],
  counts: () => ['approvals', 'counts'],
};

/**
 * Hook to check if user is an approver
 */
export const useIsApprover = (user) => {
  return useQuery({
    queryKey: approvalQueryKeys.isApprover(),
    queryFn: async () => {
      const role = getUserRole(user);
      // HR and Admin always have access
      if (role === 'hr' || role === 'admin') {
        return true;
      }
      // Check if user is an approver
      return await checkIfApprover();
    },
    enabled: !!user, // Only run if user exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch pending leave approvals
 * Automatically handles HR/Admin vs regular approver logic
 */
export const usePendingLeaveApprovals = (user) => {
  return useQuery({
    queryKey: approvalQueryKeys.pendingLeaves(getUserRole(user)),
    queryFn: async () => {
      const role = getUserRole(user);
      
      // If user is HR or Admin, get all pending approvals
      if (role === 'hr' || role === 'admin') {
        const response = await getLeaveApplications({ status: 'pending' });
        return response || [];
      } else {
        // For regular approvers, get only their assigned leave approvals
        const response = await getMyPendingApprovals();
        return response.leaves || [];
      }
    },
    enabled: !!user, // Only run if user exists
    staleTime: 0, // Real-time - no caching
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to fetch pending PDS approvals (HR/Admin only)
 */
export const usePendingPdsApprovals = (user) => {
  const role = getUserRole(user);
  const isHROrAdmin = role === 'hr' || role === 'admin';
  
  return useQuery({
    queryKey: approvalQueryKeys.pendingPds(),
    queryFn: async () => {
      const response = await getAllPds('pending');
      return response.pds || [];
    },
    enabled: !!user && isHROrAdmin, // Only run if user is HR/Admin
    staleTime: 0, // Always consider data stale - refetch on focus/invalidate
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount
  });
};

/**
 * Hook to fetch PDS for revision (HR/Admin only)
 */
export const useForRevisionPdsApprovals = (user) => {
  const role = getUserRole(user);
  const isHROrAdmin = role === 'hr' || role === 'admin';
  
  return useQuery({
    queryKey: approvalQueryKeys.forRevisionPds(),
    queryFn: async () => {
      const response = await getAllPds('for-revision');
      return response.pds || [];
    },
    enabled: !!user && isHROrAdmin, // Only run if user is HR/Admin
    staleTime: 0, // Always consider data stale - refetch on focus/invalidate
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount
  });
};

/**
 * Hook to fetch master lists (approval names)
 */
export const useMasterLists = (user) => {
  return useQuery({
    queryKey: approvalQueryKeys.masterLists(),
    queryFn: async () => {
      return await getAllMasterLists();
    },
    enabled: !!user, // Only run if user exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get approval counts
 */
export const useApprovalCounts = (user) => {
  const role = getUserRole(user);
  const isHROrAdmin = role === 'hr' || role === 'admin';
  
  const { data: leaveApprovals = [] } = usePendingLeaveApprovals(user);
  const { data: pdsApprovals = [] } = usePendingPdsApprovals(user);
  const { data: forRevisionPds = [] } = useForRevisionPdsApprovals(user);

  const counts = {
    leaveCount: leaveApprovals.length,
    pdsCount: isHROrAdmin ? pdsApprovals.length : 0,
    forRevisionCount: isHROrAdmin ? forRevisionPds.length : 0,
    totalCount: leaveApprovals.length + (isHROrAdmin ? pdsApprovals.length : 0),
  };

  return { counts };
};

/**
 * Hook to prefetch approval data
 * Call this before navigating to the my-approval page
 */
export const usePrefetchApprovalData = () => {
  const queryClient = useQueryClient();

  const prefetchApprovalData = async (user) => {
    if (!user) return;
    
    const role = getUserRole(user);
    const isHROrAdmin = role === 'hr' || role === 'admin';

    const prefetchPromises = [
      // Prefetch approver status check
      queryClient.prefetchQuery({
        queryKey: approvalQueryKeys.isApprover(),
        queryFn: async () => {
          if (isHROrAdmin) return true;
          return await checkIfApprover();
        },
        staleTime: 5 * 60 * 1000,
      }),
      
      // Prefetch pending leave approvals
      queryClient.prefetchQuery({
        queryKey: approvalQueryKeys.pendingLeaves(role),
        queryFn: async () => {
          if (isHROrAdmin) {
            const response = await getLeaveApplications({ status: 'pending' });
            return response || [];
          } else {
            const response = await getMyPendingApprovals();
            return response.leaves || [];
          }
        },
        staleTime: 5 * 60 * 1000,
      }),
      
      // Prefetch master lists
      queryClient.prefetchQuery({
        queryKey: approvalQueryKeys.masterLists(),
        queryFn: async () => await getAllMasterLists(),
        staleTime: 5 * 60 * 1000,
      }),
    ];

    // If HR/Admin, also prefetch PDS approvals (pending and for-revision)
    if (isHROrAdmin) {
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: approvalQueryKeys.pendingPds(),
          queryFn: async () => {
            const response = await getAllPds('pending');
            return response.pds || [];
          },
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: approvalQueryKeys.forRevisionPds(),
          queryFn: async () => {
            const response = await getAllPds('for-revision');
            return response.pds || [];
          },
          staleTime: 5 * 60 * 1000,
        })
      );
    }

    await Promise.all(prefetchPromises);
  };

  return { prefetchApprovalData };
};

/**
 * Hook to invalidate all approval queries (for use after mutations)
 */
export const useInvalidateApprovalQueries = () => {
  const queryClient = useQueryClient();

  const invalidateAllApprovalQueries = () => {
    // Invalidate all approval queries and force refetch of active ones
    queryClient.invalidateQueries({ 
      queryKey: approvalQueryKeys.all,
      refetchType: 'active' // Only refetch active queries
    });
  };

  return { invalidateAllApprovalQueries };
};

