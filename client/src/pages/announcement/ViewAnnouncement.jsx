import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppLayout from '../../components/Layout/AppLayout';
import LoadingScreen from '../../components/Loading/LoadingScreen';
import LoadingSpinner from '../../components/Loading/LoadingSpinner';
import { getAnnouncement } from '../../api/announcement/announcement';
import { useNotificationStore } from '../../stores/notificationStore';
import { getImageUrl } from '../../utils/imageUtils';
import ImageViewerModal from '../../components/ui/ImageViewerModal';
import { Maximize2 } from 'lucide-react';

function ViewAnnouncement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const showError = useNotificationStore((state) => state.showError);
  const [announcement, setAnnouncement] = useState(null);
  const [loadingAnnouncement, setLoadingAnnouncement] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        setLoadingAnnouncement(true);
        const response = await getAnnouncement(id);
        setAnnouncement(response.announcement);
      } catch (error) {
        console.error('Error loading announcement:', error);
        showError('Failed to load announcement');
        navigate('/dashboard');
      } finally {
        setLoadingAnnouncement(false);
      }
    };

    if (user && id) {
      loadAnnouncement();
    }
  }, [user, id, navigate, showError]);

  if (loading || !user) {
    return <LoadingScreen />;
  }

  if (loadingAnnouncement) {
    return (
      <AppLayout user={user} logout={logout} loading={loading} title="Announcement">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner text="Loading announcement..." />
        </div>
      </AppLayout>
    );
  }

  if (!announcement) {
    return (
      <AppLayout user={user} logout={logout} loading={loading} title="Announcement">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <p className="text-gray-600">Announcement not found</p>
        </div>
      </AppLayout>
    );
  }

  const imageUrl = getImageUrl(announcement.image);

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="Announcement">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {imageUrl && (
          <div className="relative w-full h-64 md:h-96 overflow-hidden bg-gray-200 group">
            <img
              src={imageUrl}
              alt={announcement.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image failed to load. URL:', imageUrl);
                console.error('Original image path:', announcement.image);
                e.target.style.display = 'none';
              }}
            />
            {/* Full View Button */}
            <button
              onClick={() => setShowImageModal(true)}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg text-white transition-all opacity-0 group-hover:opacity-100"
              title="View full image"
            >
              <Maximize2 size={20} />
            </button>
          </div>
        )}
        
        <div className="p-6 md:p-8">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {announcement.title}
            </h1>
            {announcement.posted_by && announcement.postedBy && (
              <p className="text-sm text-gray-600">
                Posted by: {announcement.postedBy.name || 
                  `${announcement.postedBy.first_name || ''} ${announcement.postedBy.middle_initial || ''} ${announcement.postedBy.last_name || ''}`.trim() || 
                  'HR'}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {new Date(announcement.scheduled_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div className="prose max-w-none">
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {announcement.content}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {showImageModal && imageUrl && (
        <ImageViewerModal
          imageUrl={imageUrl}
          alt={announcement.title}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </AppLayout>
  );
}

export default ViewAnnouncement;

