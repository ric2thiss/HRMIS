import api from '../axios';

/**
 * Create a new user account
 * @param {string} name - User's full name
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {number} roleId - Role ID to assign
 * @param {number} employmentTypeId - Employment type ID
 * @returns {Promise<Object>} Created user object
 */
const createAccount = async (name, email, password, roleId, employmentTypeId) => {
    await api.get("/sanctum/csrf-cookie");

    const res = await api.post(
        '/api/register',
        { 
            name, 
            email, 
            password, 
            role_id: roleId, 
            employment_type_id: employmentTypeId 
        },
        { withCredentials: true }
    );

    return res.data.user;
};

export default createAccount;
