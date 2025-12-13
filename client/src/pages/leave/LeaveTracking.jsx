import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { getLeaveApplication } from '../../api/leave/leaveApplications';
import { LEAVE_STATUS, LEAVE_STATUS_LABELS } from '../../data/leaveTypes';
import AppLayout from '../../components/Layout/AppLayout';
import LoadingScreen from '../../components/Loading/LoadingScreen';

function LeaveTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const { showError } = useNotification();
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user && id) {
      loadLeaveApplication();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const loadLeaveApplication = async () => {
    try {
      setLoading(true);
      const data = await getLeaveApplication(id);
      setLeave(data);
    } catch (err) {
      showError(err?.response?.data?.message || 'Failed to load leave application');
      navigate('/my-leave');
    } finally {
      setLoading(false);
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

  const getApprovalStageStatus = (stageName, isApproved, isRejected) => {
    if (isRejected) {
      return { status: 'rejected', label: 'Rejected', color: 'text-red-600' };
    }
    if (isApproved) {
      return { status: 'approved', label: 'Approved', color: 'text-green-600' };
    }
    return { status: 'pending', label: 'Pending', color: 'text-yellow-600' };
  };

  // Show full page loading only for initial auth check
  if (authLoading || !user) {
    return <LoadingScreen />;
  }

  if (loading) {
    return (
      <AppLayout user={user} logout={logout} loading={authLoading} title="Track Leave Application">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center py-10 text-gray-500">
            Loading leave application details...
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!leave) {
    return (
      <AppLayout user={user} logout={logout} loading={authLoading} title="Track Leave Application">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center py-10 text-gray-500">
            Leave application not found.
          </div>
        </div>
      </AppLayout>
    );
  }

  // Determine approval stages based on leave type and current status
  // All leave types follow the 3-stage workflow: Leave Credit Officer -> Recommendation Approver -> Leave Approver
  
  // Determine current stage
  const getCurrentStage = () => {
    if (!leave.leave_credit_officer_approved) {
      return 'Stage 1: Leave Credit Authorized Officer';
    } else if (!leave.recommendation_approver_approved) {
      return 'Stage 2: Recommendation Approver';
    } else if (!leave.leave_approver_approved) {
      return 'Stage 3: Leave Approver';
    }
    return 'All Stages Completed';
  };

  // Build stages array with actual approval status from backend
  const stages = [
    {
      name: 'Leave Credit Authorized Officer',
      stageNumber: 1,
      approver: leave.leave_credit_authorized_officer?.name || 'N/A',
      approved: leave.leave_credit_officer_approved || false,
      approvedBy: leave.leave_credit_officer_approver,
      approvedAt: leave.leave_credit_officer_approved_at,
      remarks: leave.leave_credit_officer_remarks,
      isCurrent: !leave.leave_credit_officer_approved && leave.status === LEAVE_STATUS.PENDING,
    },
    {
      name: 'Recommendation Approver',
      stageNumber: 2,
      approver: leave.recommendation_approver?.name || 'N/A',
      approved: leave.recommendation_approver_approved || false,
      approvedBy: leave.recommendation_approver_approver,
      approvedAt: leave.recommendation_approver_approved_at,
      remarks: leave.recommendation_approver_remarks,
      isCurrent: leave.leave_credit_officer_approved && !leave.recommendation_approver_approved && leave.status === LEAVE_STATUS.PENDING,
    },
    {
      name: 'Leave Approver',
      stageNumber: 3,
      approver: leave.leave_approver?.name || 'N/A',
      approved: leave.leave_approver_approved || false,
      approvedBy: leave.leave_approver_approver,
      approvedAt: leave.leave_approver_approved_at,
      remarks: leave.leave_approver_remarks,
      isCurrent: leave.leave_credit_officer_approved && leave.recommendation_approver_approved && !leave.leave_approver_approved && leave.status === LEAVE_STATUS.PENDING,
    },
  ];

  return (
    <AppLayout user={user} logout={logout} loading={authLoading} title="Track Leave Application">
      <div className="space-y-6">
        {/* Leave Details Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Leave Application Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Leave Type</p>
              <p className="text-lg font-semibold text-gray-900">
                {leave.leave_type?.name || 'N/A'} ({leave.leave_type?.code || 'N/A'})
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <div className="mt-1">
                {getStatusBadge(leave.status)}
              </div>
            </div>
            {leave.status === LEAVE_STATUS.PENDING && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Current Approval Stage</p>
                <p className="text-lg font-semibold text-blue-600">
                  {getCurrentStage()}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Date Range</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(leave.start_date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })} - {new Date(leave.end_date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Working Days</p>
              <p className="text-lg font-semibold text-gray-900">
                {leave.working_days} {leave.working_days === 1 ? 'day' : 'days'}
              </p>
            </div>
            {leave.commutation && (
              <div>
                <p className="text-sm text-gray-600">Commutation</p>
                <p className="text-lg font-semibold text-gray-900">{leave.commutation}</p>
              </div>
            )}
            {leave.remarks && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Remarks</p>
                <p className="text-lg text-gray-900">{leave.remarks}</p>
              </div>
            )}
          </div>
        </div>

        {/* Approval Workflow Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Approval Workflow</h2>
          
          <div className="space-y-6">
            {stages.map((stage, index) => {
              const isRejected = leave.status === LEAVE_STATUS.REJECTED && !stage.approved;
              const stageStatus = getApprovalStageStatus(stage.name, stage.approved, isRejected);
              
              return (
                <div key={index} className="relative">
                  {/* Connection Line */}
                  {index < stages.length - 1 && (
                    <div className={`absolute left-6 top-12 bottom-0 w-0.5 ${
                      stage.approved ? 'bg-green-300' : 
                      leave.status === LEAVE_STATUS.REJECTED ? 'bg-red-300' : 
                      'bg-gray-300'
                    }`}></div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      stage.approved ? 'bg-green-100' :
                      isRejected ? 'bg-red-100' :
                      stage.isCurrent ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                      {stage.approved ? (
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isRejected ? (
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    
                    {/* Stage Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{stage.name}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded">
                          Stage {stage.stageNumber}
                        </span>
                        {stage.isCurrent && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Approver: {stage.approver}</p>
                      <div className="mt-2">
                        <span className={`text-sm font-medium ${stageStatus.color}`}>
                          {stageStatus.label}
                        </span>
                        {stage.approved && stage.approvedBy && (
                          <div className="mt-1 text-xs text-gray-600">
                            Approved by: {stage.approvedBy.first_name} {stage.approvedBy.middle_initial} {stage.approvedBy.last_name}
                            {stage.approvedAt && (
                              <span className="ml-2">
                                on {new Date(stage.approvedAt).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </span>
                            )}
                          </div>
                        )}
                        {stage.remarks && (
                          <p className="text-xs text-gray-700 mt-1 italic">"{stage.remarks}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Final Approval Info */}
          {leave.status === LEAVE_STATUS.APPROVED && leave.approver && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">Final Approval</p>
              <p className="text-lg font-semibold text-gray-900">
                Approved by: {leave.approver.first_name} {leave.approver.middle_initial} {leave.approver.last_name}
              </p>
              {leave.approved_at && (
                <p className="text-sm text-gray-600 mt-1">
                  On: {new Date(leave.approved_at).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
              {leave.approval_remarks && (
                <p className="text-sm text-gray-700 mt-2 italic">"{leave.approval_remarks}"</p>
              )}
            </div>
          )}

          {leave.status === LEAVE_STATUS.REJECTED && leave.approver && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">Rejection Details</p>
              <p className="text-lg font-semibold text-gray-900">
                Rejected by: {leave.approver.first_name} {leave.approver.middle_initial} {leave.approver.last_name}
              </p>
              {leave.approved_at && (
                <p className="text-sm text-gray-600 mt-1">
                  On: {new Date(leave.approved_at).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
              {leave.approval_remarks && (
                <p className="text-sm text-red-700 mt-2 italic">"{leave.approval_remarks}"</p>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default LeaveTracking;

