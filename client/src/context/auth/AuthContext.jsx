// AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

import api from "../../api/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUser() {
            try {
                await api.get("/sanctum/csrf-cookie");
                const res = await api.get("/api/user");
                setUser(res.data.user); 
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }
        loadUser();
    }, []);

    const login = async (email, password) => {
        try {
            await api.get("/sanctum/csrf-cookie");
            const res = await api.post("/api/login", { email, password });
            setUser(res.data.user);
        } catch (err) {
            setUser(null);
            throw err;
        }
    };

    const register = async (name, email, password, role_id) => {
        try {
            await api.get("/sanctum/csrf-cookie");
             await api.post("/api/register", {name, email, password, role_id})
            // setUser(res.data);
        } catch (err) {
            // setUser(null);
            throw err;
        }
    }

    const logout = async () => {
        try {
            // Get CSRF cookie first
            await api.get("/sanctum/csrf-cookie");
            
            // Logout request
            await api.post("/api/logout", {}, { withCredentials: true });
        } catch (err) {
            console.error(err);
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
