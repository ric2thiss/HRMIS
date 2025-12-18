import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Printer, Download, Navigation, X } from 'lucide-react';
import { LEAVE_STATUS, LEAVE_STATUS_LABELS } from '../../../data/leaveTypes';
import { useNotification } from '../../../hooks/useNotification';
import { updateLeaveApplication } from '../../../api/leave/leaveApplications';
import { useLeaveCreditsStore } from '../../../stores/leaveCreditsStore';
import { useLeaveApplicationsStore } from '../../../stores/leaveApplicationsStore';
import Pagination from '../../common/Pagination';
import LeavePdfViewModal from './LeavePdfViewModal';
import TableActionButton from '../../ui/TableActionButton';

function MyLeaveList({ user }) {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { getLeaveCredits, getHeroLeaveCredits, loading: loadingCredits } = useLeaveCreditsStore();
  const { getLeaveApplications, leaveApplications, loading: loadingLeaves, removeLeaveApplicationFromCache } = useLeaveApplicationsStore();
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewModalLeaveId, setViewModalLeaveId] = useState(null);

  // Get hero leave credits from store
  const heroCredits = getHeroLeaveCredits();

  useEffect(() => {
    // Load leave credits on mount
    if (user) {
      getLeaveCredits();
    }
  }, [user, getLeaveCredits]);

  useEffect(() => {
    // Load leave applications with filter (cached)
    if (user) {
      const params = filter !== 'all' ? { status: filter } : {};
      getLeaveApplications(params);
    }
  }, [filter, user, getLeaveApplications]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
  }, [filter]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when items per page changes
  }, [itemsPerPage]);

  // Use cached leave applications
  const filteredLeaves = leaveApplications;

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
        const updatedLeave = await updateLeaveApplication(leaveId, { status: 'cancelled' });
        showSuccess('Leave application cancelled successfully');
        // Update cache instead of reloading
        const { updateLeaveApplicationInCache } = useLeaveApplicationsStore.getState();
        updateLeaveApplicationInCache(updatedLeave);
        // Refresh leave credits as cancellation might affect available days
        const { refreshLeaveCredits } = useLeaveCreditsStore.getState();
        await refreshLeaveCredits();
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

      {/* Leave Credits Summary - Only VL, SL, SPL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Sick Leave</p>
          <p className="text-2xl font-bold text-blue-600">
            {loadingCredits ? '...' : heroCredits.SL.remaining.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Remaining Days</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Vacation Leave</p>
          <p className="text-2xl font-bold text-blue-600">
            {loadingCredits ? '...' : heroCredits.VL.remaining.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Remaining Days</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Special Privilege Leave</p>
          <p className="text-2xl font-bold text-blue-600">
            {loadingCredits ? '...' : heroCredits.SPL.remaining.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Remaining Days</p>
        </div>
      </div>

      {/* Leave Applications Table */}
      {loadingLeaves ? (
        <div className="text-center py-10 text-gray-500">
          Loading leave applications...
        </div>
      ) : filteredLeaves.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No leave applications found.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '800px' }}>
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
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {leave.status === LEAVE_STATUS.APPROVED || leave.status === LEAVE_STATUS.REJECTED ? (
                        <>
                          <TableActionButton
                            variant="blue"
                            icon={Eye}
                            label="View"
                            onClick={() => setViewModalLeaveId(leave.id)}
                            title="View PDF"
                          />
                          <TableActionButton
                            variant="gray"
                            icon={Printer}
                            label="Print"
                            onClick={() => setViewModalLeaveId(leave.id)}
                            title="Print PDF - Opens in modal"
                          />
                          <TableActionButton
                            variant="green"
                            icon={Download}
                            label="Download"
                            onClick={() => setViewModalLeaveId(leave.id)}
                            title="Download PDF - Opens in modal"
                          />
                          <TableActionButton
                            variant="purple"
                            icon={Navigation}
                            label="Track"
                            onClick={() => navigate(`/leave-application/${leave.id}/track`)}
                            title="Track leave application"
                          />
                        </>
                      ) : (
                        <>
                          <TableActionButton
                            variant="blue"
                            icon={Navigation}
                            label="Track"
                            onClick={() => navigate(`/leave-application/${leave.id}/track`)}
                            title="Track leave application"
                          />
                          {leave.status === LEAVE_STATUS.PENDING && (
                            <TableActionButton
                              variant="red"
                              icon={X}
                              label="Cancel"
                              onClick={() => handleCancel(leave.id)}
                              title="Cancel leave application"
                            />
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
      {!loadingLeaves && (
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

