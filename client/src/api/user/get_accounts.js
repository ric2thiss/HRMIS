import api from '../axios';

/**
 * Get all user accounts
 * @returns {Promise<Array>} Array of user objects
 */
const getAccounts = async () => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/users');
    
    return res.data.users || [];
};

export default getAccounts;