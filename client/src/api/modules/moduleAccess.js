import api from '../axios';

/**
 * Log module access
 * @param {string} moduleName - Name of the module (e.g., 'Leave', 'DTRAS', 'PDS')
 * @param {string} modulePath - Route path (optional)
 * @returns {Promise<Object>} Response object
 */
export const logModuleAccess = async (moduleName, modulePath = null) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.post('/api/module-access/log', {
        module_name: moduleName,
        module_path: modulePath,
    }, { withCredentials: true });
    return res.data;
};

/**
 * Get module usage statistics for a specific month
 * Returns modules sorted by most used (total access counts)
 * @param {number} year - Year (defaults to current year)
 * @param {number} month - Month (defaults to current month)
 * @returns {Promise<Object>} Response object with modules array containing {module, total_users, total_accesses}
 */
export const getModuleUsage = async (year = null, month = null) => {
    await api.get("/sanctum/csrf-cookie");
    const params = {};
    if (year) params.year = year;
    if (month) params.month = month;
    
    const res = await api.get('/api/module-usage', { params });
    return res.data;
};

