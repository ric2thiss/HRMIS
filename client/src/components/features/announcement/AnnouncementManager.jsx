import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { deleteAnnouncement } from '../../../api/announcement/announcement';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useAnnouncementsStore } from '../../../stores/announcementsStore';
import AnnouncementForm from './AnnouncementForm';
import LoadingSpinner from '../../Loading/LoadingSpinner';

function AnnouncementManager() {
  const showSuccess = useNotificationStore((state) => state.showSuccess);
  const showError = useNotificationStore((state) => state.showError);
  const navigate = useNavigate();
  
  const { 
    announcements, 
    loading, 
    getAnnouncements, 
    removeAnnouncementFromCache,
    refreshAnnouncements 
  } = useAnnouncementsStore();
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, draft, active, expired

  useEffect(() => {
    loadAnnouncements();
  }, [filterStatus]);

  const loadAnnouncements = async () => {
    try {
      const filters = {};
      if (filterStatus !== 'all') {
        filters.status = filterStatus;
      } else {
        // For 'all', we want to show all announcements including expired
        // Pass empty filters and let backend handle it, or explicitly request all
        filters.status = 'all';
      }
      await getAnnouncements(filters);
    } catch (error) {
      console.error('Error loading announcements:', error);
      showError('Failed to load announcements');
    }
  };

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setIsFormVisible(true);
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setIsFormVisible(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await deleteAnnouncement(id);
      // Remove from cache immediately for instant UI update
      removeAnnouncementFromCache(id);
      showSuccess('Announcement deleted successfully');
      // Refresh to ensure consistency
      const filters = {};
      if (filterStatus !== 'all') {
        filters.status = filterStatus;
      }
      await refreshAnnouncements(filters);
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to delete announcement';
      showError(message);
    }
  };

  const handleFormSuccess = () => {
    setIsFormVisible(false);
    setEditingAnnouncement(null);
    // Refresh announcements after create/update
    const filters = {};
    if (filterStatus !== 'all') {
      filters.status = filterStatus;
    }
    refreshAnnouncements(filters);
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setEditingAnnouncement(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Manage Announcements</h2>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/announcements/archive')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Archive
          </button>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Announcement
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <LoadingSpinner text="Loading announcements..." />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No announcements found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reactions</th>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(announcement.status)}`}>
                        {announcement.status}
                      </span>
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
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(announcement)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                          <span className="font-medium">{announcement.likes_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                          </svg>
                          <span className="font-medium">{announcement.dislikes_count || 0}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormVisible && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-xl font-medium text-gray-900">
                {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
              </h3>
              <button
                onClick={handleFormCancel}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                disabled={loading}
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <AnnouncementForm
                announcement={editingAnnouncement}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default AnnouncementManager;

