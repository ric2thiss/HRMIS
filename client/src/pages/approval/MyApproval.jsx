import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppLayout from '../../components/Layout/AppLayout';
import ApprovalList from '../../components/features/approval/ApprovalList';
import LoadingScreen from '../../components/Loading/LoadingScreen';
import LoadingSpinner from '../../components/Loading/LoadingSpinner';
import { checkIfApprover } from '../../api/master-lists/approvalNames';
import { getUserRole } from '../../utils/userHelpers';

function MyApproval() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [isApprover, setIsApprover] = useState(false);
  const [checkingApprover, setCheckingApprover] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    const checkAccess = async () => {
      if (user) {
        const role = getUserRole(user);
        // HR and Admin always have access
        if (role === 'hr' || role === 'admin') {
          setIsApprover(true);
          setCheckingApprover(false);
          return;
        }

        // Check if user is an approver
        try {
          const approverStatus = await checkIfApprover();
          setIsApprover(approverStatus);
          if (!approverStatus) {
            navigate("/dashboard");
          }
        } catch (err) {
          console.error('Error checking approver status:', err);
          navigate("/dashboard");
        } finally {
          setCheckingApprover(false);
        }
      }
    };

    if (user) {
      checkAccess();
    }
  }, [loading, user, navigate]);

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

