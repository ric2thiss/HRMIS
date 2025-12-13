import api from '../axios';

/**
 * Update current user's profile
 * @param {Object} data - Update data
 * @param {string} [data.first_name] - User's first name (HR/Admin only)
 * @param {string} [data.middle_initial] - User's middle initial (HR/Admin only)
 * @param {string} [data.last_name] - User's last name (HR/Admin only)
 * @param {string} [data.name] - User's name
 * @param {string} [data.email] - User's email
 * @param {string} [data.password] - New password (optional)
 * @param {string} [data.current_password] - Current password (required if changing password)
 * @param {string} [data.profile_image] - Base64 encoded profile image (optional)
 * @param {string} [data.signature] - Base64 encoded signature (optional)
 * @returns {Promise<Object>} Updated user object
 */
const updateProfile = async ({ first_name, middle_initial, last_name, name, email, password, current_password, profile_image, signature }) => {
    await api.get('/sanctum/csrf-cookie');

    const payload = {};
    
    if (first_name !== undefined) payload.first_name = first_name;
    if (middle_initial !== undefined) payload.middle_initial = middle_initial;
    if (last_name !== undefined) payload.last_name = last_name;
    if (name) payload.name = name;
    if (email) payload.email = email;
    if (password) {
        payload.password = password;
        payload.current_password = current_password;
    }
    if (profile_image !== undefined) payload.profile_image = profile_image;
    if (signature !== undefined) payload.signature = signature;

    const res = await api.put('/api/profile', payload);

    return res.data.user;
};

export default updateProfile;

