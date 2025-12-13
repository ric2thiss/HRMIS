import api from '../axios';

/**
 * Get all approval names
 */
export const getApprovalNames = async () => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/approval-names');
    return res.data.approval_names || [];
};

/**
 * Create a new approval name
 */
export const createApprovalName = async (data) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.post('/api/approval-names', data);
    return res.data.approval_name;
};

/**
 * Update an approval name
 */
export const updateApprovalName = async (id, data) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.put(`/api/approval-names/${id}`, data);
    return res.data.approval_name;
};

/**
 * Delete an approval name
 */
export const deleteApprovalName = async (id) => {
    await api.get("/sanctum/csrf-cookie");
    await api.delete(`/api/approval-names/${id}`);
};

/**
 * Check if the current user is an approver
 */
export const checkIfApprover = async () => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/approval-names/check-approver');
    return res.data.is_approver || false;
};

