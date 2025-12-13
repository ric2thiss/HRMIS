import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../hooks/useAuth";
import AppLayout from '../../components/Layout/AppLayout';
import DTRSheet from '../../components/Dtr/DTRSheet';
import LoadingScreen from '../../components/Loading/LoadingScreen';

function DTR() {
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

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="My DTR">
      <DTRSheet />
    </AppLayout>
  );
}

export default DTR;