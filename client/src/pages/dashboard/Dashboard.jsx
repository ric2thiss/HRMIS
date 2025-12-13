import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../hooks/useAuth";
import AppLayout from '../../components/Layout/AppLayout';
import TilesSection from '../../components/Tile/TilesSection';
import LoadingScreen from '../../components/Loading/LoadingScreen';
import { getUserRole } from '../../utils/userHelpers';

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  // Show full page loading only for initial auth check
  if (loading || !user) {
    return <LoadingScreen />;
  }

  const role = getUserRole(user);

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="Dashboard">
      <TilesSection role={role} user={user} />
    </AppLayout>
  );
}

export default Dashboard;