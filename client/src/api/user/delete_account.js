import api from '../axios';

/**
 * Delete a user account
 * @param {number} userId - User ID to delete
 * @returns {Promise<Object>} Response data
 */
const deleteAccount = async (userId) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.delete(`/api/users/${userId}`);
    return res.data;
};

export default deleteAccount;