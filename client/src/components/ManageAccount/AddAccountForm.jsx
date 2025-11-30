import React, { useState, useEffect } from 'react';

function AddAccountForm({ onAddAccount, roles, employmentTypes, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    employment_type_id: '' // ✅ fixed
  });

  // Set default role_id after roles are loaded
  useEffect(() => {
    if (roles?.length > 0 && !formData.role_id) {
      setFormData(prev => ({ ...prev, role_id: roles[0].id }));
    }
  }, [roles]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Convert IDs to integers for backend
    const finalValue = ['role_id', 'employment_type_id'].includes(name)
      ? parseInt(value) || ''
      : value;

    setFormData(prevData => ({
      ...prevData,
      [name]: finalValue,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddAccount(formData); 
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-medium text-gray-900">Create New Account</h3>
          <button 
            onClick={onCancel} 
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            disabled={loading}
          >
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input 
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required 
              disabled={loading}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required 
              disabled={loading}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required 
              disabled={loading}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Position/Role</label>
            <select 
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              required
              disabled={loading || roles.length === 0}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="">Select a role</option>
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Employment Type</label>
            <select 
              name="employment_type_id"
              value={formData.employment_type_id}
              onChange={handleChange}
              required
              disabled={loading || employmentTypes.length === 0}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="">Select Employment Type</option>
              {employmentTypes?.map((employmentType) => (
                <option key={employmentType.id} value={employmentType.id}>
                  {employmentType.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onCancel}
              disabled={loading}
              className="py-2 px-4 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button 
              type="submit"
              disabled={loading}
              className="py-2 px-4 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default React.memo(AddAccountForm);
