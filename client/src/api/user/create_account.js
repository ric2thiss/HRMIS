import api from '../axios'

const admin_create_account_user = async(name, email, password, role_id) => {
    const res = await api.post('/api/register', {name, email, password, role_id})
    return res.data.user
}

export default admin_create_account_user;