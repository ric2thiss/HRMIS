import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useIsApprover, usePrefetchApprovalData } from '../../hooks/useApprovalData';
import AppLayout from '../../components/Layout/AppLayout';
import ApprovalList from '../../components/features/approval/ApprovalList';
import LoadingScreen from '../../components/Loading/LoadingScreen';
import LoadingSpinner from '../../components/Loading/LoadingSpinner';

function MyApproval() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const { prefetchApprovalData } = usePrefetchApprovalData();
  
  // Use React Query to check if user is an approver (with caching)
  const { data: isApprover, isLoading: checkingApprover, error } = useIsApprover(user);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }
  }, [loading, user, navigate]);

  // Redirect if user is not an approver
  useEffect(() => {
    if (!checkingApprover && isApprover === false) {
      navigate("/dashboard");
    }
  }, [checkingApprover, isApprover, navigate]);

  // Prefetch approval data when component mounts
  useEffect(() => {
    if (user && isApprover) {
      prefetchApprovalData(user);
    }
  }, [user, isApprover, prefetchApprovalData]);

  // Show full page loading only for initial auth check
  if (loading || !user) {
    return <LoadingScreen />;
  }

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="My Approvals">
      {checkingApprover ? (
        <LoadingSpinner text="Checking access..." />
      ) : !isApprover ? (
        <div className="text-center py-10 text-gray-500">
          <p>You do not have access to this page.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 text-blue-600 hover:text-blue-800 underline"
          >
            Return to Dashboard
          </button>
        </div>
      ) : (
        <ApprovalList />
      )}
    </AppLayout>
  );
}

export default MyApproval;

