import { create } from 'zustand';
import api from '../api/axios';
import { getAllPds } from '../api/pds/pds';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for employees (changes occasionally)

/**
 * Calculate PDS completion percentage based on filled fields
 */
const calculatePdsCompletion = (formData) => {
    if (!formData) return 0;

    const fields = [
        // Personal Information
        'surname', 'firstName', 'dateOfBirth', 'placeOfBirth', 'sex', 'civilStatus',
        'mobileNo', 'emailAddress',
        // Address
        'resHouseNo', 'resBarangay', 'resCity', 'resProvince',
        // Family
        'fatherSurname', 'fatherFirstName', 'motherSurname', 'motherFirstName',
        // Education (at least one)
        'education',
        // References (at least one)
        'refName1',
    ];

    let filledCount = 0;
    let totalCount = fields.length;

    fields.forEach(field => {
        if (field === 'education') {
            // Check if at least one education entry has school
            const hasEducation = formData.education?.some(edu => edu.school && edu.school.trim() !== '');
            if (hasEducation) filledCount++;
        } else if (field === 'refName1') {
            // Check if at least one reference has name
            if (formData.refName1 && formData.refName1.trim() !== '') filledCount++;
        } else {
            const value = formData[field];
            if (value !== null && value !== undefined && value !== '' && value !== false) {
                filledCount++;
            }
        }
    });

    return Math.round((filledCount / totalCount) * 100);
};

export const useEmployeesStore = create((set, get) => ({
  employees: [],
  loading: false,
  lastFetched: null,
  error: null,

  // Get cached employees or fetch if cache expired
  getEmployees: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    // Return cached data if still valid and not forcing refresh
    if (
      !forceRefresh &&
      state.employees.length > 0 &&
      state.lastFetched &&
      (now - state.lastFetched) < CACHE_DURATION
    ) {
      return state.employees;
    }

    // Fetch new data
    set({ loading: true, error: null });
    try {
      await api.get("/sanctum/csrf-cookie");

      // Fetch employees and PDS data in parallel
      const [employeesRes, pdsRes] = await Promise.all([
        api.get("/api/users"),
        getAllPds()
      ]);

      const employeesData = employeesRes.data.users || [];
      const pdsData = pdsRes.pds || [];

      // Create a map of user_id to PDS for quick lookup
      const pdsMap = {};
      pdsData.forEach(pds => {
        if (pds.user_id) {
          pdsMap[pds.user_id] = pds;
        }
      });

      // Enrich employees with PDS completion percentage
      const enrichedEmployees = employeesData.map(employee => {
        const pds = pdsMap[employee.id];
        const completion = pds?.form_data ? calculatePdsCompletion(pds.form_data) : 0;
        
        // Get initials
        const firstName = employee.first_name || '';
        const lastName = employee.last_name || '';
        const initials = firstName && lastName 
          ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
          : employee.name ? employee.name.substring(0, 2).toUpperCase() : 'NA';

        // Format role name (Title Case)
        const roleName = employee.role?.name || employee.roles?.[0]?.name || '';
        const formattedRole = roleName 
          ? roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase()
          : 'N/A';

        return {
          ...employee,
          initials,
          role: formattedRole,
          percentage: completion,
          pdsStatus: pds?.status || 'no-pds',
          pdsId: pds?.id || null
        };
      });

      set({
        employees: enrichedEmployees,
        loading: false,
        lastFetched: now,
        error: null,
      });
      return enrichedEmployees;
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.message || 'Failed to load employees',
      });
      throw error;
    }
  },

  // Update a single employee in cache (useful after edit)
  updateEmployeeInCache: (updatedEmployee) => {
    const state = get();
    
    // Recalculate PDS completion if needed
    // Note: This assumes the updated employee might have PDS data
    // If PDS data is updated separately, you may need to refetch
    
    const updated = state.employees.map(employee => {
      if (employee.id === updatedEmployee.id) {
        // Preserve enriched data (initials, percentage, etc.)
        const firstName = updatedEmployee.first_name || employee.first_name || '';
        const lastName = updatedEmployee.last_name || employee.last_name || '';
        const initials = firstName && lastName 
          ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
          : updatedEmployee.name ? updatedEmployee.name.substring(0, 2).toUpperCase() : employee.initials || 'NA';

        const roleName = updatedEmployee.role?.name || updatedEmployee.roles?.[0]?.name || employee.role?.name || employee.roles?.[0]?.name || '';
        const formattedRole = roleName 
          ? roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase()
          : employee.role || 'N/A';

        return {
          ...updatedEmployee,
          initials,
          role: formattedRole,
          percentage: employee.percentage || 0, // Preserve existing percentage
          pdsStatus: employee.pdsStatus || 'no-pds',
          pdsId: employee.pdsId || null
        };
      }
      return employee;
    });
    set({ employees: updated });
  },

  // Add a new employee to cache
  addEmployeeToCache: (newEmployee) => {
    const state = get();
    
    // Enrich new employee with same logic
    const firstName = newEmployee.first_name || '';
    const lastName = newEmployee.last_name || '';
    const initials = firstName && lastName 
      ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
      : newEmployee.name ? newEmployee.name.substring(0, 2).toUpperCase() : 'NA';

    const roleName = newEmployee.role?.name || newEmployee.roles?.[0]?.name || '';
    const formattedRole = roleName 
      ? roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase()
      : 'N/A';

    const enriched = {
      ...newEmployee,
      initials,
      role: formattedRole,
      percentage: 0,
      pdsStatus: 'no-pds',
      pdsId: null
    };
    
    set({ employees: [...state.employees, enriched] });
  },

  // Remove an employee from cache
  removeEmployeeFromCache: (employeeId) => {
    const state = get();
    const filtered = state.employees.filter(employee => employee.id !== employeeId);
    set({ employees: filtered });
  },

  // Clear cache (useful after logout)
  clearCache: () => {
    set({
      employees: [],
      lastFetched: null,
      error: null,
    });
  },

  // Refresh employees (force fetch)
  refreshEmployees: async () => {
    return await get().getEmployees(true);
  },
}));

