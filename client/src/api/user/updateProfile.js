import api from '../axios';

/**
 * Update current user's profile
 * @param {Object} data - Update data
 * @param {string} data.name - User's name
 * @param {string} data.email - User's email
 * @param {string} [data.password] - New password (optional)
 * @param {string} [data.current_password] - Current password (required if changing password)
 * @param {string} [data.profile_image] - Base64 encoded profile image (optional)
 * @returns {Promise<Object>} Updated user object
 */
const updateProfile = async ({ name, email, password, current_password, profile_image }) => {
    await api.get('/sanctum/csrf-cookie');

    const payload = {};
    
    if (name) payload.name = name;
    if (email) payload.email = email;
    if (password) {
        payload.password = password;
        payload.current_password = current_password;
    }
    if (profile_image) payload.profile_image = profile_image;

    const res = await api.put('/api/profile', payload);

    return res.data.user;
};

export default updateProfile;

