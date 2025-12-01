import api from '../axios';

export const getRoles = async () => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/roles');
    return res.data.roles;
};

export const createRole = async (roleData) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.post('/api/roles', roleData);
    return res.data;
};

export const updateRole = async (id, roleData) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.put(`/api/roles/${id}`, roleData);
    return res.data;
};

export const deleteRole = async (id) => {
    await api.get("/sanctum/csrf-cookie");
    await api.delete(`/api/roles/${id}`);
};

