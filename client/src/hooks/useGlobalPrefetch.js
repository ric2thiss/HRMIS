import { useQueryClient } from '@tanstack/react-query';
import { getUserRole } from '../utils/userHelpers';

// Import all API functions
import { getAllPds, getEmployeesWithoutPds } from '../api/pds/pds';
import { getMyPendingApprovals, getLeaveApplications } from '../api/leave/leaveApplications';
import { getAllMasterLists } from '../api/master-lists/masterLists';
import { checkIfApprover } from '../api/master-lists/approvalNames';
import { useEmployeesStore } from '../stores/employeesStore';

// Import query keys
import { pdsQueryKeys } from './usePdsData';
import { approvalQueryKeys } from './useApprovalData';
import { dashboardQueryKeys } from './useDashboardData';

/**
 * Global prefetch hook - prefetches all critical data after login
 * This runs in the background to populate cache for all modules
 */
export const useGlobalPrefetch = () => {
  const queryClient = useQueryClient();

  /**
   * Prefetch all data based on user role
   * Runs after login to cache everything users might need
   */
  const prefetchAllData = async (user) => {
    if (!user) return;

    const role = getUserRole(user);
    const isHROrAdmin = role === 'hr' || role === 'admin';

    console.log('🚀 Starting global data prefetch for role:', role);

    try {
      // Create an array of prefetch promises
      const prefetchPromises = [];

      // ===================================
      // MASTER LISTS (All Users)
      // ===================================
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: approvalQueryKeys.masterLists(),
          queryFn: async () => await getAllMasterLists(),
          staleTime: 10 * 60 * 1000, // 10 minutes for master lists
        })
      );

      // ===================================
      // HR/ADMIN SPECIFIC DATA
      // ===================================
      if (isHROrAdmin) {
        // 1. Employees Data (with caching)
        prefetchPromises.push(
          // Prefetch employees using the store (will use cache if available)
          Promise.resolve().then(async () => {
            try {
              const { getEmployees } = useEmployeesStore.getState();
              await getEmployees();
            } catch (err) {
              console.warn('Failed to prefetch employees:', err);
            }
          })
        );

        // 2. PDS Management Data
        prefetchPromises.push(
          // All PDS
          queryClient.prefetchQuery({
            queryKey: pdsQueryKeys.list(null),
            queryFn: async () => {
              const response = await getAllPds(null);
              return response.pds || [];
            },
            staleTime: 5 * 60 * 1000,
          }),
          // Pending PDS
          queryClient.prefetchQuery({
            queryKey: pdsQueryKeys.list('pending'),
            queryFn: async () => {
              const response = await getAllPds('pending');
              return response.pds || [];
            },
            staleTime: 5 * 60 * 1000,
          }),
          // Employees without PDS
          queryClient.prefetchQuery({
            queryKey: pdsQueryKeys.noPds(),
            queryFn: async () => {
              const response = await getEmployeesWithoutPds();
              return response.employees || [];
            },
            staleTime: 5 * 60 * 1000,
          })
        );

        // 3. Approval/Leave Management Data
        prefetchPromises.push(
          // Pending leave approvals
          queryClient.prefetchQuery({
            queryKey: approvalQueryKeys.pendingLeaves(role),
            queryFn: async () => {
              const response = await getLeaveApplications({ status: 'pending' });
              return response || [];
            },
            staleTime: 5 * 60 * 1000,
          }),
          // Pending PDS approvals
          queryClient.prefetchQuery({
            queryKey: approvalQueryKeys.pendingPds(),
            queryFn: async () => {
              const response = await getAllPds('pending');
              return response.pds || [];
            },
            staleTime: 5 * 60 * 1000,
          }),
          // For Revision PDS approvals
          queryClient.prefetchQuery({
            queryKey: approvalQueryKeys.forRevisionPds(),
            queryFn: async () => {
              const response = await getAllPds('for-revision');
              return response.pds || [];
            },
            staleTime: 5 * 60 * 1000,
          })
        );

        // 4. Dashboard Data (HR/Admin)
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        prefetchPromises.push(
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
          })
        );

        console.log('✅ Prefetching HR/Admin specific data...');
      }

      // ===================================
      // REGULAR EMPLOYEE/APPROVER DATA
      // ===================================
      if (!isHROrAdmin) {
        // Check if user is an approver
        prefetchPromises.push(
          queryClient.prefetchQuery({
            queryKey: approvalQueryKeys.isApprover(),
            queryFn: async () => await checkIfApprover(),
            staleTime: 5 * 60 * 1000,
          })
        );

        // If user might be an approver, prefetch their approvals
        prefetchPromises.push(
          queryClient.prefetchQuery({
            queryKey: approvalQueryKeys.pendingLeaves(role),
            queryFn: async () => {
              try {
                const response = await getMyPendingApprovals();
                return response.leaves || [];
              } catch (err) {
                // User might not be an approver, that's okay
                return [];
              }
            },
            staleTime: 5 * 60 * 1000,
          })
        );

        console.log('✅ Prefetching employee/approver data...');
      }

      // ===================================
      // COMMON DATA (All Users)
      // ===================================
      // My Leave Credits, My Leave Applications, etc. can be added here
      // Example:
      // prefetchPromises.push(
      //   queryClient.prefetchQuery({
      //     queryKey: ['my-leave-credits'],
      //     queryFn: async () => await getMyLeaveCredits(),
      //     staleTime: 5 * 60 * 1000,
      //   })
      // );

      // Execute all prefetch operations in parallel
      await Promise.allSettled(prefetchPromises);

      console.log('✅ Global prefetch completed successfully!');
      console.log(`📦 Cached ${prefetchPromises.length} queries`);
    } catch (error) {
      console.error('❌ Error during global prefetch:', error);
      // Don't throw - prefetch failures shouldn't block the app
    }
  };

  /**
   * Prefetch data for a specific module
   * Can be called when hovering over nav items
   */
  const prefetchModule = async (moduleName, user) => {
    if (!user) return;

    const role = getUserRole(user);
    const isHROrAdmin = role === 'hr' || role === 'admin';

    switch (moduleName) {
      case 'manage-pds':
        if (isHROrAdmin) {
          await Promise.allSettled([
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
        }
        break;

      case 'my-approval':
        const approvalPrefetches = [
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
        ];
        
        if (isHROrAdmin) {
          approvalPrefetches.push(
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
        
        await Promise.allSettled(approvalPrefetches);
        break;

      case 'hr-dashboard':
        if (isHROrAdmin) {
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth() + 1;
          
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
        }
        break;

      // Add more modules as needed
      default:
        break;
    }
  };

  /**
   * Clear all cached data
   * Called on logout
   */
  const clearAllCache = () => {
    queryClient.clear();
    console.log('🗑️ All cache cleared');
  };

  return {
    prefetchAllData,
    prefetchModule,
    clearAllCache,
  };
};

