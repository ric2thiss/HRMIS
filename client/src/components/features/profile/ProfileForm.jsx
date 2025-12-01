import React, { useState } from 'react';
import { useNotification } from '../../../context/NotificationContext';
import updateProfile from '../../../api/user/updateProfile';

function ProfileForm({ user, onUpdate }) {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileImage, setProfileImage] = useState(user.profile_image || '');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result); // Store as base64
    };
    reader.onerror = () => {
      showError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate password if changing
      if (formData.newPassword) {
        if (formData.newPassword.length < 6) {
          showError('New password must be at least 6 characters');
          setLoading(false);
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          showError('Passwords do not match');
          setLoading(false);
          return;
        }
      }

      // Prepare update payload
      const updatePayload = {
        name: formData.name,
        email: formData.email,
      };

      // Add password if changing
      if (formData.newPassword) {
        updatePayload.password = formData.newPassword;
        updatePayload.current_password = formData.currentPassword;
      }

      // Add profile image if changed
      if (profileImage && profileImage !== user.profile_image) {
        updatePayload.profile_image = profileImage;
      }

      // Call API
      const updatedUser = await updateProfile(updatePayload);
      
      // Call parent callback if provided to refresh user data
      if (onUpdate) {
        onUpdate(updatedUser);
      }
      
      showSuccess('Profile updated successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Update Profile</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image Upload */}
        <div className="flex items-center gap-6 pb-6 border-b">
          <div className="relative">
            {profileImage ? (
              <div className="relative">
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setProfileImage('')}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Image
            </label>
            <label className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {profileImage ? 'Change Image' : 'Upload Image'}
            </label>
            <p className="text-xs text-gray-500 mt-1">Max 2MB, JPG/PNG</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Leave empty if not changing"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Min. 6 characters"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm new password"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => setFormData({
              name: user.name || '',
              email: user.email || '',
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            })}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileForm;

