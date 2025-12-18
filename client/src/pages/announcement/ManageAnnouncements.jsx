import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppLayout from '../../components/Layout/AppLayout';
import AnnouncementManager from '../../components/features/announcement/AnnouncementManager';
import LoadingScreen from '../../components/Loading/LoadingScreen';

function ManageAnnouncements() {
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

  if (loading || !user) {
    return <LoadingScreen />;
  }

  const role = user?.roles?.[0]?.name;
  if (role !== 'hr' && role !== 'admin') {
    return null;
  }

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="Manage Announcements">
      <AnnouncementManager />
    </AppLayout>
  );
}

export default ManageAnnouncements;

