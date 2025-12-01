import api from '../axios';

/**
 * Check if current user has a PDS
 * @returns {Promise<Object|null>} PDS object or null
 */
export const getMyPds = async () => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/pds/my-pds');
    return res.data.pds;
};

/**
 * Get all PDS (filtered by role - employee sees own, HR sees all)
 * @param {string|null} status - Filter by status ('draft', 'pending', 'approved', 'declined', null for all)
 * @returns {Promise<Object>} Response object with pds array
 */
export const getAllPds = async (status = null) => {
    await api.get("/sanctum/csrf-cookie");
    const params = status ? { status } : {};
    const res = await api.get('/api/pds', { params });
    return res.data;
};

/**
 * Get employees without PDS
 * @returns {Promise<Object>} Response object with employees array
 */
export const getEmployeesWithoutPds = async () => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/pds/employees/without-pds');
    return res.data;
};

/**
 * Notify employee to fill PDS
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Response object
 */
export const notifyEmployee = async (userId) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.post(`/api/pds/employees/${userId}/notify`);
    return res.data;
};

/**
 * Get a specific PDS by ID
 * @param {number} id - PDS ID
 * @returns {Promise<Object>} PDS object
 */
export const getPds = async (id) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get(`/api/pds/${id}`);
    return res.data.pds;
};

/**
 * Create a new PDS
 * @param {Object} formData - PDS form data
 * @returns {Promise<Object>} Created PDS object
 */
export const createPds = async (formData) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.post('/api/pds', { form_data: formData });
    return res.data.pds;
};

/**
 * Update an existing PDS
 * @param {number} id - PDS ID
 * @param {Object} formData - Updated PDS form data
 * @returns {Promise<Object>} Updated PDS object
 */
export const updatePds = async (id, formData) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.put(`/api/pds/${id}`, { form_data: formData });
    return res.data.pds;
};

/**
 * Submit PDS for approval
 * @param {number} id - PDS ID
 * @returns {Promise<Object>} Updated PDS object
 */
export const submitPds = async (id) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.post(`/api/pds/${id}/submit`);
    return res.data.pds;
};

/**
 * HR Review PDS (approve or decline)
 * @param {number} id - PDS ID
 * @param {string} action - 'approve' or 'decline'
 * @param {string} comments - Comments (required if declining)
 * @returns {Promise<Object>} Updated PDS object
 */
export const reviewPds = async (id, action, comments = null) => {
    await api.get("/sanctum/csrf-cookie");
    
    // Build request payload - only include comments if declining
    const payload = { action };
    if (action === 'decline' && comments) {
        payload.comments = comments;
    }
    
    const res = await api.post(`/api/pds/${id}/review`, payload);
    return res.data; // Return full response including notification
};

/**
 * Delete PDS
 * - Employees can only delete their own draft PDS
 * - HR/Admin can delete any PDS
 * @param {number} id - PDS ID
 * @returns {Promise<void>}
 */
export const deletePds = async (id) => {
    await api.get("/sanctum/csrf-cookie");
    await api.delete(`/api/pds/${id}`);
};

/**
 * Return PDS to owner (HR/Admin only)
 * Changes status back to draft so employee can update
 * @param {number} id - PDS ID
 * @returns {Promise<Object>} Updated PDS object
 */
export const returnPdsToOwner = async (id) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.post(`/api/pds/${id}/return`);
    return res.data;
};

