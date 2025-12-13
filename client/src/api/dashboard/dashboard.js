import api from '../axios';

/**
 * Get daily login activity for a specific month
 * @param {number} year - Year (defaults to current year)
 * @param {number} month - Month (defaults to current month)
 * @returns {Promise<Object>} Response object with daily_logins array
 */
export const getDailyLoginActivity = async (year = null, month = null) => {
    await api.get("/sanctum/csrf-cookie");
    const params = {};
    if (year) params.year = year;
    if (month) params.month = month;
    
    const res = await api.get('/api/daily-login-activity', { params });
    return res.data;
};

/**
 * Get positions and employment distribution by office
 * @returns {Promise<Object>} Response object with offices array
 */
export const getPositionsByOffice = async () => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/positions-by-office');
    return res.data;
};

