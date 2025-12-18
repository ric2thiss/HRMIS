import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppLayout from '../../components/Layout/AppLayout';
import MyAnnouncementsList from '../../components/features/announcement/MyAnnouncementsList';
import LoadingScreen from '../../components/Loading/LoadingScreen';

function MyAnnouncements() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <LoadingScreen />;
  }

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="My Announcements">
      <MyAnnouncementsList user={user} />
    </AppLayout>
  );
}

export default MyAnnouncements;

