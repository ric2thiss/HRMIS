import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../hooks/useAuth";
import AppLayout from '../../components/Layout/AppLayout';
import PdsForm from '../../components/PdsForm/PdsForm';
import PdsStatusTable from '../../components/features/pds/PdsStatusTable';
import LoadingScreen from '../../components/Loading/LoadingScreen';
import LoadingSpinner from '../../components/Loading/LoadingSpinner';
import { getMyPds } from '../../api/pds/pds';

function Pds() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [pds, setPds] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loadingPds, setLoadingPds] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const loadPds = async () => {
      try {
        setLoadingPds(true);
        const existingPds = await getMyPds();
        setPds(existingPds);
        // Show form if no PDS exists or if user clicks update
        if (!existingPds) {
          setShowForm(true);
        }
      } catch (err) {
        console.error('Error loading PDS:', err);
      } finally {
        setLoadingPds(false);
      }
    };
    if (user) {
      loadPds();
    }
  }, [user]);

  const handleRefresh = async () => {
    setLoadingPds(true);
    try {
      const existingPds = await getMyPds();
      setPds(existingPds);
    } catch (err) {
      console.error('Error refreshing PDS:', err);
    } finally {
      setLoadingPds(false);
    }
  };

  const handleUpdate = () => {
    setShowForm(true);
  };

  // Show full page loading only for initial auth check
  if (loading || !user) {
    return <LoadingScreen />;
  }

  const role = user?.roles?.[0]?.name;
  const isHR = role === 'hr' || role === 'admin';

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="My PDS">
      {loadingPds ? (
        <LoadingSpinner text="Loading PDS..." />
      ) : (
        <>
          {isHR && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> As HR/Admin, you can maintain your own PDS for record-keeping. This PDS will remain in draft status and cannot be submitted for approval.
              </p>
            </div>
          )}
          {pds && (
            <PdsStatusTable 
              pds={pds} 
              onUpdate={handleUpdate}
              onRefresh={handleRefresh}
              isHR={isHR}
            />
          )}
          {showForm && (
            <PdsForm onSave={handleRefresh} />
          )}
        </>
      )}
    </AppLayout>
  );
}

export default Pds;
