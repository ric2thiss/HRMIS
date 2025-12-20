import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import EmployeeCardsView from './EmployeeCardsView';
import EmployeeTableView from './EmployeeTableView';
import EmployeeViewModal from './EmployeeViewModal';
import EditAccountModal from '../accounts/EditAccountModal';
import deleteAccount from '../../../api/user/delete_account';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useEmployeesStore } from '../../../stores/employeesStore';
import LoadingSpinner from '../../../components/Loading/LoadingSpinner';

function EmployeeManager() {
    const showSuccess = useNotificationStore((state) => state.showSuccess);
    const showError = useNotificationStore((state) => state.showError);
    
    // Use employees store with caching
    const { 
        getEmployees, 
        employees, 
        loading: storeLoading, 
        updateEmployeeInCache, 
        removeEmployeeFromCache 
    } = useEmployeesStore();
    
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [viewMode, setViewMode] = useState('cards');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingEmployee, setViewingEmployee] = useState(null);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState(null);

    // Fetch employees from store (uses cache if available)
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setInitializing(true);
                setError(null);
                
                // This will use cache if available, or fetch if expired
                await getEmployees();
            } catch (err) {
                const message = err?.response?.data?.message || err.message || "Failed to load employees.";
                setError(message);
                showError(message);
            } finally {
                setInitializing(false);
            }
        };

        fetchEmployees();
    }, [getEmployees, showError]);

    // Filter employees based on search term - updates when employees change (from cache or edits)
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

    // Update employees list when store updates (real-time updates)
    useEffect(() => {
        // This effect ensures filteredEmployees updates when employees from store change
        if (!searchTerm.trim()) {
            setFilteredEmployees(employees);
        } else {
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
        }
    }, [employees, searchTerm]);

    const handleDelete = async (employee) => {
        const employeeName = employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'this employee';
        
        const confirmDelete = window.confirm(
            `Are you sure you want to delete ${employeeName}? This action cannot be undone.`
        );
        
        if (!confirmDelete) return;

        try {
            setLoading(true);
            await deleteAccount(employee.id);
            
            // Remove from cache (this will automatically update the employees list)
            removeEmployeeFromCache(employee.id);
            
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
        // Update in cache (this will automatically update the employees list and DOM)
        updateEmployeeInCache(updatedEmployee);
        setEditingEmployee(null);
        showSuccess('Employee updated successfully');
    }, [updateEmployeeInCache, showSuccess]);

    const handleCloseViewModal = () => {
        setViewingEmployee(null);
    };

    const handleCloseEditModal = () => {
        setEditingEmployee(null);
        setError(null);
    };

    if (initializing || storeLoading) {
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

