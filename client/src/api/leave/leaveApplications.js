import api from '../axios';

/**
 * Get all leave applications (filtered by user role)
 * @param {Object} params - Query parameters (status, user_id)
 * @returns {Promise<Array>} Array of leave applications
 */
export const getLeaveApplications = async (params = {}) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/leaves', { params });
    return res.data.leaves || [];
};

/**
 * Get leave applications for the current user
 * @param {Object} params - Query parameters (status)
 * @returns {Promise<Array>} Array of leave applications
 */
export const getMyLeaveApplications = async (params = {}) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/leaves/my-leaves', { params });
    return res.data.leaves || [];
};

/**
 * Get a specific leave application by ID
 * @param {number} id - Leave application ID
 * @returns {Promise<Object>} Leave application object
 */
export const getLeaveApplication = async (id) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get(`/api/leaves/${id}`);
    return res.data.leave;
};

/**
 * Create a new leave application
 * @param {Object} data - Leave application data
 * @returns {Promise<Object>} Created leave application
 */
export const createLeaveApplication = async (data) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.post('/api/leaves', data);
    return res.data.leave;
};

/**
 * Update a leave application (cancel only)
 * @param {number} id - Leave application ID
 * @param {Object} data - Update data (status: 'cancelled')
 * @returns {Promise<Object>} Updated leave application
 */
export const updateLeaveApplication = async (id, data) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.put(`/api/leaves/${id}`, data);
    return res.data.leave;
};

/**
 * Delete a leave application (pending only)
 * @param {number} id - Leave application ID
 * @returns {Promise<void>}
 */
export const deleteLeaveApplication = async (id) => {
    await api.get("/sanctum/csrf-cookie");
    await api.delete(`/api/leaves/${id}`);
};

/**
 * Approve or reject a leave application (HR/Admin only)
 * @param {number} id - Leave application ID
 * @param {Object} data - Approval data (status: 'approved' | 'rejected', approval_remarks)
 * @returns {Promise<Object>} Updated leave application
 */
export const approveLeaveApplication = async (id, data) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.post(`/api/leaves/${id}/approve`, data);
    return res.data.leave;
};

/**
 * Get all leave types
 * @returns {Promise<Array>} Array of leave types
 */
export const getLeaveTypes = async () => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/leave-types');
    return res.data.leave_types || [];
};

/**
 * Get pending approvals for the current approver
 * @returns {Promise<Object>} Object with leaves and pds arrays
 */
export const getMyPendingApprovals = async () => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/leaves/my-pending-approvals');
    return {
        leaves: res.data.leaves || [],
        pds: res.data.pds || []
    };
};

