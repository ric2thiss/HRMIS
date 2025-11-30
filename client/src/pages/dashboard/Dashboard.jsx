import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/auth/AuthContext";
import AppLayout from '../../components/Layout/AppLayout';
import TilesSection from '../../components/Tile/TilesSection';

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return null;
  }

  const role = user?.roles?.[0]?.name;

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="Dashboard">
      <TilesSection role={role} />
    </AppLayout>
  );
}

export default Dashboard;