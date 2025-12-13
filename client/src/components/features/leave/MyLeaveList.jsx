import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Printer, Download, Navigation } from 'lucide-react';
import { mockLeaveCredits } from '../../../data/mockLeaveData';
import { LEAVE_STATUS, LEAVE_STATUS_LABELS } from '../../../data/leaveTypes';
import { useNotification } from '../../../hooks/useNotification';
import { getMyLeaveApplications, updateLeaveApplication } from '../../../api/leave/leaveApplications';
import Pagination from '../../common/Pagination';
import LeavePdfViewModal from './LeavePdfViewModal';

function MyLeaveList({ user }) {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [leaves, setLeaves] = useState([]);
  const [leaveCredits, setLeaveCredits] = useState(mockLeaveCredits);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewModalLeaveId, setViewModalLeaveId] = useState(null);

  useEffect(() => {
    loadLeaves();
  }, [filter]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
  }, [filter]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when items per page changes
  }, [itemsPerPage]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const data = await getMyLeaveApplications(params);
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

  const handleCancel = async (leaveId) => {
    if (window.confirm('Are you sure you want to cancel this leave application?')) {
      try {
        await updateLeaveApplication(leaveId, { status: 'cancelled' });
        showSuccess('Leave application cancelled successfully');
        loadLeaves(); // Reload the list
      } catch (err) {
        showError(err?.response?.data?.message || 'Failed to cancel leave application');
      }
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Range</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Approver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedLeaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50">
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{leave.leave_approver?.name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{leave.remarks || 'No remarks'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(leave.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2 items-center flex-wrap">
                      {leave.status === LEAVE_STATUS.APPROVED || leave.status === LEAVE_STATUS.REJECTED ? (
                        <>
                          <button
                            onClick={() => setViewModalLeaveId(leave.id)}
                            className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-blue-900 transition-colors border border-blue-600 rounded hover:bg-blue-50"
                            title="View PDF"
                          >
                            <Eye size={16} />
                            View
                          </button>
                          <button
                            onClick={() => setViewModalLeaveId(leave.id)}
                            className="flex items-center gap-1 px-3 py-1 text-gray-600 hover:text-gray-900 transition-colors border border-gray-600 rounded hover:bg-gray-50"
                            title="Print PDF - Opens in modal"
                          >
                            <Printer size={16} />
                            Print
                          </button>
                          <button
                            onClick={() => setViewModalLeaveId(leave.id)}
                            className="flex items-center gap-1 px-3 py-1 text-green-600 hover:text-green-900 transition-colors border border-green-600 rounded hover:bg-green-50"
                            title="Download PDF - Opens in modal"
                          >
                            <Download size={16} />
                            Download
                          </button>
                          <button
                            onClick={() => navigate(`/leave-application/${leave.id}/track`)}
                            className="flex items-center gap-1 px-3 py-1 text-purple-600 hover:text-purple-900 transition-colors border border-purple-600 rounded hover:bg-purple-50"
                            title="Track leave application"
                          >
                            <Navigation size={16} />
                            Track
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => navigate(`/leave-application/${leave.id}/track`)}
                            className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-blue-900 transition-colors border border-blue-600 rounded hover:bg-blue-50"
                            title="Track leave application"
                          >
                            <Navigation size={16} />
                            Track
                          </button>
                          {leave.status === LEAVE_STATUS.PENDING && (
                            <button
                              onClick={() => handleCancel(leave.id)}
                              className="px-3 py-1 text-red-600 hover:text-red-900 transition-colors border border-red-600 rounded hover:bg-red-50"
                            >
                              Cancel
                            </button>
                          )}
                        </>
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

      {/* PDF View Modal */}
      {viewModalLeaveId && (
        <LeavePdfViewModal
          isOpen={!!viewModalLeaveId}
          onClose={() => setViewModalLeaveId(null)}
          leaveId={viewModalLeaveId}
        />
      )}
    </div>
  );
}

export default MyLeaveList;

