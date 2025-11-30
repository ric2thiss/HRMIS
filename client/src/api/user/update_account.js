import api from '../axios';

/**
 * Update a user account
 * @param {number} userId - User ID to update
 * @param {Object} data - Update data
 * @param {string} data.name - User's name
 * @param {string} data.email - User's email
 * @param {string} [data.password] - User's password (optional)
 * @param {number} data.roleId - Role ID
 * @returns {Promise<Object>} Updated user object
 */
const updateAccount = async (userId, { name, email, password, roleId }) => {
    await api.get('/sanctum/csrf-cookie');

    const payload = { 
        name, 
        email, 
        role_id: roleId 
    };
    
    if (password) {
        payload.password = password;
    }

    const res = await api.put(`/api/users/${userId}`, payload);

    return res.data.user;
};

export default updateAccount;
