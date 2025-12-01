import api from '../axios';

/**
 * Get all master lists in one call (for dropdowns)
 */
export const getAllMasterLists = async () => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/master-lists');
    return res.data;
};

