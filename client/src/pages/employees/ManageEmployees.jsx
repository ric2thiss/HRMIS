import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../hooks/useAuth";
import AppLayout from '../../components/Layout/AppLayout';
import EmployeeManager from '../../components/features/employees/EmployeeManager';
import LoadingScreen from '../../components/Loading/LoadingScreen';

function ManageEmployees() {
    const navigate = useNavigate();
    const { user, logout, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
            return;
        }

        if (user) {
            const role = user?.roles?.[0]?.name;
            if (role !== 'hr' && role !== 'admin') {
                navigate("/dashboard");
            }
        }
    }, [loading, user, navigate]);

    // Show full page loading only for initial auth check
    if (loading || !user) {
        return <LoadingScreen />;
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