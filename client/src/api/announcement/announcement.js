import api from '../axios';

/**
 * Get all announcements (for HR - includes all statuses)
 * @param {Object} filters - Optional filters (status, my_announcements)
 * @returns {Promise<Object>} Announcements list
 */
export const getAnnouncements = async (filters = {}) => {
    await api.get('/sanctum/csrf-cookie');

    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.my_announcements) params.append('my_announcements', filters.my_announcements);

    const response = await api.get(`/api/announcements?${params.toString()}`, {
        withCredentials: true,
    });

    return response.data;
};

/**
 * Get active announcements (for all users - shown on dashboard)
 * @param {boolean} includeOwn - Whether to include user's own announcements (for /my-announcements page)
 * @returns {Promise<Object>} Active announcements list
 */
export const getActiveAnnouncements = async (includeOwn = false) => {
    await api.get('/sanctum/csrf-cookie');

    const params = new URLSearchParams();
    if (includeOwn) {
        params.append('include_own', '1');
    }

    const response = await api.get(`/api/announcements/active?${params.toString()}`, {
        withCredentials: true,
    });

    return response.data;
};

/**
 * Get archived announcements (expired ones for HR)
 * @param {Object} filters - Optional filters (my_announcements)
 * @returns {Promise<Object>} Archived announcements list
 */
export const getArchivedAnnouncements = async (filters = {}) => {
    await api.get('/sanctum/csrf-cookie');

    const params = new URLSearchParams();
    if (filters.my_announcements) params.append('my_announcements', filters.my_announcements);

    const response = await api.get(`/api/announcements/archive?${params.toString()}`, {
        withCredentials: true,
    });

    return response.data;
};

/**
 * Get a single announcement
 * @param {number} id - Announcement ID
 * @returns {Promise<Object>} Announcement details
 */
export const getAnnouncement = async (id) => {
    await api.get('/sanctum/csrf-cookie');

    const response = await api.get(`/api/announcements/${id}`, {
        withCredentials: true,
    });

    return response.data;
};

/**
 * Create a new announcement
 * @param {Object} data - Announcement data (title, content, image, scheduled_at, duration_days)
 * @returns {Promise<Object>} Created announcement
 */
export const createAnnouncement = async (data) => {
    await api.get('/sanctum/csrf-cookie');

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    formData.append('scheduled_at', data.scheduled_at);
    formData.append('duration_days', data.duration_days);
    
    if (data.image) {
        formData.append('image', data.image);
    }
    
    // Add recipients if provided
    if (data.recipients !== undefined) {
        if (Array.isArray(data.recipients) && data.recipients.length > 0) {
            formData.append('recipients', JSON.stringify(data.recipients));
        } else {
            formData.append('recipients', JSON.stringify([]));
        }
    }

    const response = await api.post('/api/announcements', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
    });

    return response.data;
};

/**
 * Update an announcement
 * @param {number} id - Announcement ID
 * @param {Object} data - Updated announcement data
 * @returns {Promise<Object>} Updated announcement
 */
export const updateAnnouncement = async (id, data) => {
    await api.get('/sanctum/csrf-cookie');

    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);
    if (data.scheduled_at) formData.append('scheduled_at', data.scheduled_at);
    if (data.duration_days) formData.append('duration_days', data.duration_days);
    
    // Only append image if it's a new file (File object)
    if (data.image instanceof File) {
        formData.append('image', data.image);
    }
    
    // If remove_image flag is set, send it
    if (data.remove_image !== undefined) {
        formData.append('remove_image', data.remove_image ? '1' : '0');
    }
    
    // Add recipients if provided
    if (data.recipients !== undefined) {
        if (Array.isArray(data.recipients) && data.recipients.length > 0) {
            formData.append('recipients', JSON.stringify(data.recipients));
        } else {
            formData.append('recipients', JSON.stringify([]));
        }
    }

    const response = await api.put(`/api/announcements/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
    });

    return response.data;
};

/**
 * Delete an announcement
 * @param {number} id - Announcement ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteAnnouncement = async (id) => {
    await api.get('/sanctum/csrf-cookie');

    const response = await api.delete(`/api/announcements/${id}`, {
        withCredentials: true,
    });

    return response.data;
};

/**
 * Like or dislike an announcement
 * @param {number} id - Announcement ID
 * @param {string} reaction - 'like' or 'dislike'
 * @returns {Promise<Object>} Reaction result with counts
 */
export const reactToAnnouncement = async (id, reaction) => {
    // Get CSRF cookie only if we don't have it (check if it exists)
    // This avoids unnecessary request if cookie is already set
    try {
        await api.get('/sanctum/csrf-cookie', {
            withCredentials: true,
        });
    } catch (csrfError) {
        // If CSRF fails, continue anyway - the actual request will handle it
        console.warn('CSRF cookie fetch failed, continuing with request:', csrfError);
    }

    const response = await api.post(`/api/announcements/${id}/react`, {
        reaction: reaction
    }, {
        withCredentials: true,
    });

    return response.data;
};

/**
 * Get user's reaction to an announcement
 * @param {number} id - Announcement ID
 * @returns {Promise<Object>} User's reaction
 */
export const getUserReaction = async (id) => {
    await api.get('/sanctum/csrf-cookie');

    const response = await api.get(`/api/announcements/${id}/reaction`, {
        withCredentials: true,
    });

    return response.data;
};

