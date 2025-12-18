import React, { useState } from 'react';
import { Eye, CheckCircle, FileEdit, XCircle } from 'lucide-react';
import { reviewPds } from '../../../api/pds/pds';
import { useNotification } from '../../../hooks/useNotification';
import { useAuth } from '../../../hooks/useAuth';
import { usePendingPdsApprovals, useInvalidateApprovalQueries } from '../../../hooks/useApprovalData';
import PdsReviewModal from './PdsReviewModal';
import LoadingSpinner from '../../../components/Loading/LoadingSpinner';
import TableActionButton from '../../ui/TableActionButton';

function PdsReviewList({ searchQuery: externalSearchQuery = '', onReview }) {
    const { showSuccess, showError } = useNotification();
    const { user } = useAuth();
    const [selectedPds, setSelectedPds] = useState(null);
    const searchQuery = externalSearchQuery;

    // Use React Query to fetch PDS data with caching
    const { data: pendingPds = [], isLoading: loading } = usePendingPdsApprovals(user);
    const { invalidateAllApprovalQueries } = useInvalidateApprovalQueries();

    const handleReview = async (pdsId, action, comments = null) => {
        try {
            const actionMessage = action === 'approve' ? 'approved' : (action === 'for-revision' ? 'sent for revision' : 'declined');
            const response = await reviewPds(pdsId, action, comments);
            showSuccess(`PDS ${actionMessage} successfully`);
            
            if (action === 'approve' && response?.notification) {
                showSuccess('PDS approved! The employee has been notified.');
            }
            
            // Invalidate approval queries to refetch fresh data
            invalidateAllApprovalQueries();
            setSelectedPds(null);
            // Notify parent to update count
            if (onReview) {
                onReview();
            }
        } catch (err) {
            console.error('Error reviewing PDS:', err);
            showError(err.response?.data?.message || `Failed to ${action} PDS`);
        }
    };

    // Filter PDS list based on search query
    const getFilteredPdsList = () => {
        if (!searchQuery.trim()) {
            return pendingPds;
        }
        
        const query = searchQuery.toLowerCase().trim();
        return pendingPds.filter(pds => {
            const name = (pds.user?.name || '').toLowerCase();
            const email = (pds.user?.email || '').toLowerCase();
            const employeeId = (pds.user?.employee_id || '').toLowerCase();
            
            return name.includes(query) || 
                   email.includes(query) || 
                   employeeId.includes(query);
        });
    };
    
    const displayedPdsList = getFilteredPdsList();

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <LoadingSpinner text="Loading PDS submissions..." />
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg p-6">
            {displayedPdsList.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2">
                        {searchQuery.trim() 
                            ? 'No PDS found matching your search' 
                            : 'No pending PDS submissions'}
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
                                    Submitted At
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Updated
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
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
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            FOR APPROVAL
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2 items-center flex-wrap">
                                            <TableActionButton
                                                variant="blue"
                                                icon={Eye}
                                                label="View"
                                                onClick={() => setSelectedPds({ ...pds, action: 'view' })}
                                                title="View PDS"
                                            />
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
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            </div>

            {/* PDS View Modal */}
            {selectedPds && selectedPds.action === 'view' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <PdsReviewModal
                        pds={selectedPds}
                        onClose={() => {
                            setSelectedPds(null);
                        }}
                        onApprove={() => handleReview(selectedPds.id, 'approve')}
                        onDecline={(comments) => handleReview(selectedPds.id, 'decline', comments)}
                        onForRevision={(comments) => handleReview(selectedPds.id, 'for-revision', comments)}
                        onDeclineClick={() => {
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
        </div>
    );
}

export default PdsReviewList;

