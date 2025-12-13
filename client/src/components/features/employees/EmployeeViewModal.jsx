import React from 'react';
import { createPortal } from 'react-dom';

function EmployeeViewModal({ employee, onClose }) {
    if (!employee) return null;

    // Get initials for avatar
    const getInitials = (employee) => {
        const firstName = employee.first_name || '';
        const lastName = employee.last_name || '';
        if (firstName && lastName) {
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        }
        return employee.name ? employee.name.substring(0, 2).toUpperCase() : 'NA';
    };

    const initials = getInitials(employee);

    // Format role name (Title Case)
    const formatRole = (role) => {
        if (!role) return 'N/A';
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    };

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-blue-600 text-white p-6 rounded-t-lg flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Employee Profile</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Profile Header */}
                    <div className="flex items-center space-x-6 mb-8 pb-6 border-b">
                        {employee.profile_image ? (
                            <img 
                                src={employee.profile_image} 
                                alt="Profile" 
                                className="w-24 h-24 rounded-full object-cover border-4 border-blue-200 flex-shrink-0"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-semibold text-blue-600 flex-shrink-0 border-4 border-blue-200">
                                {initials}
                            </div>
                        )}
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'N/A'}
                            </h3>
                            <p className="text-lg text-gray-600 mt-1">
                                {employee.position?.title || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Employee ID: {employee.employee_id || 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Personal Information</h4>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                                <p className="text-base text-gray-800">
                                    {employee.name || `${employee.first_name || ''} ${employee.middle_initial || ''} ${employee.last_name || ''}`.trim() || 'N/A'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                                <p className="text-base text-gray-800">{employee.email || 'N/A'}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Sex</label>
                                <p className="text-base text-gray-800">{employee.sex || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Employment Information */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Employment Information</h4>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Position/Designation</label>
                                <p className="text-base text-gray-800">
                                    {employee.position?.title || 'N/A'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Organizational Role</label>
                                <p className="text-base text-gray-800 capitalize">
                                    {formatRole(employee.role?.name || employee.roles?.[0]?.name)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Project Affiliation</label>
                                <p className="text-base text-gray-800">
                                    {employee.project?.name || 'N/A'}
                                    {employee.project?.status && ` (${employee.project.status})`}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Office</label>
                                <p className="text-base text-gray-800">
                                    {employee.office?.name || 'N/A'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Employment Type</label>
                                <p className="text-base text-gray-800">
                                    {(employee.employmentTypes || employee.employment_types)?.[0]?.name || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Account Status */}
                    <div className="mt-6 pt-6 border-t">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Account Status</h4>
                        <div className="flex items-center space-x-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                employee.is_locked 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                            }`}>
                                {employee.is_locked ? 'Locked' : 'Active'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-lg flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default EmployeeViewModal;

