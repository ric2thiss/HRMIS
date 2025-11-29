// import api from '../axios'

// const admin_create_account_user = async(name, email, password, role_id, employment_type_id) => {
//     await api.get("/sanctum/csrf-cookie");
//     const res = await api.post('/api/register', {name, email, password, role_id, employment_type_id})
//     return res.data.user
// }

// export default admin_create_account_user;

import api from '../axios';

const admin_create_account_user = async (name, email, password, role_id, employment_type_id) => {
    try {
        // Get CSRF cookie
        await api.get("/sanctum/csrf-cookie");

        // POST request with credentials
        const res = await api.post(
            '/api/register',
            { name, email, password, role_id, employment_type_id },
            { withCredentials: true } // important for cookie-based auth
        );

        return res.data.user;
    } catch (err) {
        console.error("API Validation Error:", err.response?.data || err.message);
        throw err; // re-throw so calling code can handle it
    }
};

export default admin_create_account_user;
