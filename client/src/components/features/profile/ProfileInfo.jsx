import React from 'react';

function ProfileInfo({ user }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Information</h2>
      
      <div className="flex items-start gap-6 mb-6 pb-6 border-b">
        {user.profile_image ? (
          <img 
            src={user.profile_image} 
            alt="Profile" 
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        <div>
          <h3 className="text-xl font-bold text-gray-800">{user.name || 'N/A'}</h3>
          <p className="text-sm text-gray-500">{user.email || 'N/A'}</p>
        </div>
      </div>
      
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

