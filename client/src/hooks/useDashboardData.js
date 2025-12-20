import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { getAllPds, getEmployeesWithoutPds } from '../api/pds/pds';
import { getDailyLoginActivity, getPositionsByOffice } from '../api/dashboard/dashboard';
import { getModuleUsage } from '../api/modules/moduleAccess';
import { getSystemVersion } from '../api/system/maintenance-mode';
import { getAttendanceStatistics } from '../api/attendance/standardTime';

// Query keys for caching
export const dashboardQueryKeys = {
  all: ['dashboard'],
  employees: () => ['dashboard', 'employees'],
  pdsChart: () => ['dashboard', 'pds-chart'],
  loginActivity: (year, month) => ['dashboard', 'login-activity', year, month],
  moduleUsage: (year, month) => ['dashboard', 'module-usage', year, month],
  positionsByOffice: () => ['dashboard', 'positions-by-office'],
  systemVersion: () => ['dashboard', 'system-version'],
  attendanceStatistics: (startDate, endDate) => ['dashboard', 'attendance-statistics', startDate, endDate],
};

/**
 * Hook to fetch employees count (total, plantilla, JO)
 */
export const useEmployeesCount = () => {
  return useQuery({
    queryKey: dashboardQueryKeys.employees(),
    queryFn: async () => {
      await api.get("/sanctum/csrf-cookie", { withCredentials: true });
      const response = await api.get("/api/employees", { withCredentials: true });
      
      return {
        total_employees: response.data?.total_employees || 0,
        total_plantilla: response.data?.total_plantilla || 0,
        total_jo: response.data?.total_jo || 0,
      };
    },
    staleTime: 30 * 1000, // 30 seconds - real-time data
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

/**
 * Hook to fetch PDS chart data
 */
export const usePdsChartData = () => {
  return useQuery({
    queryKey: dashboardQueryKeys.pdsChart(),
    queryFn: async () => {
      // Fetch all PDS and employees without PDS in parallel
      const [pdsResponse, noPdsResponse] = await Promise.all([
        getAllPds(),
        getEmployeesWithoutPds().catch(() => ({ employees: [] })), // Handle error gracefully
      ]);
      
      const allPds = pdsResponse.pds || [];
      const noPdsEmployees = noPdsResponse.employees || [];
      
      // Count PDS by status
      const draftCount = allPds.filter(pds => !pds.status || pds.status === 'draft').length;
      const approvedCount = allPds.filter(pds => pds.status === 'approved').length;
      const forApprovalCount = allPds.filter(pds => pds.status === 'pending').length;
      const forRevisionCount = allPds.filter(pds => pds.status === 'for-revision').length;
      const declinedCount = allPds.filter(pds => pds.status === 'declined').length;
      const noPdsCount = noPdsEmployees.length;
      
      return [
        { name: 'Draft', value: draftCount, color: '#9C27B0' },
        { name: 'Approved', value: approvedCount, color: '#FDD835' },
        { name: 'For Approval', value: forApprovalCount, color: '#2196F3' },
        { name: 'For Revision', value: forRevisionCount, color: '#FF7043' },
        { name: 'Declined', value: declinedCount, color: '#E53935' },
        { name: 'No PDS', value: noPdsCount, color: '#4CAF50' },
      ];
    },
    staleTime: 30 * 1000, // 30 seconds - real-time data
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

/**
 * Hook to fetch daily login activity
 */
export const useDailyLoginActivity = (year = null, month = null) => {
  return useQuery({
    queryKey: dashboardQueryKeys.loginActivity(year, month),
    queryFn: async () => {
      const response = await getDailyLoginActivity(year, month);
      return response.daily_logins || [];
    },
    staleTime: 60 * 1000, // 1 minute - less frequently changing
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

/**
 * Hook to fetch module usage
 */
export const useModuleUsage = (year = null, month = null) => {
  return useQuery({
    queryKey: dashboardQueryKeys.moduleUsage(year, month),
    queryFn: async () => {
      const response = await getModuleUsage(year, month);
      return response.modules || [];
    },
    staleTime: 60 * 1000, // 1 minute - less frequently changing
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

/**
 * Hook to fetch positions by office
 */
export const usePositionsByOffice = () => {
  return useQuery({
    queryKey: dashboardQueryKeys.positionsByOffice(),
    queryFn: async () => {
      const response = await getPositionsByOffice();
      const offices = response.offices || [];
      
      // Add display label (use code if available, otherwise use name or "N/A")
      return offices.map(office => ({
        ...office,
        displayLabel: office.office_code || office.office || 'N/A'
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - relatively static data
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

/**
 * Hook to fetch system version
 */
export const useSystemVersion = () => {
  return useQuery({
    queryKey: dashboardQueryKeys.systemVersion(),
    queryFn: async () => {
      return await getSystemVersion();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - very static
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus - version rarely changes
    refetchOnMount: false, // Don't refetch on mount if cached
  });
};

/**
 * Hook to fetch attendance statistics
 */
export const useAttendanceStatistics = (startDate = null, endDate = null) => {
  return useQuery({
    queryKey: dashboardQueryKeys.attendanceStatistics(startDate, endDate),
    queryFn: async () => {
      const filters = {};
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;
      return await getAttendanceStatistics(filters);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - relatively static
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

/**
 * Hook to prefetch dashboard data
 */
export const usePrefetchDashboardData = () => {
  const queryClient = useQueryClient();

  const prefetchDashboardData = async () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Prefetch all dashboard data in parallel
    await Promise.allSettled([
      // Employees count
      queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.employees(),
        queryFn: async () => {
          await api.get("/sanctum/csrf-cookie", { withCredentials: true });
          const response = await api.get("/api/employees", { withCredentials: true });
          return {
            total_employees: response.data?.total_employees || 0,
            total_plantilla: response.data?.total_plantilla || 0,
            total_jo: response.data?.total_jo || 0,
          };
        },
        staleTime: 30 * 1000,
      }),
      
      // PDS chart data
      queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.pdsChart(),
        queryFn: async () => {
          const [pdsResponse, noPdsResponse] = await Promise.all([
            getAllPds(),
            getEmployeesWithoutPds().catch(() => ({ employees: [] })),
          ]);
          
          const allPds = pdsResponse.pds || [];
          const noPdsEmployees = noPdsResponse.employees || [];
          
          const draftCount = allPds.filter(pds => !pds.status || pds.status === 'draft').length;
          const approvedCount = allPds.filter(pds => pds.status === 'approved').length;
          const forApprovalCount = allPds.filter(pds => pds.status === 'pending').length;
          const forRevisionCount = allPds.filter(pds => pds.status === 'for-revision').length;
          const declinedCount = allPds.filter(pds => pds.status === 'declined').length;
          const noPdsCount = noPdsEmployees.length;
          
          return [
            { name: 'Draft', value: draftCount, color: '#9C27B0' },
            { name: 'Approved', value: approvedCount, color: '#FDD835' },
            { name: 'For Approval', value: forApprovalCount, color: '#2196F3' },
            { name: 'For Revision', value: forRevisionCount, color: '#FF7043' },
            { name: 'Declined', value: declinedCount, color: '#E53935' },
            { name: 'No PDS', value: noPdsCount, color: '#4CAF50' },
          ];
        },
        staleTime: 30 * 1000,
      }),
      
      // Daily login activity
      queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.loginActivity(currentYear, currentMonth),
        queryFn: async () => {
          const response = await getDailyLoginActivity(currentYear, currentMonth);
          return response.daily_logins || [];
        },
        staleTime: 60 * 1000,
      }),
      
      // Module usage
      queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.moduleUsage(currentYear, currentMonth),
        queryFn: async () => {
          const response = await getModuleUsage(currentYear, currentMonth);
          return response.modules || [];
        },
        staleTime: 60 * 1000,
      }),
      
      // Positions by office
      queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.positionsByOffice(),
        queryFn: async () => {
          const response = await getPositionsByOffice();
          const offices = response.offices || [];
          return offices.map(office => ({
            ...office,
            displayLabel: office.office_code || office.office || 'N/A'
          }));
        },
        staleTime: 2 * 60 * 1000,
      }),
      
      // System version
      queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.systemVersion(),
        queryFn: async () => await getSystemVersion(),
        staleTime: 10 * 60 * 1000,
      }),
    ]);
  };

  return { prefetchDashboardData };
};

/**
 * Hook to invalidate dashboard queries (for real-time updates)
 */
export const useInvalidateDashboardQueries = () => {
  const queryClient = useQueryClient();

  const invalidateDashboardQueries = () => {
    queryClient.invalidateQueries({ 
      queryKey: dashboardQueryKeys.all,
      refetchType: 'active'
    });
  };

  return { invalidateDashboardQueries };
};

