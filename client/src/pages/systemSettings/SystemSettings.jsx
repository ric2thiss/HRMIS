import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../hooks/useAuth";
import AppLayout from '../../components/Layout/AppLayout';
import SystemSettingsComponent from '../../components/features/system/SystemSettings';
import { hasSystemSettingsAccess } from '../../utils/userHelpers';

function SystemSettingsPage() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user && !hasSystemSettingsAccess(user)) {
      navigate("/dashboard");
    }
  }, [loading, user, navigate]);

  // Show full page loading only for initial auth check
  if (loading || !user) {
    return null;
  }

  if (!hasSystemSettingsAccess(user)) {
    return null;
  }

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="System Settings">
      <SystemSettingsComponent />
    </AppLayout>
  );
}

export default SystemSettingsPage;

