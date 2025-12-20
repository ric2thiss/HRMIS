import api from '../axios';

/**
 * Get all notifications for the current user
 * @param {Object} filters - Optional filters (is_read, type, entity_type, per_page)
 * @returns {Promise<Object>} Notifications list with pagination
 */
export const getNotifications = async (filters = {}) => {
    await api.get('/sanctum/csrf-cookie');

    const params = new URLSearchParams();
    if (filters.is_read !== undefined) params.append('is_read', filters.is_read);
    if (filters.type) params.append('type', filters.type);
    if (filters.entity_type) params.append('entity_type', filters.entity_type);
    if (filters.per_page) params.append('per_page', filters.per_page);
    if (filters.page) params.append('page', filters.page);

    const response = await api.get(`/api/notifications?${params.toString()}`, {
        withCredentials: true,
    });

    return response.data;
};

/**
 * Get a single notification by ID
 * @param {number} id - Notification ID
 * @returns {Promise<Object>} Notification object
 */
export const getNotification = async (id) => {
    await api.get('/sanctum/csrf-cookie');

    const response = await api.get(`/api/notifications/${id}`, {
        withCredentials: true,
    });

    return response.data;
};

/**
 * Get unread notifications count
 * @returns {Promise<Object>} Unread count
 */
export const getUnreadCount = async () => {
    await api.get('/sanctum/csrf-cookie');

    const response = await api.get('/api/notifications/unread-count', {
        withCredentials: true,
    });

    return response.data;
};

/**
 * Mark a notification as read
 * @param {number} id - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
export const markAsRead = async (id) => {
    await api.get('/sanctum/csrf-cookie');

    const response = await api.put(`/api/notifications/${id}/read`, {}, {
        withCredentials: true,
    });

    return response.data;
};

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} Result with updated count
 */
export const markAllAsRead = async () => {
    await api.get('/sanctum/csrf-cookie');

    const response = await api.put('/api/notifications/mark-all-read', {}, {
        withCredentials: true,
    });

    return response.data;
};

/**
 * Delete a notification
 * @param {number} id - Notification ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteNotification = async (id) => {
    await api.get('/sanctum/csrf-cookie');

    const response = await api.delete(`/api/notifications/${id}`, {
        withCredentials: true,
    });

    return response.data;
};

/**
 * Delete all read notifications
 * @returns {Promise<Object>} Result with deleted count
 */
export const deleteAllRead = async () => {
    await api.get('/sanctum/csrf-cookie');

    const response = await api.delete('/api/notifications/delete-read', {
        withCredentials: true,
    });

    return response.data;
};

