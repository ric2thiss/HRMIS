import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, PenTool } from 'lucide-react';
import { useNotification } from '../../../hooks/useNotification';
import updateProfile from '../../../api/user/updateProfile';
import { getUserRole } from '../../../utils/userHelpers';
import SignatureModal from './SignatureModal';
import { useAuth } from '../../../hooks/useAuth';

function ProfileForm({ user, onUpdate }) {
  const { showSuccess, showError } = useNotification();
  const { refreshUser } = useAuth();
  const userRole = getUserRole(user);
  const isHR = userRole === 'hr' || userRole === 'admin';
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    middle_initial: user.middle_initial || '',
    sex: user.sex || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileImage, setProfileImage] = useState(user.profile_image || '');
  const [signature, setSignature] = useState(user.signature || '');
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // Sync form data and profile image when user prop changes
  useEffect(() => {
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      middle_initial: user.middle_initial || '',
      sex: user.sex || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setProfileImage(user.profile_image || '');
    setSignature(user.signature || '');
  }, [user]);

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
        if (!formData.currentPassword) {
          showError('Current password is required to change password');
          setLoading(false);
          return;
        }
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

      // Prepare update payload - password, profile image, and name fields (for HR/Admin)
      const updatePayload = {};

      // Add name fields and sex if HR/Admin and they've changed
      if (isHR) {
        if (formData.first_name !== (user.first_name || '')) {
          updatePayload.first_name = formData.first_name;
        }
        if (formData.last_name !== (user.last_name || '')) {
          updatePayload.last_name = formData.last_name;
        }
        if (formData.middle_initial !== (user.middle_initial || '')) {
          updatePayload.middle_initial = formData.middle_initial || null;
        }
        if (formData.sex !== (user.sex || '')) {
          updatePayload.sex = formData.sex;
        }
      }

      // Add password if changing
      if (formData.newPassword) {
        updatePayload.password = formData.newPassword;
        updatePayload.current_password = formData.currentPassword;
      }

      // Add profile image if changed (including if it was removed)
      if (profileImage !== (user.profile_image || '')) {
        updatePayload.profile_image = profileImage || '';
      }

      // Add signature if changed (including if it was removed)
      if (signature !== (user.signature || '')) {
        updatePayload.signature = signature || '';
      }

      // Only submit if there's something to update
      if (!updatePayload.password && !updatePayload.profile_image && !updatePayload.signature &&
          !updatePayload.first_name && !updatePayload.last_name && !updatePayload.middle_initial && !updatePayload.sex) {
        showError('Please make a change to update your profile');
        setLoading(false);
        return;
      }

      // Call API
      const updatedUser = await updateProfile(updatePayload);
      
      // Refresh user from server to get latest data including signature
      if (refreshUser) {
        const refreshedUser = await refreshUser();
        if (onUpdate) {
          onUpdate(refreshedUser || updatedUser);
        }
      } else if (onUpdate) {
        onUpdate(updatedUser);
      }
      
      // Show appropriate success message
      const updates = [];
      if (updatePayload.first_name || updatePayload.last_name || updatePayload.middle_initial) {
        updates.push('name');
      }
      if (updatePayload.sex) {
        updates.push('sex');
      }
      if (updatePayload.password) {
        updates.push('password');
      }
      if (updatePayload.profile_image) {
        updates.push('profile image');
      }
      if (updatePayload.signature) {
        updates.push('signature');
      }
      
      if (updates.length > 0) {
        showSuccess(`${updates.join(', ')} updated successfully`);
      }
      
      setFormData({
        first_name: updatedUser.first_name || '',
        last_name: updatedUser.last_name || '',
        middle_initial: updatedUser.middle_initial || '',
        sex: updatedUser.sex || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get full name
  const getFullName = () => {
    if (user.first_name || user.last_name) {
      const parts = [user.first_name, user.middle_initial, user.last_name].filter(Boolean);
      return parts.join(' ');
    }
    return user.name || 'N/A';
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

        {/* Profile Information - Editable for HR/Admin */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Information</h3>
          
          {isHR ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Middle Initial
                </label>
                <input
                  type="text"
                  name="middle_initial"
                  value={formData.middle_initial}
                  onChange={handleChange}
                  maxLength="10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sex <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="sex"
                      value="Male"
                      checked={formData.sex === 'Male'}
                      onChange={handleChange}
                      required
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Male</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="sex"
                      value="Female"
                      checked={formData.sex === 'Female'}
                      onChange={handleChange}
                      required
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Female</span>
                  </label>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Email Address
                </label>
                <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  {user.email || 'N/A'}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Full Name
                </label>
                <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  {getFullName()}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Email Address
                </label>
                <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  {user.email || 'N/A'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Sex
                </label>
                <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  {user.sex || 'N/A'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* E-Signature Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">E-Signature</h3>
          <div className="flex items-center gap-4">
            {signature ? (
              <div className="flex items-center gap-4 flex-1">
                <div className="border border-gray-300 rounded-lg p-4 bg-white max-w-md">
                  <img 
                    src={signature} 
                    alt="E-Signature" 
                    className="max-w-full h-auto max-h-24 object-contain"
                    onError={(e) => {
                      console.error('Error loading signature');
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <PenTool size={18} />
                  Update Signature
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
              >
                <PenTool size={20} />
                Create E-Signature
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Your encrypted digital signature stored securely in the system.
          </p>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.currentPassword ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Current Password"
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.currentPassword && (
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, currentPassword: !prev.currentPassword }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.currentPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.newPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  minLength={6}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Min. 6 characters"
                />
                {formData.newPassword && (
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, newPassword: !prev.newPassword }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.newPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
                {formData.confirmPassword && (
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* <p className="text-sm text-gray-500 mt-2">Leave password fields empty if you only want to update your profile image.</p> */}
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                middle_initial: user.middle_initial || '',
                sex: user.sex || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              });
              setProfileImage(user.profile_image || '');
              setSignature(user.signature || '');
            }}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || (
              profileImage === (user.profile_image || '') && 
              signature === (user.signature || '') &&
              !formData.newPassword &&
              (!isHR || (
                formData.first_name === (user.first_name || '') &&
                formData.last_name === (user.last_name || '') &&
                formData.middle_initial === (user.middle_initial || '') &&
                formData.sex === (user.sex || '')
              ))
            )}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={async (newSignature) => {
          // Save signature immediately when created/updated in modal
          try {
            setLoading(true);
            const updatePayload = { signature: newSignature };
            await updateProfile(updatePayload);
            
            // Refresh user from server to get latest signature (decrypted)
            if (refreshUser) {
              const refreshedUser = await refreshUser();
              setSignature(refreshedUser?.signature || newSignature);
              if (onUpdate) {
                onUpdate(refreshedUser);
              }
            } else {
              setSignature(newSignature);
            }
            
            showSuccess('E-signature saved successfully');
            setIsSignatureModalOpen(false);
          } catch (error) {
            showError(error.response?.data?.message || 'Failed to save signature');
          } finally {
            setLoading(false);
          }
        }}
        currentSignature={signature}
      />
    </div>
  );
}

export default ProfileForm;

