import api from '../axios';

/**
 * Get leave credits (remaining days) for the current user
 * @returns {Promise<Array>} Array of leave credits with remaining days per leave type
 */
export const getMyLeaveCredits = async () => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/leaves/my-leave-credits');
    return res.data.leave_credits || [];
};

