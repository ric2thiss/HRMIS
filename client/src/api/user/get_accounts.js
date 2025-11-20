import api from '../axios'

const get_accounts = async() => {
    await api.get("/sanctum/csrf-cookie");
    const res = await api.get('/api/users')
    console.log(res.data.user);
    
    return res.data.user
}

export default get_accounts;