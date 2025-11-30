import api from '../axios';

/**
 * Get maintenance mode status
 * @returns {Promise<Object>} Maintenance mode status
 */
const getMaintenanceStatus = async () => {
    const res = await api.get('/api/maintenance-mode');
    return res.data;
};

/**
 * Update maintenance mode
 * @param {boolean} isEnabled - Whether maintenance mode is enabled
 * @param {string} message - Maintenance message
 * @param {string[]} allowedLoginRoles - Array of role names allowed to login during maintenance
 * @returns {Promise<Object>} Response data
 */
const updateMaintenanceMode = async (isEnabled, message, allowedLoginRoles = []) => {
    await api.get('/sanctum/csrf-cookie');
    const res = await api.put('/api/maintenance-mode', {
        is_enabled: isEnabled,
        message: message,
        allowed_login_roles: allowedLoginRoles,
    });
    return res.data;
};

export { getMaintenanceStatus, updateMaintenanceMode };