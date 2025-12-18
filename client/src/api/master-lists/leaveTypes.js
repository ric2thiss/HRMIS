import api from '../axios';

export const getLeaveTypes = async () => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/leave-types');
    return res.data.leave_types;
};

export const createLeaveType = async (leaveTypeData) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.post('/api/leave-types', leaveTypeData);
    return res.data;
};

export const updateLeaveType = async (id, leaveTypeData) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.put(`/api/leave-types/${id}`, leaveTypeData);
    return res.data;
};

export const deleteLeaveType = async (id) => {
    await api.get("/sanctum/csrf-cookie");
    await api.delete(`/api/leave-types/${id}`);
};

