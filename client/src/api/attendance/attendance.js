import api from '../axios';

/**
 * Import attendance from CSV file
 * @param {File} file - CSV file to import
 * @returns {Promise<Object>} Import result with statistics
 */
export const importAttendance = async (file) => {
    await api.get('/sanctum/csrf-cookie');

    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/attendance/import', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
    });

    return response.data;
};

/**
 * Get attendance records
 * @param {Object} filters - Optional filters (user_id, start_date, end_date, employee_id, per_page, page)
 * @returns {Promise<Object>} Paginated attendance records
 */
export const getAttendance = async (filters = {}) => {
    await api.get('/sanctum/csrf-cookie');

    const params = new URLSearchParams();
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.employee_id) params.append('employee_id', filters.employee_id);
    if (filters.per_page) params.append('per_page', filters.per_page);
    if (filters.page) params.append('page', filters.page);

    const response = await api.get(`/api/attendance?${params.toString()}`, {
        withCredentials: true,
    });

    return response.data;
};

/**
 * Get import history with pagination
 * @param {Object} filters - Optional filters (per_page, page)
 * @returns {Promise<Object>} Paginated import history records
 */
export const getImportHistory = async (filters = {}) => {
    await api.get('/sanctum/csrf-cookie');

    const params = new URLSearchParams();
    if (filters.per_page) params.append('per_page', filters.per_page);
    if (filters.page) params.append('page', filters.page);

    const response = await api.get(`/api/attendance/import-history?${params.toString()}`, {
        withCredentials: true,
    });

    return response.data;
};

/**
 * Undo/Delete attendance records by filename
 * @param {string} filename - Name of the imported file to undo
 * @returns {Promise<Object>} Result with deleted count
 */
export const undoImport = async (filename) => {
    await api.get('/sanctum/csrf-cookie');

    const response = await api.delete('/api/attendance/undo-import', {
        data: { filename },
        withCredentials: true,
    });

    return response.data;
};

