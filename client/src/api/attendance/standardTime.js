import api from '../axios';

/**
 * Get standard time settings
 * @returns {Promise<Object>} Standard time settings (time_in, time_out)
 */
export const getStandardTimeSettings = async () => {
    await api.get('/sanctum/csrf-cookie');
    const response = await api.get('/api/standard-time-settings', {
        withCredentials: true,
    });
    return response.data;
};

/**
 * Update standard time settings
 * @param {Object} settings - { time_in: '08:00:00', time_out: '17:00:00' }
 * @returns {Promise<Object>} Updated settings
 */
export const updateStandardTimeSettings = async (settings) => {
    await api.get('/sanctum/csrf-cookie');
    const response = await api.put('/api/standard-time-settings', settings, {
        withCredentials: true,
    });
    return response.data;
};

/**
 * Get attendance statistics
 * @param {Object} filters - Optional filters (start_date, end_date)
 * @returns {Promise<Object>} Attendance statistics
 */
export const getAttendanceStatistics = async (filters = {}) => {
    await api.get('/sanctum/csrf-cookie');
    
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    
    const response = await api.get(`/api/attendance/statistics?${params.toString()}`, {
        withCredentials: true,
    });
    return response.data;
};

