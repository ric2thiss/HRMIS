import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppLayout from '../../components/Layout/AppLayout';
import LoadingScreen from '../../components/Loading/LoadingScreen';
import LoadingSpinner from '../../components/Loading/LoadingSpinner';
import { getArchivedAnnouncements } from '../../api/announcement/announcement';
import { useNotificationStore } from '../../stores/notificationStore';

function AnnouncementArchive() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const showError = useNotificationStore((state) => state.showError);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      const role = user?.roles?.[0]?.name;
      if (role !== 'hr' && role !== 'admin') {
        navigate("/dashboard");
      }
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const loadArchive = async () => {
      try {
        setLoadingAnnouncements(true);
        const response = await getArchivedAnnouncements({ my_announcements: true });
        setAnnouncements(response.announcements || []);
      } catch (error) {
        console.error('Error loading archived announcements:', error);
        showError('Failed to load archived announcements');
      } finally {
        setLoadingAnnouncements(false);
      }
    };

    if (user) {
      loadArchive();
    }
  }, [user, showError]);

  if (loading || !user) {
    return <LoadingScreen />;
  }

  const role = user?.roles?.[0]?.name;
  if (role !== 'hr' && role !== 'admin') {
    return null;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="Announcement Archive">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Archived Announcements</h2>
          <p className="text-gray-600">View your expired announcements</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loadingAnnouncements ? (
            <div className="flex justify-center items-center py-10">
              <LoadingSpinner text="Loading archived announcements..." />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No archived announcements found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expired At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {announcements.map((announcement) => (
                    <tr key={announcement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{announcement.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {announcement.content.substring(0, 50)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(announcement.scheduled_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(announcement.expires_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {announcement.duration_days} day(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/announcements/${announcement.id}`)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="View"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default AnnouncementArchive;

