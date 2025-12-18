import React, { useState, useEffect } from 'react';
import { createAnnouncement, updateAnnouncement } from '../../../api/announcement/announcement';
import { useNotificationStore } from '../../../stores/notificationStore';
import LoadingSpinner from '../../Loading/LoadingSpinner';
import { getImageUrl } from '../../../utils/imageUtils';

function AnnouncementForm({ announcement, onSuccess, onCancel }) {
  const showSuccess = useNotificationStore((state) => state.showSuccess);
  const showError = useNotificationStore((state) => state.showError);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: null,
    scheduled_at: '',
    duration_days: 7,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        image: null,
        scheduled_at: announcement.scheduled_at 
          ? new Date(announcement.scheduled_at).toISOString().slice(0, 16)
          : '',
        duration_days: announcement.duration_days || 7,
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

