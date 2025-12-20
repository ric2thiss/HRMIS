import React, { useState, useEffect } from 'react';
import { createAnnouncement, updateAnnouncement } from '../../../api/announcement/announcement';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useMasterListsStore } from '../../../stores/masterListsStore';
import LoadingSpinner from '../../Loading/LoadingSpinner';
import { getImageUrl } from '../../../utils/imageUtils';
import api from '../../../api/axios';

function AnnouncementForm({ announcement, onSuccess, onCancel }) {
  const showSuccess = useNotificationStore((state) => state.showSuccess);
  const showError = useNotificationStore((state) => state.showError);
  const { getMasterLists, masterLists } = useMasterListsStore();
  const [loading, setLoading] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: null,
    scheduled_at: '',
    duration_days: 7,
    recipients: [],
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [recipientTab, setRecipientTab] = useState('user'); // 'user', 'office', 'position'

  // Load users and master lists
  useEffect(() => {
    const loadRecipients = async () => {
      try {
        setLoadingRecipients(true);
        await api.get('/sanctum/csrf-cookie');
        const [usersRes] = await Promise.all([
          api.get('/api/users', { withCredentials: true }),
          getMasterLists(),
        ]);
        setUsers(usersRes.data.users || []);
      } catch (error) {
        console.error('Error loading recipients:', error);
        showError('Failed to load recipient options');
      } finally {
        setLoadingRecipients(false);
      }
    };
    loadRecipients();
  }, [getMasterLists, showError]);

  useEffect(() => {
    if (announcement) {
      // Load recipients from announcement
      const recipients = (announcement.recipients || []).map(r => ({
        type: r.recipient_type,
        id: r.recipient_id || null, // Handle 'all' type which has null id
      }));
      
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        image: null,
        scheduled_at: announcement.scheduled_at 
          ? new Date(announcement.scheduled_at).toISOString().slice(0, 16)
          : '',
        duration_days: announcement.duration_days || 7,
        recipients: recipients,
      });
      setRemoveImage(false);
      if (announcement.image) {
        // Use utility function to construct image URL
        const imageUrl = getImageUrl(announcement.image);
        setImagePreview(imageUrl);
      } else {
        setImagePreview(null);
      }
    } else {
      // Reset form when creating new announcement
      setFormData({
        title: '',
        content: '',
        image: null,
        scheduled_at: '',
        duration_days: 7,
        recipients: [],
      });
      setImagePreview(null);
      setRemoveImage(false);
    }
  }, [announcement]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_days' ? parseInt(value) || 0 : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Please upload an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showError('Image size must be less than 5MB');
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      setRemoveImage(false); // Reset remove flag when new image is selected
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    // If editing and had an existing image, mark it for removal
    if (announcement && announcement.image) {
      setRemoveImage(true);
    } else {
      setRemoveImage(false);
    }
  };

  const handleRecipientToggle = (type, id) => {
    // Don't allow individual selections if "All" is selected
    if (isAllSelected()) {
      return;
    }
    
    setFormData(prev => {
      const recipients = [...prev.recipients];
      const index = recipients.findIndex(r => r.type === type && r.id === id);
      
      if (index >= 0) {
        // Remove recipient
        recipients.splice(index, 1);
      } else {
        // Add recipient
        recipients.push({ type, id });
      }
      
      return { ...prev, recipients };
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      // Select "All" - clear other selections
      setFormData(prev => ({
        ...prev,
        recipients: [{ type: 'all', id: null }]
      }));
    } else {
      // Deselect "All" - clear recipients
      setFormData(prev => ({
        ...prev,
        recipients: []
      }));
    }
  };

  const isRecipientSelected = (type, id) => {
    return formData.recipients.some(r => r.type === type && r.id === id);
  };

  const isAllSelected = () => {
    return formData.recipients.some(r => r.type === 'all');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showError('Title is required');
      return;
    }

    if (!formData.content.trim()) {
      showError('Content is required');
      return;
    }

    if (!formData.scheduled_at) {
      showError('Scheduled date and time is required');
      return;
    }

    if (!formData.recipients || formData.recipients.length === 0) {
      showError('Please select at least one recipient or select "All Employees"');
      return;
    }

    // Validate scheduled date (allow current time or future)
    const scheduledDate = new Date(formData.scheduled_at);
    const now = new Date();
    // Allow 1 minute buffer to account for time differences
    if (scheduledDate < new Date(now.getTime() - 60000)) {
      showError('Scheduled date must be in the future');
      return;
    }

    setLoading(true);

    try {
      if (announcement) {
        const updateData = {
          ...formData,
          scheduled_at: new Date(formData.scheduled_at).toISOString(),
        };
        // If image was removed, include the flag
        if (removeImage) {
          updateData.remove_image = true;
        }
        await updateAnnouncement(announcement.id, updateData);
        showSuccess('Announcement updated successfully');
      } else {
        await createAnnouncement({
          ...formData,
          scheduled_at: new Date(formData.scheduled_at).toISOString(),
        });
        showSuccess('Announcement created successfully');
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.errors 
        ? JSON.stringify(error.response.data.errors)
        : 'Failed to save announcement';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  // Get minimum datetime (current time)
  const now = new Date();
  const minDateTime = now.toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter announcement title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content <span className="text-red-500">*</span>
        </label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          required
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter announcement content"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image (Optional)
        </label>
        {imagePreview && (
          <div className="mb-4 relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-full h-48 object-cover rounded-lg border border-gray-300"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">Maximum file size: 5MB. Supported formats: JPEG, PNG, JPG, GIF</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scheduled Date & Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            name="scheduled_at"
            value={formData.scheduled_at}
            onChange={handleChange}
            min={minDateTime}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (Days) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="duration_days"
            value={formData.duration_days}
            onChange={handleChange}
            min={1}
            max={365}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">How many days to display the announcement</p>
        </div>
      </div>

      {/* Recipients Selection */}
      <div className="border border-gray-300 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Recipients <span className="text-red-500">*</span>
          <span className="text-xs font-normal text-gray-500 ml-2">
            Select who should see this announcement
          </span>
        </label>
        
        {loadingRecipients ? (
          <div className="text-center py-4">
            <LoadingSpinner size="sm" inline={true} />
            <span className="ml-2 text-sm text-gray-500">Loading recipients...</span>
          </div>
        ) : (
          <>
            {/* Select All Option */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllSelected()}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">All Employees</span>
                <span className="text-xs text-gray-500">(Send to everyone)</span>
              </label>
            </div>

            {/* Tabs */}
            <div className={`flex gap-2 border-b border-gray-200 mb-4 ${isAllSelected() ? 'opacity-50 pointer-events-none' : ''}`}>
              <button
                type="button"
                onClick={() => setRecipientTab('user')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  recipientTab === 'user'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Employees ({formData.recipients.filter(r => r.type === 'user').length})
              </button>
              <button
                type="button"
                onClick={() => setRecipientTab('office')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  recipientTab === 'office'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Offices ({formData.recipients.filter(r => r.type === 'office').length})
              </button>
              <button
                type="button"
                onClick={() => setRecipientTab('position')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  recipientTab === 'position'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Positions ({formData.recipients.filter(r => r.type === 'position').length})
              </button>
            </div>

            {/* Recipient Lists */}
            <div className={`max-h-64 overflow-y-auto ${isAllSelected() ? 'opacity-50 pointer-events-none' : ''}`}>
              {recipientTab === 'user' && (
                <div className="space-y-2">
                  {users.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No employees available</p>
                  ) : (
                    users.map((user) => {
                      const name = user.name || `${user.first_name || ''} ${user.middle_initial || ''} ${user.last_name || ''}`.trim() || user.email;
                      return (
                        <label
                          key={user.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isRecipientSelected('user', user.id)}
                            onChange={() => handleRecipientToggle('user', user.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{name}</span>
                          {user.position?.title && (
                            <span className="text-xs text-gray-500">({user.position.title})</span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              )}

              {recipientTab === 'office' && (
                <div className="space-y-2">
                  {masterLists.offices?.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No offices available</p>
                  ) : (
                    masterLists.offices?.map((office) => (
                      <label
                        key={office.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isRecipientSelected('office', office.id)}
                          onChange={() => handleRecipientToggle('office', office.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{office.name}</span>
                        {office.code && (
                          <span className="text-xs text-gray-500">({office.code})</span>
                        )}
                      </label>
                    ))
                  )}
                </div>
              )}

              {recipientTab === 'position' && (
                <div className="space-y-2">
                  {masterLists.positions?.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No positions available</p>
                  ) : (
                    masterLists.positions?.map((position) => (
                      <label
                        key={position.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isRecipientSelected('position', position.id)}
                          onChange={() => handleRecipientToggle('position', position.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{position.title}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            {formData.recipients.length === 0 && (
              <p className="text-sm text-red-500 mt-2">Please select at least one recipient or select "All Employees"</p>
            )}
            
            {isAllSelected() && (
              <p className="text-sm text-blue-600 mt-2 font-medium">
                ✓ This announcement will be visible to all employees
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && <LoadingSpinner size="sm" inline={true} color="white" />}
          {announcement ? 'Update' : 'Create'} Announcement
        </button>
      </div>
    </form>
  );
}

export default AnnouncementForm;

