import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Navigate } from "react-router-dom";
import api from "../../api/axios";
import LoadingScreen from "../../components/Loading/LoadingScreen";

export default function MaintenanceMode() {
    const [loading, setLoading] = useState(true);
    const [isMaintenance, setIsMaintenance] = useState(false);

    useEffect(() => {
        async function verify() {
            try {
                const res = await api.get("/api/maintenance/status");
                if (res.data.is_enabled) {
                    setIsMaintenance(true);
                } else {
                    setIsMaintenance(false);
                }
            } catch (error) {
                console.error("Error checking maintenance:", error);
                setIsMaintenance(false);
            } finally {
                setLoading(false);
            }
        }

        verify();
    }, []);

    if (loading) return <LoadingScreen />;

    // If system is not in maintenance, redirect to login
    if (!isMaintenance) return <Navigate to="/login" replace />;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
            <div className="bg-white shadow-xl rounded-2xl p-10 max-w-md text-center">
                <div className="flex justify-center mb-4">
                    <AlertTriangle size={60} className="text-yellow-500" />
                </div>

                <h1 className="text-3xl font-bold text-gray-800 mb-3">
                    System Under Maintenance
                </h1>

                <p className="text-gray-600 mb-6 leading-relaxed">
                    The system is temporarily unavailable while we perform important updates.
                </p>

                <div className="text-sm text-gray-500">
                    — Admin Team
                </div>
            </div>
        </div>
    );
}
