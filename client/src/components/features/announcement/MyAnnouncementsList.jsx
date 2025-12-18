import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Eye, Maximize2 } from 'lucide-react';
import { getActiveAnnouncements, reactToAnnouncement } from '../../../api/announcement/announcement';
import { useNotificationStore } from '../../../stores/notificationStore';
import LoadingSpinner from '../../Loading/LoadingSpinner';
import { getImageUrl } from '../../../utils/imageUtils';
import ImageViewerModal from '../../ui/ImageViewerModal';

function MyAnnouncementsList({ user }) {
  const navigate = useNavigate();
  const showError = useNotificationStore((state) => state.showError);
  
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reactingIds, setReactingIds] = useState(new Set());
  const [imageModal, setImageModal] = useState({ show: false, url: null, alt: '' });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await getActiveAnnouncements();
      setAnnouncements(response.announcements || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
      showError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleReact = async (announcementId, reaction) => {
    if (reactingIds.has(announcementId)) return;

    // Find the announcement
    const announcement = announcements.find(ann => ann.id === announcementId);
    if (!announcement) return;

    // Optimistic update - update UI immediately
    const currentReaction = announcement.user_reaction;
    let newLikesCount = announcement.likes_count || 0;
    let newDislikesCount = announcement.dislikes_count || 0;
    let newUserReaction = null;

    // Calculate what the new state should be
    if (currentReaction === reaction) {
      // Toggle off - remove reaction
      if (reaction === 'like') {
        newLikesCount = Math.max(0, newLikesCount - 1);
      } else {
        newDislikesCount = Math.max(0, newDislikesCount - 1);
      }
      newUserReaction = null;
    } else if (currentReaction) {
      // Switch from one reaction to another
      if (currentReaction === 'like') {
        newLikesCount = Math.max(0, newLikesCount - 1);
      } else {
        newDislikesCount = Math.max(0, newDislikesCount - 1);
      }
      if (reaction === 'like') {
        newLikesCount += 1;
      } else {
        newDislikesCount += 1;
      }
      newUserReaction = reaction;
    } else {
      // Add new reaction
      if (reaction === 'like') {
        newLikesCount += 1;
      } else {
        newDislikesCount += 1;
      }
      newUserReaction = reaction;
    }

    // Update UI immediately (optimistic update)
    setAnnouncements(prev => prev.map(ann => 
      ann.id === announcementId 
        ? { 
            ...ann, 
            likes_count: newLikesCount,
            dislikes_count: newDislikesCount,
            user_reaction: newUserReaction
          }
        : ann
    ));

    setReactingIds(prev => new Set(prev).add(announcementId));

    try {
      // Make API call in background
      const response = await reactToAnnouncement(announcementId, reaction);
      
      // Update with actual server response (in case of any discrepancies)
      setAnnouncements(prev => prev.map(ann => 
        ann.id === announcementId 
          ? { 
              ...ann, 
              likes_count: response.likes_count,
              dislikes_count: response.dislikes_count,
              user_reaction: response.user_reaction
            }
          : ann
      ));
    } catch (error) {
      // Revert optimistic update on error
      setAnnouncements(prev => prev.map(ann => 
        ann.id === announcementId 
          ? { 
              ...ann, 
              likes_count: announcement.likes_count || 0,
              dislikes_count: announcement.dislikes_count || 0,
              user_reaction: announcement.user_reaction
            }
          : ann
      ));

      console.error('Error reacting to announcement:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to react to announcement';
      showError(errorMessage);
      
      // If it's a 503 error (table doesn't exist), provide helpful message
      if (error?.response?.status === 503) {
        console.error('Reactions feature not available. Please contact administrator.');
      }
    } finally {
      setReactingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(announcementId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <LoadingSpinner text="Loading announcements..." />
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-10 text-gray-500">
          No active announcements found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Active Announcements</h2>
        
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {announcement.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Posted by: {announcement.posted_by?.name || 'N/A'} • {formatDate(announcement.scheduled_at)}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/announcements/${announcement.id}`)}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View full announcement"
                >
                  <Eye size={18} />
                  View
                </button>
              </div>

              {announcement.image && (() => {
                const imageUrl = getImageUrl(announcement.image);
                return imageUrl ? (
                  <div className="mb-4 relative group">
                    <img
                      src={imageUrl}
                      alt={announcement.title}
                      className="w-full h-auto rounded-lg max-h-96 object-cover"
                      onError={(e) => {
                        console.error('Image failed to load. URL:', imageUrl);
                        console.error('Original image path:', announcement.image);
                        e.target.style.display = 'none';
                      }}
                    />
                    {/* Full View Button */}
                    <button
                      onClick={() => setImageModal({ show: true, url: imageUrl, alt: announcement.title })}
                      className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg text-white transition-all opacity-0 group-hover:opacity-100"
                      title="View full image"
                    >
                      <Maximize2 size={18} />
                    </button>
                  </div>
                ) : null;
              })()}

              <div className="prose max-w-none mb-4">
                <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
              </div>

              {/* Like/Dislike Section */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleReact(announcement.id, 'like')}
                  disabled={reactingIds.has(announcement.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    announcement.user_reaction === 'like'
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ThumbsUp size={18} />
                  <span>{announcement.likes_count || 0}</span>
                </button>
                <button
                  onClick={() => handleReact(announcement.id, 'dislike')}
                  disabled={reactingIds.has(announcement.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    announcement.user_reaction === 'dislike'
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ThumbsDown size={18} />
                  <span>{announcement.dislikes_count || 0}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {imageModal.show && imageModal.url && (
        <ImageViewerModal
          imageUrl={imageModal.url}
          alt={imageModal.alt}
          onClose={() => setImageModal({ show: false, url: null, alt: '' })}
        />
      )}
    </div>
  );
}

export default MyAnnouncementsList;

