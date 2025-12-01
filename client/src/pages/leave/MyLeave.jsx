import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppLayout from '../../components/Layout/AppLayout';
import MyLeaveList from '../../components/features/leave/MyLeaveList';
import LeaveApplicationForm from '../../components/features/leave/LeaveApplicationForm';

function MyLeave() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  // Show full page loading only for initial auth check
  if (loading || !user) {
    return null;
  }

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="My Leave">
      <div className="space-y-6">
        <MyLeaveList user={user} />
        <LeaveApplicationForm user={user} />
      </div>
    </AppLayout>
  );
}

export default MyLeave;

