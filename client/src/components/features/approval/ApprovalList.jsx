import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LEAVE_STATUS, LEAVE_STATUS_LABELS } from '../../../data/leaveTypes';
import { useNotification } from '../../../hooks/useNotification';
import PdsReviewList from '../pds/PdsReviewList';
import { getAllPds } from '../../../api/pds/pds';
import { getMyPendingApprovals, approveLeaveApplication, getLeaveApplications } from '../../../api/leave/leaveApplications';
import { useAuth } from '../../../hooks/useAuth';
import { getUserRole } from '../../../utils/userHelpers';
import { getAllMasterLists } from '../../../api/master-lists/masterLists';
import LeaveApprovalModal from '../leave/LeaveApprovalModal';

function ApprovalList() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [approvalModalLeave, setApprovalModalLeave] = useState(null);
  const [activeTab, setActiveTab] = useState('leave'); // 'leave' or 'pds'
  const [searchQuery, setSearchQuery] = useState('');
  const [leaveCount, setLeaveCount] = useState(0);
  const [pdsCount, setPdsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userApprovalNameIds, setUserApprovalNameIds] = useState([]);

  useEffect(() => {
    loadPendingApprovals();
    if (user) {
      loadUserApprovalNames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const role = getUserRole(user);
      
      // If user is HR or Admin, get all pending approvals
      if (role === 'hr' || role === 'admin') {
        // For HR/Admin, fetch all pending leaves and PDS
        const [leavesResponse, pdsResponse] = await Promise.all([
          getLeaveApplications({ status: 'pending' }),
          getAllPds('pending')
        ]);
        
        setApprovals(leavesResponse || []);
        setLeaveCount(leavesResponse?.length || 0);
        setPdsCount(pdsResponse.pds?.length || 0);
      } else {
        // For regular approvers, get only their assigned leave approvals (no PDS)
        const response = await getMyPendingApprovals();
        setApprovals(response.leaves || []);
        setLeaveCount(response.leaves?.length || 0);
        setPdsCount(0); // Regular approvers don't have access to PDS
      }
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
      showError('Failed to load pending approvals');
      setApprovals([]);
      setLeaveCount(0);
      setPdsCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Refresh counts when switching tabs
  useEffect(() => {
    const role = getUserRole(user);
    const isHROrAdmin = role === 'hr' || role === 'admin';
    
    // If user is not HR/Admin and somehow on PDS tab, switch back to leave tab
    if (activeTab === 'pds' && !isHROrAdmin) {
      setActiveTab('leave');
    } else if (activeTab === 'pds') {
      loadPendingApprovals();
    }
  }, [activeTab, user]);

  // Update leave count when approvals change
  useEffect(() => {
    setLeaveCount(approvals.length);
  }, [approvals]);

  const handleApprove = async (approvalData) => {
    try {
      await approveLeaveApplication(approvalData.id, {
        status: 'approved',
        approval_remarks: approvalData.approval_remarks || 'Approved',
        signature: approvalData.signature
      });
      showSuccess('Application approved successfully');
      setApprovalModalLeave(null);
      setSelectedApproval(null);
      loadPendingApprovals(); // Reload the list
    } catch (err) {
      showError(err?.response?.data?.message || 'Failed to approve application');
    }
  };

  const handleApproveClick = (approval) => {
    setApprovalModalLeave(approval);
  };

  const handleReject = async (approvalId, remarks) => {
    if (!remarks || !remarks.trim()) {
      showError('Please provide a reason for rejection');
      return;
    }

    try {
      await approveLeaveApplication(approvalId, {
        status: 'rejected',
        approval_remarks: remarks
      });
      showSuccess('Application rejected');
      setSelectedApproval(null);
      loadPendingApprovals(); // Reload the list
    } catch (err) {
      showError(err?.response?.data?.message || 'Failed to reject application');
    }
  };

  const handlePdsReview = async () => {
    // Refresh PDS count after review
    await loadPendingApprovals();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'VL':
        return '🏖️';
      case 'SL':
        return '🏥';
      case 'SPL':
        return '🎉';
      default:
        return '📋';
    }
  };

  // Filter leave applications based on search query
  const getFilteredApprovals = () => {
    if (!searchQuery.trim()) {
      return approvals;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return approvals.filter(approval => {
      const employeeName = approval.user 
        ? `${approval.user.first_name} ${approval.user.last_name}`.toLowerCase()
        : '';
      const employeeId = (approval.user?.employee_id || '').toLowerCase();
      const leaveType = (approval.leave_type?.name || '').toLowerCase();
      const reason = (approval.remarks || '').toLowerCase();
      
      return employeeName.includes(query) || 
             employeeId.includes(query) || 
             leaveType.includes(query) ||
             reason.includes(query);
    });
  };

  // Check if user has already approved/rejected at their stage
  const hasUserAlreadyDecided = (approval) => {
    if (!user || !user.id) return false;

    // Check if user has already approved at Stage 1
    if (approval.leave_credit_officer_approved_by === user.id) {
      return true;
    }
    // Check if user has already approved at Stage 2
    if (approval.recommendation_approver_approved_by === user.id) {
      return true;
    }
    // Check if user has already approved at Stage 3
    if (approval.leave_approver_approved_by === user.id) {
      return true;
    }
    return false;
  };

  // Check if it's the current user's turn to approve a leave application
  // Uses the is_user_turn flag from the API if available, otherwise calculates it
  // IMPORTANT: User can only approve ONCE at their assigned stage
  const isUserTurnToApprove = (approval) => {
    // If user has already decided at their stage, they cannot approve again
    if (hasUserAlreadyDecided(approval)) {
      return false;
    }

    // If API provides the flag, use it
    if (approval.is_user_turn !== undefined) {
      return approval.is_user_turn;
    }

    // Fallback calculation
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
    if (!approval.leave_credit_officer_approved) {
      // It's Stage 1 - check if user is the Leave Credit Authorized Officer
      return userApprovalNameIds.includes(approval.leave_credit_authorized_officer_id);
    }
    
    // Stage 2: Recommendation Officer can only approve after Stage 1
    if (!approval.recommendation_approver_approved) {
      // It's Stage 2 - check if user is the Recommendation Officer AND Stage 1 is approved
      if (!approval.leave_credit_officer_approved) {
        return false; // Stage 1 must be approved first
      }
      return userApprovalNameIds.includes(approval.recommendation_approver_id);
    }
    
    // Stage 3: Leave Approver can only approve after Stage 2
    if (!approval.leave_approver_approved) {
      // It's Stage 3 - check if user is the Leave Approver AND Stages 1 & 2 are approved
      if (!approval.leave_credit_officer_approved || !approval.recommendation_approver_approved) {
        return false; // Previous stages must be approved first
      }
      return userApprovalNameIds.includes(approval.leave_approver_id);
    }
    
    // All stages completed or user is not assigned as any approver
    return false;
  };

  // Get current stage label
  const getCurrentStageLabel = (approval) => {
    if (approval.current_stage === 'leave_credit_officer') {
      return 'Stage 1: Leave Credit Officer';
    } else if (approval.current_stage === 'recommendation_approver') {
      return 'Stage 2: Recommendation Approver';
    } else if (approval.current_stage === 'leave_approver') {
      return 'Stage 3: Leave Approver';
    } else if (approval.current_stage === 'completed') {
      return 'All Stages Completed';
    }
    
    // Fallback calculation
    if (!approval.leave_credit_officer_approved) {
      return 'Stage 1: Leave Credit Officer';
    } else if (!approval.recommendation_approver_approved) {
      return 'Stage 2: Recommendation Approver';
    } else if (!approval.leave_approver_approved) {
      return 'Stage 3: Leave Approver';
    }
    return 'Completed';
  };

  // Get stage status info
  const getStageStatusInfo = (approval) => {
    const stages = [
      {
        name: 'Leave Credit Officer',
        approved: approval.leave_credit_officer_approved || false,
        approver: approval.leave_credit_authorized_officer?.name || 'N/A',
        isCurrent: approval.current_stage === 'leave_credit_officer'
      },
      {
        name: 'Recommendation Approver',
        approved: approval.recommendation_approver_approved || false,
        approver: approval.recommendation_approver?.name || 'N/A',
        isCurrent: approval.current_stage === 'recommendation_approver'
      },
      {
        name: 'Leave Approver',
        approved: approval.leave_approver_approved || false,
        approver: approval.leave_approver?.name || 'N/A',
        isCurrent: approval.current_stage === 'leave_approver'
      }
    ];
    return stages;
  };

  const displayedApprovals = getFilteredApprovals();
  const role = getUserRole(user);
  const isHROrAdmin = role === 'hr' || role === 'admin';

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setActiveTab('leave');
                setSearchQuery('');
              }}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors relative ${
                activeTab === 'leave'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Leave Applications
              {leaveCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                  {leaveCount > 99 ? '99+' : leaveCount}
                </span>
              )}
            </button>
            {/* Only show PDS tab for HR/Admin */}
            {isHROrAdmin && (
              <button
                onClick={() => {
                  setActiveTab('pds');
                  setSearchQuery('');
                }}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors relative ${
                  activeTab === 'pds'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                PDS Submissions
                {pdsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                    {pdsCount > 99 ? '99+' : pdsCount}
                  </span>
                )}
              </button>
            )}
          </div>
          
          {/* Search Bar - Show for both tabs */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder={activeTab === 'pds' 
                  ? "Search by name, email, employee ID..." 
                  : "Search by name, employee ID, leave type..."}
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

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading approvals...</div>
      ) : activeTab === 'pds' ? (
        <PdsReviewList searchQuery={searchQuery} onReview={handlePdsReview} />
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Pending Leave Approvals</h2>

        {displayedApprovals.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2">
              {searchQuery.trim() 
                ? 'No leave applications found matching your search' 
                : 'No pending approvals'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedApprovals.map((approval) => {
              const employeeName = approval.user 
                ? `${approval.user.first_name} ${approval.user.middle_initial || ''} ${approval.user.last_name}`.trim()
                : 'Unknown';
              const leaveTypeName = approval.leave_type?.name || 'Unknown';
              const leaveTypeCode = approval.leave_type?.code || '';
              
              return (
                <div
                  key={approval.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedApproval(approval)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getTypeIcon(leaveTypeCode)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{leaveTypeName}</h3>
                        <p className="text-xs text-gray-500">{employeeName}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                        Pending
                      </span>
                      {approval.current_stage && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          isUserTurnToApprove(approval) 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getCurrentStageLabel(approval)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <p><strong>Date:</strong> {new Date(approval.start_date).toLocaleDateString()} - {new Date(approval.end_date).toLocaleDateString()}</p>
                    <p><strong>Days:</strong> {approval.working_days} {approval.working_days === 1 ? 'day' : 'days'}</p>
                    {approval.remarks && (
                      <p className="truncate"><strong>Reason:</strong> {approval.remarks}</p>
                    )}
                  </div>

                  {/* Approval Stage Status */}
                  <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                    <p className="font-semibold text-gray-700 mb-1">Approval Status:</p>
                    {getStageStatusInfo(approval).map((stage, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          stage.approved ? 'bg-green-500' : 
                          stage.isCurrent ? 'bg-yellow-500' : 
                          'bg-gray-300'
                        }`}></span>
                        <span className={stage.isCurrent ? 'font-semibold text-gray-900' : 'text-gray-600'}>
                          {stage.name}: {stage.approved ? '✓ Approved' : stage.isCurrent ? '⏳ Waiting' : '⏸ Pending'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-2">
                    {hasUserAlreadyDecided(approval) ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/leave-application/${approval.id}/track`);
                        }}
                        className="w-full px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Already Processed - View Details
                      </button>
                    ) : isUserTurnToApprove(approval) ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveClick(approval);
                          }}
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApproval({ ...approval, action: 'reject' });
                          }}
                          className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/leave-application/${approval.id}/track`);
                        }}
                        className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {approval.user_approver_role ? 'View & Wait for Turn' : 'View Application'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        </div>
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
      {selectedApproval && selectedApproval.action === 'reject' && (
        <RejectModal
          approval={selectedApproval}
          onClose={() => setSelectedApproval(null)}
          onReject={(remarks) => handleReject(selectedApproval.id, remarks)}
        />
      )}
    </div>
  );
}

function RejectModal({ approval, onClose, onReject }) {
  const [remarks, setRemarks] = useState('');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-medium text-gray-900">Reject Application</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <strong>{approval.user ? `${approval.user.first_name} ${approval.user.last_name}` : 'Unknown'}</strong> - {approval.leave_type?.name || 'Unknown'} ({approval.working_days} days)
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
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApprovalList;

