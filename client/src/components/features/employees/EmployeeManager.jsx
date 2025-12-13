import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import EmployeeCardsView from './EmployeeCardsView';
import EmployeeTableView from './EmployeeTableView';
import EmployeeViewModal from './EmployeeViewModal';
import EditAccountModal from '../accounts/EditAccountModal';
import api from '../../../api/axios';
import getAccounts from '../../../api/user/get_accounts';
import deleteAccount from '../../../api/user/delete_account';
import { getAllPds } from '../../../api/pds/pds';
import { useNotificationStore } from '../../../stores/notificationStore';
import LoadingSpinner from '../../../components/Loading/LoadingSpinner';

/**
 * Calculate PDS completion percentage based on filled fields
 */
const calculatePdsCompletion = (formData) => {
    if (!formData) return 0;

    const fields = [
        // Personal Information
        'surname', 'firstName', 'dateOfBirth', 'placeOfBirth', 'sex', 'civilStatus',
        'mobileNo', 'emailAddress',
        // Address
        'resHouseNo', 'resBarangay', 'resCity', 'resProvince',
        // Family
        'fatherSurname', 'fatherFirstName', 'motherSurname', 'motherFirstName',
        // Education (at least one)
        'education',
        // References (at least one)
        'refName1',
    ];

    let filledCount = 0;
    let totalCount = fields.length;

    fields.forEach(field => {
        if (field === 'education') {
            // Check if at least one education entry has school
            const hasEducation = formData.education?.some(edu => edu.school && edu.school.trim() !== '');
            if (hasEducation) filledCount++;
        } else if (field === 'refName1') {
            // Check if at least one reference has name
            if (formData.refName1 && formData.refName1.trim() !== '') filledCount++;
        } else {
            const value = formData[field];
            if (value !== null && value !== undefined && value !== '' && value !== false) {
                filledCount++;
            }
        }
    });

    return Math.round((filledCount / totalCount) * 100);
};

function EmployeeManager() {
    const showSuccess = useNotificationStore((state) => state.showSuccess);
    const showError = useNotificationStore((state) => state.showError);
    
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [viewMode, setViewMode] = useState('cards');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingEmployee, setViewingEmployee] = useState(null);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState(null);

    // Fetch employees and their PDS data
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setInitializing(true);
                setError(null);
                await api.get("/sanctum/csrf-cookie");

                // Fetch employees and PDS data in parallel
                const [employeesRes, pdsRes] = await Promise.all([
                    api.get("/api/users"),
                    getAllPds()
                ]);

                const employeesData = employeesRes.data.users || [];
                const pdsData = pdsRes.pds || [];

                // Create a map of user_id to PDS for quick lookup
                const pdsMap = {};
                pdsData.forEach(pds => {
                    if (pds.user_id) {
                        pdsMap[pds.user_id] = pds;
                    }
                });

                // Enrich employees with PDS completion percentage
                const enrichedEmployees = employeesData.map(employee => {
                    const pds = pdsMap[employee.id];
                    const completion = pds?.form_data ? calculatePdsCompletion(pds.form_data) : 0;
                    
                    // Get initials
                    const firstName = employee.first_name || '';
                    const lastName = employee.last_name || '';
                    const initials = firstName && lastName 
                        ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
                        : employee.name ? employee.name.substring(0, 2).toUpperCase() : 'NA';

                    // Format role name (Title Case)
                    const roleName = employee.role?.name || employee.roles?.[0]?.name || '';
                    const formattedRole = roleName 
                        ? roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase()
                        : 'N/A';

                    return {
                        ...employee,
                        initials,
                        role: formattedRole,
                        percentage: completion,
                        pdsStatus: pds?.status || 'no-pds',
                        pdsId: pds?.id || null
                    };
                });

                setEmployees(enrichedEmployees);
                setFilteredEmployees(enrichedEmployees);
            } catch (err) {
                const message = err?.response?.data?.message || err.message || "Failed to load employees.";
                setError(message);
                showError(message);
            } finally {
                setInitializing(false);
            }
        };

        fetchEmployees();
    }, [showError]);

    // Filter employees based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredEmployees(employees);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = employees.filter(employee => {
            const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.toLowerCase();
            const email = (employee.email || '').toLowerCase();
            const employeeId = (employee.employee_id || '').toString();
            const position = (employee.position?.title || '').toLowerCase();
            const role = (employee.role || '').toLowerCase();

            return fullName.includes(term) ||
                   email.includes(term) ||
                   employeeId.includes(term) ||
                   position.includes(term) ||
                   role.includes(term);
        });

        setFilteredEmployees(filtered);
    }, [searchTerm, employees]);

    const handleAction = useCallback((action, employeeId) => {
        const employee = employees.find(emp => emp.id === employeeId);
        if (!employee) return;

        if (action === 'View') {
            setViewingEmployee(employee);
        } else if (action === 'Edit') {
            setEditingEmployee(employee);
        } else if (action === 'Delete') {
            handleDelete(employee);
        }
    }, [employees]);

    const handleDelete = async (employee) => {
        const employeeName = employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'this employee';
        
        const confirmDelete = window.confirm(
            `Are you sure you want to delete ${employeeName}? This action cannot be undone.`
        );
        
        if (!confirmDelete) return;

        try {
            setLoading(true);
            await deleteAccount(employee.id);
            
            // Remove from state
            setEmployees(prev => prev.filter(emp => emp.id !== employee.id));
            setFilteredEmployees(prev => prev.filter(emp => emp.id !== employee.id));
            
            showSuccess('Employee deleted successfully');
            setError(null);
        } catch (err) {
            const message = err?.response?.data?.message || err.message || "Delete failed.";
            showError(message);
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmployeeUpdate = useCallback((updatedEmployee) => {
        setEmployees(prev =>
            prev.map(emp => (emp.id === updatedEmployee.id ? updatedEmployee : emp))
        );
        setFilteredEmployees(prev =>
            prev.map(emp => (emp.id === updatedEmployee.id ? updatedEmployee : emp))
        );
        setEditingEmployee(null);
    }, []);

    const handleCloseViewModal = () => {
        setViewingEmployee(null);
    };

    const handleCloseEditModal = () => {
        setEditingEmployee(null);
        setError(null);
    };

    if (initializing) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-center items-center py-12">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Manage Employees
                </h1>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {/* Search Bar */}
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    {/* View Mode Toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                viewMode === 'cards'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Cards
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                viewMode === 'table'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Table
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Results Count */}
            <div className="text-sm text-gray-600">
                Showing {filteredEmployees.length} of {employees.length} employees
            </div>

            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
                    <LoadingSpinner />
                </div>
            )}

            {/* Employee Views */}
            {filteredEmployees.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    {searchTerm ? 'No employees found matching your search.' : 'No employees found.'}
                </div>
            ) : (
                viewMode === 'cards' ? (
                    <EmployeeCardsView employees={filteredEmployees} onAction={handleAction} />
                ) : (
                    <EmployeeTableView employees={filteredEmployees} onAction={handleAction} />
                )
            )}

            {/* View Employee Modal */}
            {viewingEmployee && (
                <EmployeeViewModal
                    employee={viewingEmployee}
                    onClose={handleCloseViewModal}
                />
            )}

            {/* Edit Employee Modal */}
            {editingEmployee && (
                <EditAccountModal
                    account={editingEmployee}
                    onClose={handleCloseEditModal}
                    onUpdate={handleEmployeeUpdate}
                    loading={loading}
                />
            )}
        </div>
    );
}

export default EmployeeManager;

