import api from '../axios';

export const getSpecialCapabilities = async () => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/special-capabilities');
    return res.data.capabilities;
};

export const createSpecialCapability = async (capabilityData) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.post('/api/special-capabilities', capabilityData);
    return res.data;
};

export const updateSpecialCapability = async (id, capabilityData) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.put(`/api/special-capabilities/${id}`, capabilityData);
    return res.data;
};

export const deleteSpecialCapability = async (id) => {
    await api.get("/sanctum/csrf-cookie");
    await api.delete(`/api/special-capabilities/${id}`);
};

