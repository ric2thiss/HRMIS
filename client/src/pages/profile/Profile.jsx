import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth/AuthContext';
import AppLayout from '../../components/Layout/AppLayout';
import ProfileForm from '../../components/features/profile/ProfileForm';
import ProfileInfo from '../../components/features/profile/ProfileInfo';

function Profile() {
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

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="My Profile">
      <div className="space-y-6">
        <ProfileInfo user={user} />
        <ProfileForm user={user} />
      </div>
    </AppLayout>
  );
}

export default Profile;

