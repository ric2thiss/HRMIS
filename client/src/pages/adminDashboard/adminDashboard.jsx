import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppLayout from '../../components/Layout/AppLayout';
import ApprovalList from '../../components/features/approval/ApprovalList';
import AdminDashboard from '../../components/features/dashboard/Dashboard'

function adminDashboard() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      const role = user?.roles?.[0]?.name;
      if (role !== 'hr') {
        navigate("/dashboard");
      }
    }
  }, [loading, user, navigate]);

  // Show full page loading only for initial auth check
  if (loading || !user) {
    return null;
  }

  const role = user?.roles?.[0]?.name;
  if (role !== 'hr') {
    return null;
  }

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="Admin Dashboard">
      {/* <ApprovalList /> */}
      <AdminDashboard />
    </AppLayout>
  );
}

export default adminDashboard;

