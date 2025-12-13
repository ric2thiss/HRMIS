import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppLayout from '../../components/Layout/AppLayout';
import AdminDashboardComponent from '../../components/features/adminDashboard/AdminDashboard';
import LoadingScreen from '../../components/Loading/LoadingScreen';
import { getUserRole } from '../../utils/userHelpers';

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      const role = getUserRole(user);
      if (role !== 'admin') {
        navigate("/dashboard");
      }
    }
  }, [loading, user, navigate]);

  // Show full page loading only for initial auth check
  if (loading || !user) {
    return <LoadingScreen />;
  }

  const role = getUserRole(user);
  if (role !== 'admin') {
    return null;
  }

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="Admin Dashboard">
      <AdminDashboardComponent />
    </AppLayout>
  );
}

export default AdminDashboard;

