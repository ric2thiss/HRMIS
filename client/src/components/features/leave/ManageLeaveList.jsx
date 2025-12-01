import React, { useState } from 'react';
import { mockLeaveApplications } from '../../../data/mockLeaveData';
import { LEAVE_STATUS, LEAVE_STATUS_LABELS } from '../../../data/leaveTypes';
import { useNotification } from '../../../hooks/useNotification';

function ManageLeaveList() {
  const { showSuccess, showError } = useNotification();
  const [leaves, setLeaves] = useState(mockLeaveApplications);
  const [filter, setFilter] = useState('all');
  const [selectedLeave, setSelectedLeave] = useState(null);

  const filteredLeaves = leaves.filter(leave => {
    if (filter === 'all') return true;
    return leave.status === filter;
  });

  const handleApprove = (leaveId) => {
    if (window.confirm('Are you sure you want to approve this leave application?')) {
      setLeaves(prev => prev.map(leave => 
        leave.id === leaveId
          ? { 
              ...leave, 
              status: LEAVE_STATUS.APPROVED,
              approved_by: 'Current User',
              approved_date: new Date().toISOString().split('T')[0],
              remarks: 'Approved'
            }
          : leave
      ));
      showSuccess('Leave application approved successfully');
      setSelectedLeave(null);
    }
  };

  const handleReject = (leaveId, remarks) => {
    if (!remarks || !remarks.trim()) {
      showError('Please provide a reason for rejection');
      return;
    }

    setLeaves(prev => prev.map(leave => 
      leave.id === leaveId
        ? { 
            ...leave, 
            status: LEAVE_STATUS.REJECTED,
            approved_by: 'Current User',
            approved_date: new Date().toISOString().split('T')[0],
            remarks: remarks
          }
        : leave
    ));
    showSuccess('Leave application rejected');
    setSelectedLeave(null);
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

      {filteredLeaves.length === 0 ? (
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{leave.employee_name}</div>
                    <div className="text-xs text-gray-500">ID: {leave.employee_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{leave.leave_type}</div>
                    <div className="text-xs text-gray-500">Code: {leave.leave_type_code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-gray-500">to {new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {leave.days} {leave.days === 1 ? 'day' : 'days'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{leave.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(leave.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {leave.status === LEAVE_STATUS.PENDING ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(leave.id)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setSelectedLeave({ ...leave, action: 'reject' })}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">
                        {leave.approved_by && `By ${leave.approved_by}`}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            <strong>{leave.employee_name}</strong> - {leave.leave_type} ({leave.days} days)
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

