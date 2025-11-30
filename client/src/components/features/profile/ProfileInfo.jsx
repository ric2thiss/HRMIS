import React from 'react';

function ProfileInfo({ user }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Employee ID</label>
            <p className="text-lg font-semibold text-gray-800">{user.employee_id || 'N/A'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
            <p className="text-lg font-semibold text-gray-800">{user.name || 'N/A'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
            <p className="text-lg text-gray-800">{user.email || 'N/A'}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
            <p className="text-lg font-semibold text-gray-800 capitalize">
              {user.roles?.[0]?.name || 'N/A'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Employment Type</label>
            <p className="text-lg text-gray-800">
              {(user.employmentTypes || user.employment_types)?.[0]?.name || 'N/A'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Office</label>
            <p className="text-lg text-gray-800">REGION13</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileInfo;

