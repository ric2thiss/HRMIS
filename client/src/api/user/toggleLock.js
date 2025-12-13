import api from '../axios';

/**
 * Toggle account lock status
 * @param {number} userId - User ID to lock/unlock
 * @param {boolean} isLocked - Lock status (true to lock, false to unlock)
 * @returns {Promise<Object>} Updated user object
 */
const toggleLock = async (userId, isLocked) => {
    await api.get('/sanctum/csrf-cookie');

    const res = await api.put(
        `/api/users/${userId}/toggle-lock`,
        { is_locked: isLocked },
        { withCredentials: true }
    );

    return res.data.user;
};

export default toggleLock;

