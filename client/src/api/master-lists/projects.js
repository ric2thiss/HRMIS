import api from '../axios';

export const getProjects = async () => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/projects');
    return res.data.projects;
};

export const createProject = async (projectData) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.post('/api/projects', projectData);
    return res.data;
};

export const updateProject = async (id, projectData) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.put(`/api/projects/${id}`, projectData);
    return res.data;
};

export const deleteProject = async (id) => {
    await api.get("/sanctum/csrf-cookie");
    await api.delete(`/api/projects/${id}`);
};

