import api from '../axios';

export const getOffices = async () => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/offices');
    return res.data.offices;
};

export const createOffice = async (officeData) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.post('/api/offices', officeData);
    return res.data;
};

export const updateOffice = async (id, officeData) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.put(`/api/offices/${id}`, officeData);
    return res.data;
};

export const deleteOffice = async (id) => {
    await api.get("/sanctum/csrf-cookie");
    await api.delete(`/api/offices/${id}`);
};

