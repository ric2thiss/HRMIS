import React, { useState, useEffect } from 'react';
import { getAllPds, getEmployeesWithoutPds, notifyEmployee, reviewPds, deletePds, returnPdsToOwner } from '../../../api/pds/pds';
import { useNotification } from '../../../context/NotificationContext';
import PdsReviewModal from './PdsReviewModal';
import LoadingSpinner from '../../../components/Loading/LoadingSpinner';

function ManagePdsTable() {
    const { showSuccess, showError } = useNotification();
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'draft', 'approved', 'without-pds'
    const [pdsList, setPdsList] = useState([]);
    const [employeesWithoutPds, setEmployeesWithoutPds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPds, setSelectedPds] = useState(null);
    const [notifying, setNotifying] = useState({});

    useEffect(() => {
        loadData();
    }, [activeFilter]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            if (activeFilter === 'without-pds') {
                const response = await getEmployeesWithoutPds();
                setEmployeesWithoutPds(response.employees || []);
                setPdsList([]);
            } else {
                // Map frontend filter to backend status
                let statusFilter = null;
                if (activeFilter === 'draft') {
                    statusFilter = 'draft';
                } else if (activeFilter === 'approved') {
                    statusFilter = 'approved';
                } else if (activeFilter === 'all') {
                    statusFilter = null; // Get all
                }
                
                const response = await getAllPds(statusFilter);
                // Additional client-side filtering to ensure correct status
                let filteredPds = response.pds || [];
                if (activeFilter === 'draft') {
                    filteredPds = filteredPds.filter(pds => pds.status === 'draft');
                } else if (activeFilter === 'approved') {
                    filteredPds = filteredPds.filter(pds => pds.status === 'approved');
                }
                setPdsList(filteredPds);
                setEmployeesWithoutPds([]);
            }
        } catch (err) {
            console.error('Error loading PDS data:', err);
            showError('Failed to load PDS data');
        } finally {
            setLoading(false);
        }
    };

    const handleNotify = async (employeeId) => {
        if (notifying[employeeId]) return;

        try {
            setNotifying(prev => ({ ...prev, [employeeId]: true }));
            await notifyEmployee(employeeId);
            showSuccess('Notification sent to employee successfully');
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to send notification');
        } finally {
            setNotifying(prev => ({ ...prev, [employeeId]: false }));
        }
    };

    const handleReview = async (pdsId, action, comments = null) => {
        try {
            const response = await reviewPds(pdsId, action, comments);
            showSuccess(`PDS ${action}d successfully`);
            
            if (action === 'approve' && response?.notification) {
                showSuccess('PDS approved! The employee has been notified.');
            }
            
            loadData(); // Refresh list
            setSelectedPds(null);
        } catch (err) {
            console.error('Error reviewing PDS:', err);
            showError(err.response?.data?.message || `Failed to ${action} PDS`);
        }
    };

    const handleDelete = async (pdsId, employeeName) => {
        if (!window.confirm(`Are you sure you want to delete the PDS for ${employeeName}? This action cannot be undone.`)) {
            return;
        }

        try {
            await deletePds(pdsId);
            showSuccess('PDS deleted successfully');
            loadData(); // Refresh list
        } catch (err) {
            console.error('Error deleting PDS:', err);
            showError(err.response?.data?.message || 'Failed to delete PDS');
        }
    };

    const handleReturnToOwner = async (pdsId, employeeName) => {
        if (!window.confirm(`Are you sure you want to return the PDS to ${employeeName}? The status will be changed to draft so they can update it.`)) {
            return;
        }

        try {
            await returnPdsToOwner(pdsId);
            showSuccess('PDS returned to owner successfully. Employee can now update it.');
            loadData(); // Refresh list
        } catch (err) {
            console.error('Error returning PDS:', err);
            showError(err.response?.data?.message || 'Failed to return PDS to owner');
        }
    };

    const statusColors = {
        draft: 'bg-blue-100 text-blue-800',
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        declined: 'bg-red-100 text-red-800',
    };

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex space-x-2 border-b border-gray-200">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeFilter === 'all'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        All PDS
                    </button>
                    <button
                        onClick={() => setActiveFilter('draft')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeFilter === 'draft'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Draft
                    </button>
                    <button
                        onClick={() => setActiveFilter('approved')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeFilter === 'approved'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Completed
                    </button>
                    <button
                        onClick={() => setActiveFilter('without-pds')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeFilter === 'without-pds'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Employees Without PDS
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                {loading ? (
                    <LoadingSpinner text="Loading PDS data..." />
                ) : activeFilter === 'without-pds' ? (
                    // Employees Without PDS Table
                    employeesWithoutPds.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-2">All employees have submitted their PDS</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employee Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employee ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employment Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {employeesWithoutPds.map((employee) => (
                                        <tr key={employee.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {employee.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {employee.employee_id || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {employee.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {(employee.employmentTypes || employee.employment_types)?.[0]?.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleNotify(employee.id)}
                                                    disabled={notifying[employee.id]}
                                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {notifying[employee.id] ? 'Sending...' : 'Notify to Fill PDS'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    // PDS List Table
                    pdsList.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="mt-2">No PDS found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employee ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Submitted At
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Last Updated
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pdsList.map((pds) => (
                                        <tr key={pds.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {pds.user?.name || 'N/A'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {pds.user?.email || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {pds.user?.employee_id || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    statusColors[pds.status] || 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {pds.status?.toUpperCase() || 'DRAFT'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {pds.submitted_at 
                                                    ? new Date(pds.submitted_at).toLocaleDateString()
                                                    : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {pds.updated_at 
                                                    ? new Date(pds.updated_at).toLocaleDateString()
                                                    : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => setSelectedPds({ ...pds, action: 'view' })}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    View
                                                </button>
                                                {pds.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => setSelectedPds({ ...pds, action: 'approve' })}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedPds({ ...pds, action: 'decline' })}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Decline
                                                        </button>
                                                    </>
                                                )}
                                                {pds.status === 'approved' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleReturnToOwner(pds.id, pds.user?.name || 'employee')}
                                                            className="text-orange-600 hover:text-orange-900"
                                                            title="Return to owner for updates"
                                                        >
                                                            Return to Owner
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(pds.id, pds.user?.name || 'employee')}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Delete PDS"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>

            {/* Review Modal */}
            {selectedPds && (
                <PdsReviewModal
                    pds={selectedPds}
                    onClose={() => setSelectedPds(null)}
                    onApprove={() => handleReview(selectedPds.id, 'approve')}
                    onDecline={(comments) => handleReview(selectedPds.id, 'decline', comments)}
                />
            )}
        </div>
    );
}

export default ManagePdsTable;

