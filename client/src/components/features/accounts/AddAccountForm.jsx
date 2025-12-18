import React, { useState, useEffect } from 'react';
import { useMasterListsStore } from '../../../stores/masterListsStore';

function AddAccountForm({ onAddAccount, roles, employmentTypes, onCancel, loading }) {
  const { getMasterLists, masterLists, loading: loadingMasterLists } = useMasterListsStore();
  const [formData, setFormData] = useState({
    first_name: '',
    middle_initial: '',
    last_name: '',
    sex: '',
    email: '',
    password: '',
    position_id: '',
    role_id: '',
    project_id: '',
    office_id: '',
    employment_type_id: '',
    special_capability_ids: []
  });

  const [isJobOrder, setIsJobOrder] = useState(false);
  const [masterListsError, setMasterListsError] = useState(null);

  // Load master lists on mount (cached)
  useEffect(() => {
    const loadMasterListsData = async () => {
      try {
        const data = await getMasterLists();
        
        // Validate that all required master lists are populated
        if (data.positions.length === 0 || data.roles.length === 0 || data.projects.length === 0) {
          setMasterListsError('Master lists must be populated before creating users. Please configure Positions, Roles, and Projects first.');
        }
        
        // Set default office if available
        if (data.offices?.length > 0 && !formData.office_id) {
          setFormData(prev => ({ ...prev, office_id: data.offices[0].id }));
        }
      } catch (err) {
        setMasterListsError('Failed to load master lists.');
      }
    };
    loadMasterListsData();
  }, [getMasterLists]);

  // Set default values after master lists are loaded
  useEffect(() => {
    if (masterLists.roles?.length > 0 && !formData.role_id) {
      setFormData(prev => ({ ...prev, role_id: masterLists.roles[0].id }));
    }
    if (masterLists.positions?.length > 0 && !formData.position_id) {
      setFormData(prev => ({ ...prev, position_id: masterLists.positions[0].id }));
    }
    if (masterLists.projects?.length > 0 && !formData.project_id) {
      setFormData(prev => ({ ...prev, project_id: masterLists.projects[0].id }));
    }
    // Set default employment type to Plantilla (ID 1) - should be first in list after seeder fix
    if (employmentTypes?.length > 0 && !formData.employment_type_id) {
      const plantillaType = employmentTypes.find(et => 
        et.name?.toLowerCase() === 'plantilla' || et.id === 1
      );
      if (plantillaType) {
        setFormData(prev => ({ ...prev, employment_type_id: plantillaType.id }));
      }
    }
  }, [masterLists, formData.role_id, formData.position_id, formData.project_id, employmentTypes, formData.employment_type_id]);

  // Check if selected employment type is Job Order (JO)
  // Also ensure HR/Admin roles default to Plantilla
  useEffect(() => {
    const selectedEmployment = employmentTypes.find(et => et.id === parseInt(formData.employment_type_id));
    const isJO = selectedEmployment?.name === 'JO' || 
                 selectedEmployment?.name?.toLowerCase() === 'jo';
    setIsJobOrder(isJO);
    
    // Clear special capabilities if not JO
    if (!isJO) {
      setFormData(prev => ({ ...prev, special_capability_ids: [] }));
    }
    
    // If HR or Admin role is selected, ensure employment type is Plantilla
    const selectedRole = masterLists.roles?.find(r => r.id === parseInt(formData.role_id));
    if (selectedRole && (selectedRole.name?.toLowerCase() === 'hr' || selectedRole.name?.toLowerCase() === 'admin')) {
      const plantillaType = employmentTypes.find(et => 
        et.name?.toLowerCase() === 'plantilla' || et.id === 1
      );
      if (plantillaType && formData.employment_type_id !== plantillaType.id) {
        setFormData(prev => ({ 
          ...prev, 
          employment_type_id: plantillaType.id,
          special_capability_ids: [] // Clear special capabilities for Plantilla
        }));
      }
    }
  }, [formData.employment_type_id, formData.role_id, employmentTypes, masterLists.roles]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Convert IDs to integers for backend
    const finalValue = ['position_id', 'role_id', 'project_id', 'office_id', 'employment_type_id'].includes(name)
      ? (value ? parseInt(value) : '')
      : value;

    setFormData(prevData => ({
      ...prevData,
      [name]: finalValue,
    }));
  };

  const handleSpecialCapabilityChange = (capabilityId) => {
    setFormData(prev => {
      const currentIds = prev.special_capability_ids || [];
      const isSelected = currentIds.includes(capabilityId);
      
      return {
        ...prev,
        special_capability_ids: isSelected
          ? currentIds.filter(id => id !== capabilityId)
          : [...currentIds, capabilityId]
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate master lists are populated
    if (masterLists.positions.length === 0 || masterLists.roles.length === 0 || masterLists.projects.length === 0) {
      setMasterListsError('Master lists must be populated before creating users.');
      return;
    }

    // Validate required fields
    if (!formData.first_name || !formData.last_name) {
      setMasterListsError('Please provide First Name and Last Name.');
      return;
    }
    if (!formData.sex) {
      setMasterListsError('Please select Sex.');
      return;
    }
    if (!formData.position_id || !formData.role_id || !formData.project_id) {
      setMasterListsError('Please select Position, Role, and Project.');
      return;
    }

    onAddAccount(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 m-4">
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
          {masterListsError && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong className="font-bold">Error: </strong>
              {masterListsError}
            </div>
          )}

          {/* Personal Information Section */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Personal Information</h4>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required 
                  disabled={loading}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="First Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Middle Initial</label>
                <input 
                  type="text"
                  name="middle_initial"
                  value={formData.middle_initial}
                  onChange={handleChange}
                  maxLength="10"
                  disabled={loading}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="M.I."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required 
                  disabled={loading}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sex <span className="text-red-500">*</span></label>
                <select 
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  required 
                  disabled={loading}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                <input 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required 
                  disabled={loading}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                <input 
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required 
                  disabled={loading}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Enter password"
                />
              </div>
            </div>
          </div>

          {/* Organizational Information Section */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Organizational Information</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Position/Designation <span className="text-red-500">*</span></label>
                <select 
                  name="position_id"
                  value={formData.position_id}
                  onChange={handleChange}
                  required
                  disabled={loading || masterLists.positions.length === 0}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">Select a position</option>
                  {masterLists.positions?.map((position) => (
                    <option key={position.id} value={position.id}>
                      {position.title}
                    </option>
                  ))}
                </select>
                {masterLists.positions.length === 0 && (
                  <p className="mt-1 text-sm text-red-600">No positions available. Please create positions in Master Lists first.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Organizational Role <span className="text-red-500">*</span></label>
                <select 
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleChange}
                  required
                  disabled={loading || masterLists.roles.length === 0}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">Select a role</option>
                  {masterLists.roles?.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
                {masterLists.roles.length === 0 && (
                  <p className="mt-1 text-sm text-red-600">No roles available. Please create roles in Master Lists first.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project Affiliation <span className="text-red-500">*</span></label>
                <select 
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleChange}
                  required
                  disabled={loading || masterLists.projects.length === 0}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">Select a project</option>
                  {masterLists.projects?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.status})
                    </option>
                  ))}
                </select>
                {masterLists.projects.length === 0 && (
                  <p className="mt-1 text-sm text-red-600">No projects available. Please create projects in Master Lists first.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Office</label>
                <select 
                  name="office_id"
                  value={formData.office_id}
                  onChange={handleChange}
                  disabled={loading || masterLists.offices.length === 0}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">Select an office (optional)</option>
                  {masterLists.offices?.map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.name} {office.code ? `(${office.code})` : ''}
                    </option>
                  ))}
                </select>
                {masterLists.offices.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">No offices available. You can assign an office later.</p>
                )}
              </div>
            </div>
          </div>

          {/* Employment Information Section */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Employment Information</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employment Type <span className="text-red-500">*</span></label>
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
            </div>
          </div>

          {isJobOrder && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special System Capabilities (Job Order Employees)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {masterLists.special_capabilities?.length > 0 ? (
                  masterLists.special_capabilities.map((capability) => (
                    <label key={capability.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.special_capability_ids?.includes(capability.id) || false}
                        onChange={() => handleSpecialCapabilityChange(capability.id)}
                        disabled={loading}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {capability.name}
                        {capability.description && (
                          <span className="text-gray-500 ml-2">({capability.description})</span>
                        )}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No special capabilities available.</p>
                )}
              </div>
            </div>
          )}
          
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

