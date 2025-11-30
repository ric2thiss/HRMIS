import React, { useState } from 'react';
import { mockLeaveApplications } from '../../../data/mockLeaveData';
import { LEAVE_STATUS, LEAVE_STATUS_LABELS } from '../../../data/leaveTypes';
import { useNotification } from '../../../context/NotificationContext';
import PdsReviewList from '../pds/PdsReviewList';

function ApprovalList() {
  const { showSuccess, showError } = useNotification();
  const [approvals, setApprovals] = useState(
    mockLeaveApplications.filter(leave => leave.status === LEAVE_STATUS.PENDING)
  );
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [activeTab, setActiveTab] = useState('leave'); // 'leave' or 'pds'

  const handleApprove = (approvalId) => {
    if (window.confirm('Are you sure you want to approve this application?')) {
      setApprovals(prev => prev.filter(a => a.id !== approvalId));
      showSuccess('Application approved successfully');
      setSelectedApproval(null);
    }
  };

  const handleReject = (approvalId, remarks) => {
    if (!remarks || !remarks.trim()) {
      showError('Please provide a reason for rejection');
      return;
    }

    setApprovals(prev => prev.filter(a => a.id !== approvalId));
    showSuccess('Application rejected');
    setSelectedApproval(null);
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

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('leave')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'leave'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Leave Applications
          </button>
          <button
            onClick={() => setActiveTab('pds')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'pds'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            PDS Submissions
          </button>
        </div>

        {activeTab === 'pds' ? (
          <PdsReviewList />
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Pending Leave Approvals</h2>

        {approvals.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2">No pending approvals</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvals.map((approval) => (
              <div
                key={approval.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedApproval(approval)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getTypeIcon(approval.leave_type_code)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{approval.leave_type}</h3>
                      <p className="text-xs text-gray-500">{approval.employee_name}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                    Pending
                  </span>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Date:</strong> {new Date(approval.start_date).toLocaleDateString()} - {new Date(approval.end_date).toLocaleDateString()}</p>
                  <p><strong>Days:</strong> {approval.days}</p>
                  <p className="truncate"><strong>Reason:</strong> {approval.reason}</p>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(approval.id);
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
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>

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
            <strong>{approval.employee_name}</strong> - {approval.leave_type} ({approval.days} days)
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

