import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LEAVE_STATUS, LEAVE_STATUS_LABELS } from '../../../data/leaveTypes';
import { useNotification } from '../../../hooks/useNotification';
import { getLeaveApplications, approveLeaveApplication } from '../../../api/leave/leaveApplications';
import { useAuth } from '../../../hooks/useAuth';
import { getUserRole } from '../../../utils/userHelpers';
import { getAllMasterLists } from '../../../api/master-lists/masterLists';
import Pagination from '../../common/Pagination';
import LeaveApprovalModal from './LeaveApprovalModal';

function ManageLeaveList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [approvalModalLeave, setApprovalModalLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userApprovalNameIds, setUserApprovalNameIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadLeaves();
    if (user) {
      loadUserApprovalNames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, user]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
  }, [filter]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when items per page changes
  }, [itemsPerPage]);

  const loadUserApprovalNames = async () => {
    try {
      const masterLists = await getAllMasterLists();
      const approvalNames = masterLists.approval_names || [];
      // Get approval name IDs where the current user is assigned
      const ids = approvalNames
        .filter(an => an.user_id === user?.id && an.is_active)
        .map(an => an.id);
      setUserApprovalNameIds(ids);
    } catch (err) {
      console.error('Failed to load user approval names:', err);
    }
  };

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const data = await getLeaveApplications(params);
      setLeaves(data);
    } catch (err) {
      showError(err?.response?.data?.message || 'Failed to load leave applications');
    } finally {
      setLoading(false);
    }
  };

  // Filter is already applied in the API call, but keep this for client-side filtering if needed
  const filteredLeaves = leaves;

  // Pagination calculations
  const totalItems = filteredLeaves.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeaves = filteredLeaves.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of table when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleApprove = async (approvalData) => {
    try {
      await approveLeaveApplication(approvalData.id, { 
        status: 'approved',
        approval_remarks: approvalData.approval_remarks || 'Approved',
        signature: approvalData.signature
      });
      showSuccess('Leave application approved successfully');
      setApprovalModalLeave(null);
      setSelectedLeave(null);
      loadLeaves(); // Reload the list
    } catch (err) {
      showError(err?.response?.data?.message || 'Failed to approve leave application');
    }
  };

  const handleApproveClick = (leave) => {
    setApprovalModalLeave(leave);
  };

  const handleReject = async (leaveId, remarks) => {
    if (!remarks || !remarks.trim()) {
      showError('Please provide a reason for rejection');
      return;
    }

    try {
      await approveLeaveApplication(leaveId, { 
        status: 'rejected',
        approval_remarks: remarks
      });
      showSuccess('Leave application rejected');
      setSelectedLeave(null);
      loadLeaves(); // Reload the list
    } catch (err) {
      showError(err?.response?.data?.message || 'Failed to reject leave application');
    }
  };

  // Check if user has already approved/rejected at their stage
  const hasUserAlreadyDecided = (leave) => {
    if (!user || !user.id) return false;

    // Check if user has already approved at Stage 1
    if (leave.leave_credit_officer_approved_by === user.id) {
      return true;
    }
    // Check if user has already approved at Stage 2
    if (leave.recommendation_approver_approved_by === user.id) {
      return true;
    }
    // Check if user has already approved at Stage 3
    if (leave.leave_approver_approved_by === user.id) {
      return true;
    }
    return false;
  };

  // Check if it's the current user's turn to approve a leave application
  // Sequence: Leave Credit Authorized Officer → Recommendation Officer → Leave Approver
  // IMPORTANT: User can only approve ONCE at their assigned stage
  const isUserTurnToApprove = (leave) => {
    // If user has already decided at their stage, they cannot approve again
    if (hasUserAlreadyDecided(leave)) {
      return false;
    }

    const role = getUserRole(user);
    
    // HR/Admin can always approve (unless they already did)
    if (role === 'hr' || role === 'admin') {
      return true;
    }

    // If user has no approval name IDs, they cannot approve
    if (!userApprovalNameIds || userApprovalNameIds.length === 0) {
      return false;
    }

    // All leave types follow the 3-stage approval sequence
    // Stage 1: Leave Credit Authorized Officer must approve first
    if (!leave.leave_credit_officer_approved) {
      // It's Stage 1 - check if user is the Leave Credit Authorized Officer
      return userApprovalNameIds.includes(leave.leave_credit_authorized_officer_id);
    }
    
    // Stage 2: Recommendation Officer can only approve after Stage 1
    if (!leave.recommendation_approver_approved) {
      // It's Stage 2 - check if user is the Recommendation Officer AND Stage 1 is approved
      if (!leave.leave_credit_officer_approved) {
        return false; // Stage 1 must be approved first
      }
      return userApprovalNameIds.includes(leave.recommendation_approver_id);
    }
    
    // Stage 3: Leave Approver can only approve after Stage 2
    if (!leave.leave_approver_approved) {
      // It's Stage 3 - check if user is the Leave Approver AND Stages 1 & 2 are approved
      if (!leave.leave_credit_officer_approved || !leave.recommendation_approver_approved) {
        return false; // Previous stages must be approved first
      }
      return userApprovalNameIds.includes(leave.leave_approver_id);
    }
    
    // All stages completed or user is not assigned as any approver
    return false;
  };

  // Get current stage label
  const getCurrentStageLabel = (leave) => {
    if (!leave.leave_credit_officer_approved) {
      return 'Stage 1: Leave Credit Officer';
    } else if (!leave.recommendation_approver_approved) {
      return 'Stage 2: Recommendation Approver';
    } else if (!leave.leave_approver_approved) {
      return 'Stage 3: Leave Approver';
    }
    return 'All Stages Completed';
  };

  // Get stage status summary
  const getStageStatusSummary = (leave) => {
    const stages = [];
    if (leave.leave_credit_officer_approved) {
      stages.push('✓ Stage 1');
    } else {
      stages.push('⏳ Stage 1');
    }
    if (leave.recommendation_approver_approved) {
      stages.push('✓ Stage 2');
    } else {
      stages.push('⏸ Stage 2');
    }
    if (leave.leave_approver_approved) {
      stages.push('✓ Stage 3');
    } else {
      stages.push('⏸ Stage 3');
    }
    return stages.join(' | ');
  };

  const getStatusBadge = (status) => {
    const styles = {
      [LEAVE_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
      [LEAVE_STATUS.APPROVED]: 'bg-green-100 text-green-800',
      [LEAVE_STATUS.REJECTED]: 'bg-red-100 text-red-800',
      [LEAVE_STATUS.CANCELLED]: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles[LEAVE_STATUS.PENDING]}`}>
        {LEAVE_STATUS_LABELS[status] || status}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Leave Applications</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({leaves.length})
          </button>
          <button
            onClick={() => setFilter(LEAVE_STATUS.PENDING)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === LEAVE_STATUS.PENDING ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({leaves.filter(l => l.status === LEAVE_STATUS.PENDING).length})
          </button>
          <button
            onClick={() => setFilter(LEAVE_STATUS.APPROVED)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === LEAVE_STATUS.APPROVED ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approved ({leaves.filter(l => l.status === LEAVE_STATUS.APPROVED).length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">
          Loading leave applications...
        </div>
      ) : filteredLeaves.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No leave applications found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Range</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedLeaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {leave.user?.first_name} {leave.user?.middle_initial} {leave.user?.last_name}
                    </div>
                    <div className="text-xs text-gray-500">ID: {leave.user?.employee_id || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{leave.leave_type?.name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">Code: {leave.leave_type?.code || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-gray-500">to {new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {leave.working_days} {leave.working_days === 1 ? 'day' : 'days'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 mb-1">{getCurrentStageLabel(leave)}</div>
                      <div className="text-xs text-gray-600">{getStageStatusSummary(leave)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(leave.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => navigate(`/leave-application/${leave.id}/track`)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="View leave application details"
                      >
                        View
                      </button>
                      {leave.status === LEAVE_STATUS.PENDING && hasUserAlreadyDecided(leave) && (
                        <span className="text-xs text-gray-500 italic" title="You have already processed this application">
                          Already Processed
                        </span>
                      )}
                      {leave.status === LEAVE_STATUS.PENDING && !hasUserAlreadyDecided(leave) && isUserTurnToApprove(leave) && (
                        <>
                          <button
                            onClick={() => handleApproveClick(leave)}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Approve this leave application"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setSelectedLeave({ ...leave, action: 'reject' })}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Reject this leave application"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {leave.status === LEAVE_STATUS.PENDING && !hasUserAlreadyDecided(leave) && !isUserTurnToApprove(leave) && (
                        <span className="text-xs text-gray-500" title="Waiting for previous approver or not your turn">
                          Waiting...
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination - Always show when not loading */}
      {!loading && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* Approval Modal */}
      {approvalModalLeave && (
        <LeaveApprovalModal
          isOpen={!!approvalModalLeave}
          onClose={() => setApprovalModalLeave(null)}
          onApprove={(data) => handleApprove({ ...approvalModalLeave, ...data })}
          user={user}
          leave={approvalModalLeave}
        />
      )}

      {/* Reject Modal */}
      {selectedLeave && selectedLeave.action === 'reject' && (
        <RejectModal
          leave={selectedLeave}
          onClose={() => setSelectedLeave(null)}
          onReject={(remarks) => handleReject(selectedLeave.id, remarks)}
        />
      )}
    </div>
  );
}

function RejectModal({ leave, onClose, onReject }) {
  const [remarks, setRemarks] = useState('');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-medium text-gray-900">Reject Leave Application</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <strong>{leave.user?.first_name} {leave.user?.last_name}</strong> - {leave.leave_type?.name} ({leave.working_days} days)
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Rejection <span className="text-red-500">*</span>
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows="4"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Please provide a reason for rejection..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (remarks.trim()) {
                onReject(remarks);
              }
            }}
            disabled={!remarks.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reject Application
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManageLeaveList;

