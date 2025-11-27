import api from '../axios';

const admin_update_account_user = async (id, { name, email, password, role_id }) => {
    // Sanctum session auth
    await api.get('/sanctum/csrf-cookie');

    const payload = { name, email, role_id };
    if (password) payload.password = password; 

    const res = await api.put(`/api/users/${id}`, payload);

    return res.data.user; 
};

export default admin_update_account_user;
