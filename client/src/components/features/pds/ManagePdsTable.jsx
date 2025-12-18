import React, { useState } from 'react';
import { Bell, Eye, CheckCircle, FileEdit, XCircle, Printer, Trash2, MessageSquare } from 'lucide-react';
import { notifyEmployee, reviewPds, deletePds, getPds } from '../../../api/pds/pds';
import { useNotification } from '../../../hooks/useNotification';
import { useAuth } from '../../../hooks/useAuth';
import { useAllPds, useEmployeesWithoutPds, usePdsCounts, useInvalidatePdsQueries } from '../../../hooks/usePdsData';
import PdsReviewModal from './PdsReviewModal';
import LoadingSpinner from '../../../components/Loading/LoadingSpinner';
import TableActionButton from '../../ui/TableActionButton';

function ManagePdsTable() {
    const { showSuccess, showError } = useNotification();
    const { user: currentUser } = useAuth();
    const [activeFilter, setActiveFilter] = useState('for-approval'); // 'all', 'for-revision', 'for-approval', 'approved', 'declined', 'no-pds'
    const [selectedPds, setSelectedPds] = useState(null);
    const [notifying, setNotifying] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingComments, setViewingComments] = useState(null);
    const [printingPds, setPrintingPds] = useState(null);

    // Use React Query hooks for data fetching with caching
    const { invalidateAllPdsQueries } = useInvalidatePdsQueries();
    
    // Determine what status to fetch based on active filter
    let statusFilter = null;
    if (activeFilter === 'for-revision') {
        statusFilter = 'declined';
    } else if (activeFilter === 'for-approval') {
        statusFilter = 'pending';
    } else if (activeFilter === 'approved') {
        statusFilter = 'approved';
    } else if (activeFilter === 'declined') {
        statusFilter = 'declined';
    }

    // Fetch data using React Query - this will use cached data when available
    const { data: allPdsList = [], isLoading: isLoadingPds } = useAllPds(activeFilter === 'no-pds' ? undefined : statusFilter);
    const { data: employeesWithoutPdsList = [], isLoading: isLoadingNoPds } = useEmployeesWithoutPds();
    const { counts } = usePdsCounts();

    // Determine which data to display based on filter
    const pdsList = activeFilter === 'no-pds' ? [] : allPdsList;
    const employeesWithoutPds = activeFilter === 'no-pds' ? employeesWithoutPdsList : [];
    const loading = activeFilter === 'no-pds' ? isLoadingNoPds : isLoadingPds;

    // Apply client-side filtering for specific tabs
    const getFilteredPdsByStatus = () => {
        if (activeFilter === 'all') {
            return pdsList;
        } else if (activeFilter === 'for-revision') {
            return pdsList.filter(pds => pds.status === 'for-revision' || pds.status === 'declined');
        } else if (activeFilter === 'for-approval') {
            return pdsList.filter(pds => pds.status === 'pending');
        } else if (activeFilter === 'approved') {
            return pdsList.filter(pds => pds.status === 'approved');
        } else if (activeFilter === 'declined') {
            return pdsList.filter(pds => pds.status === 'declined');
        }
        return pdsList;
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
            
            // Invalidate all PDS queries to refetch fresh data
            invalidateAllPdsQueries();
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
            // Invalidate all PDS queries to refetch fresh data
            invalidateAllPdsQueries();
        } catch (err) {
            console.error('Error deleting PDS:', err);
            showError(err.response?.data?.message || 'Failed to delete PDS');
        }
    };

    const handlePrintPds = async (pdsId) => {
        try {
            setPrintingPds(pdsId);
            
            // Load full PDS data
            const pdsData = await getPds(pdsId);
            
            if (!pdsData?.form_data) {
                showError('PDS data not found or incomplete');
                setPrintingPds(null);
                return;
            }

            // Open the PDS in view mode - the modal has built-in print functionality
            // We'll automatically trigger print after the modal opens
            setSelectedPds({ ...pdsData, action: 'view', autoPrint: true });
            
            setPrintingPds(null);
        } catch (err) {
            console.error('Error loading PDS for printing:', err);
            showError(err.response?.data?.message || 'Failed to load PDS for printing');
            setPrintingPds(null);
        }
    };

    const statusColors = {
        draft: 'bg-blue-100 text-blue-800',
        pending: 'bg-yellow-100 text-yellow-800',
        'for-approval': 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        declined: 'bg-red-100 text-red-800',
        'for-revision': 'bg-orange-100 text-orange-800',
    };
    
    // Helper function to format status display
    const formatStatus = (status) => {
        const statusMap = {
            'draft': 'Draft',
            'pending': 'For Approval',
            'for-approval': 'For Approval',
            'approved': 'Approved',
            'declined': 'Declined',
            'for-revision': 'For Revision',
        };
        return statusMap[status] || status?.toUpperCase() || 'UNKNOWN';
    };

    // Filter PDS list based on search query and selected PDS
    const getFilteredPdsList = () => {
        let filtered = getFilteredPdsByStatus();
        
        // First filter: show only selected PDS when viewing
        if (selectedPds && selectedPds.action === 'view') {
            filtered = filtered.filter(pds => pds.id === selectedPds.id);
        }
        
        // Second filter: apply search query for all tabs
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(pds => {
                const name = (pds.user?.name || '').toLowerCase();
                const email = (pds.user?.email || '').toLowerCase();
                const employeeId = (pds.user?.employee_id || '').toLowerCase();
                const status = (pds.status || '').toLowerCase();
                
                return name.includes(query) || 
                       email.includes(query) || 
                       employeeId.includes(query) ||
                       status.includes(query);
            });
        }
        
        return filtered;
    };

    // Filter employees without PDS based on search query
    const getFilteredEmployeesWithoutPds = () => {
        if (!searchQuery.trim()) {
            return employeesWithoutPds;
        }
        
        const query = searchQuery.toLowerCase().trim();
        return employeesWithoutPds.filter(employee => {
            const name = (employee.name || '').toLowerCase();
            const email = (employee.email || '').toLowerCase();
            const employeeId = (employee.employee_id || '').toLowerCase();
            const employmentType = ((employee.employmentTypes || employee.employment_types)?.[0]?.name || '').toLowerCase();
            
            return name.includes(query) || 
                   email.includes(query) || 
                   employeeId.includes(query) ||
                   employmentType.includes(query);
        });
    };
    
    const displayedPdsList = getFilteredPdsList();
    const displayedEmployeesWithoutPds = getFilteredEmployeesWithoutPds();

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <div className="flex space-x-2 flex-wrap">
                        <button
                            onClick={() => {
                                setActiveFilter('all');
                            }}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors relative ${
                                activeFilter === 'all'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            All PDS
                            {counts.allPdsCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                                    {counts.allPdsCount > 99 ? '99+' : counts.allPdsCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setActiveFilter('for-revision');
                            }}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors relative ${
                                activeFilter === 'for-revision'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            For Revision
                            {counts.forRevisionCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                                    {counts.forRevisionCount > 99 ? '99+' : counts.forRevisionCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setActiveFilter('for-approval');
                            }}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors relative ${
                                activeFilter === 'for-approval'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            For Approval
                            {counts.pendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                                    {counts.pendingCount > 99 ? '99+' : counts.pendingCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setActiveFilter('approved');
                            }}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors relative ${
                                activeFilter === 'approved'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Approved
                            {counts.approvedCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                                    {counts.approvedCount > 99 ? '99+' : counts.approvedCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setActiveFilter('declined');
                            }}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors relative ${
                                activeFilter === 'declined'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Declined
                            {counts.declinedCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                                    {counts.declinedCount > 99 ? '99+' : counts.declinedCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setActiveFilter('no-pds');
                            }}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors relative ${
                                activeFilter === 'no-pds'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            No PDS
                            {counts.noPdsCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                                    {counts.noPdsCount > 99 ? '99+' : counts.noPdsCount}
                                </span>
                            )}
                        </button>
                    </div>
                    
                    {/* Search Bar - Available in all tabs */}
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by name, email, employee ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                            />
                            <svg
                                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-gray-500 hover:text-gray-700 p-1"
                                title="Clear search"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                {loading ? (
                    <LoadingSpinner text="Loading PDS data..." />
                ) : activeFilter === 'no-pds' ? (
                    // Employees Without PDS Table
                    displayedEmployeesWithoutPds.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-2">
                                {searchQuery.trim() 
                                    ? 'No employees found matching your search' 
                                    : 'All employees have submitted their PDS'}
                            </p>
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
                                    {displayedEmployeesWithoutPds.map((employee) => (
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
                                                <TableActionButton
                                                    variant="blue"
                                                    icon={Bell}
                                                    label={notifying[employee.id] ? 'Sending...' : 'Notify to Fill PDS'}
                                                    onClick={() => handleNotify(employee.id)}
                                                    disabled={notifying[employee.id]}
                                                    title="Send notification to employee"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    // PDS List Table
                    displayedPdsList.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="mt-2">
                                {searchQuery.trim() 
                                    ? 'No PDS found matching your search' 
                                    : 'No PDS found'}
                            </p>
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
                                    {displayedPdsList.map((pds) => (
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
                                                    {formatStatus(pds.status)}
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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2 items-center flex-nowrap">
                                                    <TableActionButton
                                                        variant="blue"
                                                        icon={Eye}
                                                        label="View"
                                                        onClick={() => setSelectedPds({ ...pds, action: 'view' })}
                                                        title="View PDS"
                                                    />
                                                    {pds.status === 'pending' && (
                                                        <>
                                                            <TableActionButton
                                                                variant="green"
                                                                icon={CheckCircle}
                                                                label="Approve"
                                                                onClick={() => setSelectedPds({ ...pds, action: 'approve' })}
                                                                title="Approve PDS"
                                                            />
                                                            <TableActionButton
                                                                variant="orange"
                                                                icon={FileEdit}
                                                                label="For Revision"
                                                                onClick={() => setSelectedPds({ ...pds, action: 'for-revision' })}
                                                                title="Request revision"
                                                            />
                                                            <TableActionButton
                                                                variant="red"
                                                                icon={XCircle}
                                                                label="Decline"
                                                                onClick={() => setSelectedPds({ ...pds, action: 'decline' })}
                                                                title="Decline PDS"
                                                            />
                                                        </>
                                                    )}
                                                    {pds.status === 'approved' && (
                                                        <>
                                                            <TableActionButton
                                                                variant="purple"
                                                                icon={Printer}
                                                                label={printingPds === pds.id ? 'Printing...' : 'Print'}
                                                                onClick={() => handlePrintPds(pds.id)}
                                                                disabled={printingPds === pds.id}
                                                                title="Print approved PDS"
                                                            />
                                                            <TableActionButton
                                                                variant="red"
                                                                icon={Trash2}
                                                                label="Delete"
                                                                onClick={() => handleDelete(pds.id, pds.user?.name || 'employee')}
                                                                title="Delete PDS"
                                                            />
                                                        </>
                                                    )}
                                                    {(pds.status === 'declined' || pds.status === 'for-revision') && (
                                                        <TableActionButton
                                                            variant="purple"
                                                            icon={MessageSquare}
                                                            label="View Comments"
                                                            onClick={() => setViewingComments(pds)}
                                                            title="View comments"
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>

            {/* PDS View - Inline below tabs */}
            {selectedPds && selectedPds.action === 'view' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <PdsReviewModal
                        pds={selectedPds}
                        onClose={() => {
                            setSelectedPds(null);
                        }}
                        onApprove={() => handleReview(selectedPds.id, 'approve')}
                        onDecline={(comments) => handleReview(selectedPds.id, 'decline', comments)}
                        onDeclineClick={() => {
                            // Close view and open decline modal
                            setSelectedPds({ ...selectedPds, action: 'decline' });
                        }}
                    />
                </div>
            )}

            {/* Review Modal for Approve/Decline/For Revision */}
            {selectedPds && selectedPds.action !== 'view' && (
                <PdsReviewModal
                    pds={selectedPds}
                    onClose={() => {
                        setSelectedPds(null);
                    }}
                    onApprove={() => handleReview(selectedPds.id, 'approve')}
                    onDecline={(comments) => handleReview(selectedPds.id, 'decline', comments)}
                    onForRevision={(comments) => handleReview(selectedPds.id, 'for-revision', comments)}
                />
            )}

            {/* Comments Modal for Declined/For Revision PDS */}
            {viewingComments && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {viewingComments.status === 'for-revision' ? 'Revision Comments' : 'Decline Comments'} - {viewingComments.user?.name}
                                </h3>
                                <button
                                    onClick={() => setViewingComments(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="mb-4">
                                <div className="mb-2">
                                    <span className="text-sm font-medium text-gray-700">Employee:</span>
                                    <span className="ml-2 text-sm text-gray-900">{viewingComments.user?.name}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="text-sm font-medium text-gray-700">Email:</span>
                                    <span className="ml-2 text-sm text-gray-900">{viewingComments.user?.email}</span>
                                </div>
                                <div className="mb-4">
                                    <span className="text-sm font-medium text-gray-700">Status:</span>
                                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                                        statusColors[viewingComments.status] || statusColors.declined
                                    }`}>
                                        {viewingComments.status === 'for-revision' ? 'FOR REVISION' : (viewingComments.status?.toUpperCase() || 'DECLINED')}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {viewingComments.status === 'for-revision' ? 'Revision Comments' : 'Decline Comments'}
                                </label>
                                <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg min-h-[150px] max-h-[400px] overflow-y-auto">
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                        {viewingComments.hr_comments || viewingComments.comments || 'No comments provided.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setViewingComments(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManagePdsTable;

