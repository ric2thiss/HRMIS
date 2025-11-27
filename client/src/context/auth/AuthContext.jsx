// AuthContext.jsx
import { createContext, useContext, useEffect, useState, useRef } from "react";
import api from "../../api/axios";
import { Navigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Prevents interceptor from re-running during forced logout
    const isForceLoggingOut = useRef(false);

    // Prevent infinite redirection to /maintenance
    const isInMaintenanceRedirect = useRef(false);

    // ---------------------------------------
    // Axios Interceptor (Runs for ALL requests)
    // ---------------------------------------
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            response => response,
            async error => {
                const originalRequest = error.config;

                // Skip maintenance logic if flagged
                if (originalRequest?.headers?.["X-Skip-Interceptor"]) {
                    return Promise.reject(error);
                }

                // Only handle HTTP 503 errors
                if (error.response?.status === 503 && !originalRequest._retry) {
                    console.log("🚨 Maintenance mode detected!");

                    // --- Do NOT logout admin ---
                    if (user?.roles?.[0] === "admin") {
                        console.log("Admin detected. Skipping logout.");
                        return Promise.reject(error);
                    }

                    // --- Prevent double-trigger ---
                    if (isForceLoggingOut.current) {
                        return Promise.reject(error);
                    }
                    isForceLoggingOut.current = true;

                    // Force logout for non-admin user
                    originalRequest._retry = true;

                    try {
                        await api.post(
                            "/api/logout",
                            {},
                            {
                                withCredentials: true,
                                headers: { "X-Skip-Interceptor": "true" },
                            }
                        );
                    } catch (err) {
                        console.error("Logout during maintenance failed:", err);
                    }

                    setUser(null);

                    // Redirect to maintenance ONCE only
                    if (!isInMaintenanceRedirect.current) {
                        isInMaintenanceRedirect.current = true;
                        window.location.replace("/maintenance");
                        // <Navigate to="/maintenance" />
                    }

                    return Promise.reject(error);
                }

                return Promise.reject(error);
            }
        );

        return () => api.interceptors.response.eject(interceptor);
    }, [user]);


    // ---------------------------------------
    //  Load user at startup
    // ---------------------------------------
    useEffect(() => {
        async function loadUser() {
            try {
                await api.get("/sanctum/csrf-cookie", { withCredentials: true });
                const res = await api.get("/api/user", { withCredentials: true });
                setUser(res.data.user);
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }
        loadUser();
    }, []);


    // ---------------------------------------
    //  LOGIN
    // ---------------------------------------
    const login = async (email, password) => {
        try {
            await api.get("/sanctum/csrf-cookie");
            const res = await api.post("/api/login", { email, password }, { withCredentials: true });
            setUser(res.data.user);
        } catch (err) {
            setUser(null);
            throw err;
        }
    };


    // ---------------------------------------
    // REGISTER
    // ---------------------------------------
    const register = async (name, email, password, role_id) => {
        try {
            await api.get("/sanctum/csrf-cookie");
            await api.post("/api/register", { name, email, password, role_id }, { withCredentials: true });
        } catch (err) {
            throw err;
        }
    };


    // ---------------------------------------
    // LOGOUT (manual)
    // ---------------------------------------
    const logout = async () => {
        try {
            await api.get("/sanctum/csrf-cookie");
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
