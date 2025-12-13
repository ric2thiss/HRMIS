import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import AppLayout from "../../components/Layout/AppLayout";
import MasterListsManager from "../../components/features/masterLists/MasterListsManager";
import LoadingScreen from "../../components/Loading/LoadingScreen";
import { getUserRole } from "../../utils/userHelpers";

function MasterLists() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      const role = getUserRole(user);
      if (role !== 'hr' && role !== 'admin') {
        navigate("/dashboard");
      }
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <LoadingScreen />;
  }

  const role = getUserRole(user);
  if (role !== 'hr' && role !== 'admin') {
    return null;
  }

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="Master Lists Management">
      <MasterListsManager />
    </AppLayout>
  );
}

export default MasterLists;

