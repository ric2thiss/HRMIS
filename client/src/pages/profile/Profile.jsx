import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppLayout from '../../components/Layout/AppLayout';
import ProfileForm from '../../components/features/profile/ProfileForm';
import ProfileInfo from '../../components/features/profile/ProfileInfo';

function Profile() {
  const navigate = useNavigate();
  const { user: authUser, logout, loading, refreshUser } = useAuth();
  const [user, setUser] = useState(authUser);

  useEffect(() => {
    if (!loading && !authUser) {
      navigate("/login");
    } else if (authUser) {
      setUser(authUser);
    }
  }, [loading, authUser, navigate]);

  const handleProfileUpdate = async (updatedUser) => {
    // Refresh user from server to ensure we have latest data
    // This updates the AuthContext, which will trigger the useEffect above
    if (refreshUser) {
      await refreshUser();
      // The useEffect will automatically sync the local state with the updated authUser
    } else {
      // Fallback: use the updated user from the API response
      setUser(updatedUser);
    }
  };

  // Show full page loading only for initial auth check
  if (loading || !user) {
    return null;
  }

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="My Profile">
      <div className="space-y-6">
        <ProfileInfo user={user} />
        <ProfileForm user={user} onUpdate={handleProfileUpdate} />
      </div>
    </AppLayout>
  );
}

export default Profile;

