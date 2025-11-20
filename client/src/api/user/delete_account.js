import api from '../axios'

const admin_delete_account_user = async(id) => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.delete(`/api/users/${id}`);
    return res.data.user
}

export default admin_delete_account_user;