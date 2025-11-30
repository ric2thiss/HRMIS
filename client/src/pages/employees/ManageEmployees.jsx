import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/auth/AuthContext";
import AppLayout from '../../components/Layout/AppLayout';
import EmployeeManager from '../../components/features/employees/EmployeeManager';

function ManageEmployees() {
    const navigate = useNavigate();
    const { user, logout, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
            return;
        }

        const role = user?.roles?.[0]?.name;
        if (role !== 'hr' && role !== 'admin') {
            navigate("/dashboard");
        }
    }, [loading, user, navigate]);

    if (loading || !user) {
        return null;
    }

    const role = user?.roles?.[0]?.name;
    if (role !== 'hr' && role !== 'admin') {
        return null;
    }

    return (
        <AppLayout user={user} logout={logout} loading={loading} title="Manage Employees">
            <EmployeeManager />
        </AppLayout>
    );
}

export default ManageEmployees;