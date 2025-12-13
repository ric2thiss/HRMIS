import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppLayout from '../../components/Layout/AppLayout';
import Dashboard from '../../components/features/dashboard/Dashboard';
import LoadingScreen from '../../components/Loading/LoadingScreen';
import { getUserRole } from '../../utils/userHelpers';

function HrDashboard() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      const role = getUserRole(user);
      if (role !== 'hr') {
        navigate("/dashboard");
      }
    }
  }, [loading, user, navigate]);

  // Show full page loading only for initial auth check
  if (loading || !user) {
    return <LoadingScreen />;
  }

  const role = getUserRole(user);
  if (role !== 'hr') {
    return null;
  }

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="HR Dashboard">
      <Dashboard />
    </AppLayout>
  );
}

export default HrDashboard;

