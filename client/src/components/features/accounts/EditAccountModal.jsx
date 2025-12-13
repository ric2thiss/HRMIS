import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getAllMasterLists } from '../../../api/master-lists/masterLists';
import updateAccount from '../../../api/user/update_account';
import api from '../../../api/axios';
import { useNotificationStore } from '../../../stores/notificationStore';

function EditAccountModal({ account, onClose, onUpdate, loading, employmentTypes = [] }) {
    const showSuccess = useNotificationStore((state) => state.showSuccess);
    const showError = useNotificationStore((state) => state.showError);
    const [masterLists, setMasterLists] = useState({
        projects: [],
        offices: [],
        roles: []
    });
    const [formData, setFormData] = useState({
        project_id: account?.project_id || '',
        office_id: account?.office_id || '',
        role_id: account?.role_id || account?.role?.id || account?.roles?.[0]?.id || '',
        employment_type_id: (account?.employmentTypes || account?.employment_types)?.[0]?.id || ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [loadingMasterLists, setLoadingMasterLists] = useState(true);

    useEffect(() => {
        const loadMasterLists = async () => {
            try {
                setLoadingMasterLists(true);
                const data = await getAllMasterLists();
                setMasterLists({
                    projects: data.projects || [],
                    offices: data.offices || [],
                    roles: data.roles || []
                });
                
                // Set initial form data - handle both direct IDs and nested objects
                setFormData({
                    project_id: account?.project_id || account?.project?.id || '',
                    office_id: account?.office_id || account?.office?.id || '',
                    role_id: account?.role_id || account?.role?.id || account?.roles?.[0]?.id || '',
                    employment_type_id: (account?.employmentTypes || account?.employment_types)?.[0]?.id || ''
                });
            } catch (err) {
                showError('Failed to load master lists.');
            } finally {
                setLoadingMasterLists(false);
            }
        };
        
        if (account) {
            loadMasterLists();
        }
    }, [account, showError]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        const finalValue = ['project_id', 'office_id', 'role_id', 'employment_type_id'].includes(name)
            ? (value ? parseInt(value) : null)
            : value;

        setFormData(prevData => ({
            ...prevData,
            [name]: finalValue,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Check if there are any changes - compare with both direct IDs and nested objects
        const currentProjectId = account.project_id || account.project?.id;
        const currentOfficeId = account.office_id || account.office?.id;
        const currentRoleId = account.role_id || account.role?.id || account.roles?.[0]?.id;
        const currentEmploymentTypeId = (account?.employmentTypes || account?.employment_types)?.[0]?.id;
        
        if (formData.project_id == currentProjectId && 
            formData.office_id == currentOfficeId && 
            formData.role_id == currentRoleId &&
            formData.employment_type_id == currentEmploymentTypeId) {
            showError('No changes detected.');
            return;
        }

        try {
            setSubmitting(true);
            
            // Build update payload - include all required fields, project, office, role, and employment type can be changed
            const updatePayload = {
                firstName: account.first_name || '',
                middleInitial: account.middle_initial || null,
                lastName: account.last_name || '',
                email: account.email || '',
                positionId: account.position_id || account.position?.id,
                roleId: formData.role_id || account.role_id || account.role?.id || account.roles?.[0]?.id,
                projectId: formData.project_id || account.project_id || account.project?.id,
                officeId: formData.office_id || account.office_id || account.office?.id || null,
                employmentTypeId: formData.employment_type_id || (account?.employmentTypes || account?.employment_types)?.[0]?.id
            };

            await updateAccount(account.id, updatePayload);
            
            // Refresh account data
            const usersRes = await api.get("/api/users");
            const updatedAccounts = usersRes.data.users || [];
            const updatedAccount = updatedAccounts.find(acc => acc.id === account.id);
            
            showSuccess('Account updated successfully');
            if (onUpdate) {
                onUpdate(updatedAccount);
            }
            onClose();
        } catch (err) {
            const message = err?.response?.data?.message || err.message || 'Failed to update account.';
            showError(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!account) return null;

    const fullName = account.first_name && account.last_name
        ? `${account.first_name} ${account.middle_initial || ''} ${account.last_name}`.trim()
        : account.name || 'N/A';

    const roleName = account.role?.name || account.roles?.[0]?.name || 'No role';

    return createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Edit Account</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                            disabled={submitting}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Read-only Account Details */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={account.email || ''}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Position
                                        </label>
                                        <input
                                            type="text"
                                            value={account.position?.title || 'N/A'}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Employment Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="employment_type_id"
                                            value={formData.employment_type_id || ''}
                                            onChange={handleChange}
                                            required
                                            disabled={submitting || loadingMasterLists || employmentTypes.length === 0}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Select Employment Type</option>
                                            {employmentTypes.map((employmentType) => (
                                                <option key={employmentType.id} value={employmentType.id}>
                                                    {employmentType.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Editable Fields */}
                        <div className="border-t pt-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Editable Fields</h3>
                            
                            {loadingMasterLists ? (
                                <div className="text-center py-4">
                                    <p className="text-gray-500">Loading options...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Role <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="role_id"
                                                value={formData.role_id || ''}
                                                onChange={handleChange}
                                                required
                                                disabled={submitting || loadingMasterLists}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="">Select Role</option>
                                                {masterLists.roles.map((role) => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.name.charAt(0).toUpperCase() + role.name.slice(1).toLowerCase()}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Project Code <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="project_id"
                                                value={formData.project_id || ''}
                                                onChange={handleChange}
                                                required
                                                disabled={submitting || loadingMasterLists}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="">Select Project Code</option>
                                                {masterLists.projects.map((project) => (
                                                    <option key={project.id} value={project.id}>
                                                        {project.project_code || project.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Office
                                        </label>
                                        <select
                                            name="office_id"
                                            value={formData.office_id || ''}
                                            onChange={handleChange}
                                            disabled={submitting || loadingMasterLists}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Select Office (Optional)</option>
                                            {masterLists.offices.map((office) => (
                                                <option key={office.id} value={office.id}>
                                                    {office.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || loadingMasterLists}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default EditAccountModal;

