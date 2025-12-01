import api from '../axios';

export const getPositions = async () => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/positions');
    return res.data.positions;
};

export const createPosition = async (positionData) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.post('/api/positions', positionData);
    return res.data;
};

export const updatePosition = async (id, positionData) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.put(`/api/positions/${id}`, positionData);
    return res.data;
};

export const deletePosition = async (id) => {
    await api.get("/sanctum/csrf-cookie");
    await api.delete(`/api/positions/${id}`);
};

