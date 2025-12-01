import api from '../axios';

/**
 * Toggle system settings access for HR user (Admin only)
 * @param {number} userId - User ID
 * @param {boolean} hasAccess - Whether to grant or revoke access
 * @returns {Promise<Object>} Updated user object
 */
const toggleSystemSettingsAccess = async (userId, hasAccess) => {
    await api.get('/sanctum/csrf-cookie');
    const res = await api.put(`/api/users/${userId}/toggle-system-settings-access`, {
        has_system_settings_access: hasAccess
    });
    return res.data.user;
};

export default toggleSystemSettingsAccess;

