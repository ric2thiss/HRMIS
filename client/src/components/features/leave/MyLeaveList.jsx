import React, { useState, useEffect } from 'react';
import { mockLeaveApplications, mockLeaveCredits } from '../../../data/mockLeaveData';
import { LEAVE_STATUS, LEAVE_STATUS_LABELS } from '../../../data/leaveTypes';
import { useNotification } from '../../../context/NotificationContext';

function MyLeaveList({ user }) {
  const { showSuccess, showError } = useNotification();
  const [leaves, setLeaves] = useState([]);
  const [leaveCredits, setLeaveCredits] = useState(mockLeaveCredits);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Filter leaves for current user
    const userLeaves = mockLeaveApplications.filter(
      leave => leave.employee_id === user.employee_id
    );
    setLeaves(userLeaves);
  }, [user]);

  const filteredLeaves = leaves.filter(leave => {
    if (filter === 'all') return true;
    return leave.status === filter;
  });

  const handleCancel = (leaveId) => {
    if (window.confirm('Are you sure you want to cancel this leave application?')) {
      setLeaves(prev => prev.map(leave => 
        leave.id === leaveId && leave.status === LEAVE_STATUS.PENDING
          ? { ...leave, status: LEAVE_STATUS.CANCELLED }
          : leave
      ));
      showSuccess('Leave application cancelled successfully');
    }
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
        <h2 className="text-2xl font-bold text-gray-800">My Leave Applications</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter(LEAVE_STATUS.PENDING)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === LEAVE_STATUS.PENDING ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter(LEAVE_STATUS.APPROVED)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === LEAVE_STATUS.APPROVED ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approved
          </button>
        </div>
      </div>

      {/* Leave Credits Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-600">Vacation Leave</p>
          <p className="text-2xl font-bold text-blue-600">{leaveCredits.vacation_leave}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Sick Leave</p>
          <p className="text-2xl font-bold text-blue-600">{leaveCredits.sick_leave}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Special Privilege</p>
          <p className="text-2xl font-bold text-blue-600">{leaveCredits.special_privilege_leave}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Service Incentive</p>
          <p className="text-2xl font-bold text-blue-600">{leaveCredits.service_incentive_leave}</p>
        </div>
      </div>

      {/* Leave Applications Table */}
      {filteredLeaves.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No leave applications found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                    {leave.status === LEAVE_STATUS.PENDING && (
                      <button
                        onClick={() => handleCancel(leave.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    {leave.status === LEAVE_STATUS.APPROVED && leave.remarks && (
                      <span className="text-xs text-gray-500" title={leave.remarks}>
                        ✓ Approved
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MyLeaveList;

