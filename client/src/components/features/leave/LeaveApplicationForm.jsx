import React, { useState, useEffect } from 'react';
import { useNotification } from '../../../hooks/useNotification';
import { useAuth } from '../../../hooks/useAuth';
import Calendar from '../../ui/Calendar/Calendar';
import { getAllMasterLists } from '../../../api/master-lists/masterLists';
import { createLeaveApplication, getLeaveTypes } from '../../../api/leave/leaveApplications';
import SignatureModal from '../profile/SignatureModal';
import updateProfile from '../../../api/user/updateProfile';

function LeaveApplicationForm({ user }) {
  const { showSuccess, showError } = useNotification();
  const { user: authUser, refreshUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [approvalNames, setApprovalNames] = useState([]);
  const [loadingApprovalNames, setLoadingApprovalNames] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loadingLeaveTypes, setLoadingLeaveTypes] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [pendingFormOpen, setPendingFormOpen] = useState(false);
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    leave_type_id: '',
    leave_credit_authorized_officer_id: '',
    recommendation_approver_id: '',
    leave_approver_id: '',
    commutation: '',
    remarks: '',
    show_remarks_to: {
      leave_credit_authorized_officer: false,
      recommendation_approver: false,
      leave_approver: false,
    },
  });

  // Load approval names and leave types when form opens
  useEffect(() => {
    if (isOpen) {
      if (approvalNames.length === 0) {
        loadApprovalNames();
      }
      if (leaveTypes.length === 0) {
        loadLeaveTypes();
      }
    }
  }, [isOpen]);

  const loadApprovalNames = async () => {
    setLoadingApprovalNames(true);
    try {
      const masterLists = await getAllMasterLists();
      // Get active approval names, sorted by type and sort_order
      const activeApprovalNames = (masterLists.approval_names || [])
        .filter(an => an.is_active)
        .sort((a, b) => {
          // Sort by type first, then by sort_order
          if (a.type !== b.type) {
            const typeOrder = ['leave_credit_officer', 'recommendation_approver', 'leave_approver', 'general'];
            return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
          }
          return (a.sort_order || 0) - (b.sort_order || 0);
        });
      setApprovalNames(activeApprovalNames);
    } catch (error) {
      console.error('Failed to load approval names:', error);
      showError('Failed to load approval names list');
    } finally {
      setLoadingApprovalNames(false);
    }
  };

  const loadLeaveTypes = async () => {
    setLoadingLeaveTypes(true);
    try {
      const types = await getLeaveTypes();
      setLeaveTypes(types);
    } catch (error) {
      console.error('Failed to load leave types:', error);
      showError('Failed to load leave types');
    } finally {
      setLoadingLeaveTypes(false);
    }
  };

  // Calculate working days (excluding weekends from selected dates)
  const calculateWorkingDays = (dates) => {
    if (dates.length === 0) return 0;
    
    // Count only weekdays from selected dates
    return dates.filter(date => {
      const dayOfWeek = date.getDay();
      return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude Sunday (0) and Saturday (6)
    }).length;
  };

  const workingDays = calculateWorkingDays(selectedDates);

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDates(prev => {
      const dateStr = date.toISOString().split('T')[0];
      const existingIndex = prev.findIndex(d => 
        d.toISOString().split('T')[0] === dateStr
      );
      
      if (existingIndex >= 0) {
        // Deselect date
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        // Select date
        return [...prev, new Date(date)];
      }
    });
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('show_remarks_')) {
      const field = name.replace('show_remarks_', '');
      setFormData(prev => ({
        ...prev,
        show_remarks_to: {
          ...prev.show_remarks_to,
          [field]: checked,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.leave_type_id) {
        showError('Please select a type of leave');
        setLoading(false);
        return;
      }

      if (selectedDates.length === 0) {
        showError('Please select at least one date');
        setLoading(false);
        return;
      }

      if (workingDays === 0) {
        showError('Please select at least one working day');
        setLoading(false);
        return;
      }

      if (!formData.leave_credit_authorized_officer_id) {
        showError('Please select a Leave Credit Authorized Officer');
        setLoading(false);
        return;
      }

      if (!formData.recommendation_approver_id) {
        showError('Please select a Recommendation Approver');
        setLoading(false);
        return;
      }

      // Sort dates for submission
      const sortedDates = [...selectedDates].sort((a, b) => a - b);
      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];

      if (!formData.commutation) {
        showError('Please select a Commutation option');
        setLoading(false);
        return;
      }

      // Prepare submission data
      const submissionData = {
        leave_type_id: formData.leave_type_id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        exclusive_dates: sortedDates.map(d => d.toISOString().split('T')[0]),
        working_days: workingDays,
        leave_credit_authorized_officer_id: parseInt(formData.leave_credit_authorized_officer_id),
        recommendation_approver_id: parseInt(formData.recommendation_approver_id),
        leave_approver_id: parseInt(formData.leave_approver_id),
        commutation: formData.commutation,
        remarks: formData.remarks,
        show_remarks_to: formData.show_remarks_to,
      };

      console.log('Submitting leave application:', submissionData);

      await createLeaveApplication(submissionData);

      showSuccess('Leave application submitted successfully');
      
      // Reset form
      setFormData({
        leave_type_id: '',
        leave_credit_authorized_officer_id: '',
        recommendation_approver_id: '',
        leave_approver_id: '',
        commutation: '',
        remarks: '',
        show_remarks_to: {
          leave_credit_authorized_officer: false,
          recommendation_approver: false,
          leave_approver: false,
        },
      });
      setSelectedDates([]);
      setCurrentMonth(new Date());
      setIsOpen(false);
    } catch (error) {
      showError('Failed to submit leave application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle opening the form - check for signature first
  const handleOpenForm = () => {
    // Check if user has a signature
    const currentUser = authUser || user;
    if (!currentUser?.signature) {
      // Show notification explaining why signature is required
      showError('You must have an e-signature before you can file a leave application. Please create your e-signature first.');
      // Show signature modal
      setIsSignatureModalOpen(true);
      setPendingFormOpen(true);
    } else {
      // User has signature, open form directly
      setIsOpen(true);
    }
  };

  // Handle saving signature
  const handleSaveSignature = async (newSignature) => {
    try {
      await updateProfile({ signature: newSignature });
      await refreshUser(); // Refresh user data in auth store
      showSuccess('E-signature saved successfully!');
      setIsSignatureModalOpen(false);
      
      // If form was pending, open it now
      if (pendingFormOpen) {
        setIsOpen(true);
        setPendingFormOpen(false);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save e-signature.');
    }
  };

  // If form is closed, show the button to open it
  if (!isOpen) {
    return (
      <>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">File Leave Application</h2>
            <button
              onClick={handleOpenForm}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New Application
            </button>
          </div>
        </div>

        {/* Signature Modal */}
        <SignatureModal
          isOpen={isSignatureModalOpen}
          onClose={() => {
            setIsSignatureModalOpen(false);
            setPendingFormOpen(false);
          }}
          onSave={handleSaveSignature}
          currentSignature={authUser?.signature || user?.signature || ''}
        />
      </>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">File Leave Application</h2>
        <button
          onClick={() => {
            setIsOpen(false);
            setFormData({
              leave_type_id: '',
              leave_credit_authorized_officer_id: '',
              recommendation_approver_id: '',
              leave_approver_id: '',
              remarks: '',
              show_remarks_to: {
                leave_credit_authorized_officer: false,
                recommendation_approver: false,
                leave_approver: false,
              },
            });
            setSelectedDates([]);
            setCurrentMonth(new Date());
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Type of Leave */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  TYPE OF LEAVE TO AVAILED OF
                </label>
                <select
                  name="leave_type_id"
                  value={formData.leave_type_id}
                  onChange={handleChange}
                  required
                  disabled={loadingLeaveTypes}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 disabled:bg-gray-100"
                >
                  <option value="">_SELECT_</option>
                  {leaveTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Exclusive Dates Calendar */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  EXCLUSIVE DATES
                </label>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <Calendar
                    currentMonth={currentMonth}
                    onMonthChange={setCurrentMonth}
                    selectedDates={selectedDates}
                    onDateSelect={handleDateSelect}
                    minDate={new Date()}
                  />
                </div>
              </div>

              {/* Number of Working Days */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  NUMBER OF WORKING DAYS APPLIED
                </label>
                <input
                  type="text"
                  value={workingDays > 0 ? `${workingDays} ${workingDays === 1 ? 'day' : 'days'}` : ''}
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Commutation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Commutation
                </label>
                <select
                  name="commutation"
                  value={formData.commutation}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                >
                  <option value="">_SELECT_</option>
                  <option value="Requested">Requested</option>
                  <option value="Not Requested">Not Requested</option>
                </select>
              </div>

              {/* Leave Credit Authorized Officer */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Leave Credit Authorized Officer
                </label>
                <select
                  name="leave_credit_authorized_officer_id"
                  value={formData.leave_credit_authorized_officer_id}
                  onChange={handleChange}
                  required
                  disabled={loadingApprovalNames}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 disabled:bg-gray-100"
                >
                  <option value="">_SELECT_</option>
                  {approvalNames
                    .filter(an => an.type === 'leave_credit_officer' || an.type === 'general')
                    .map(approvalName => (
                      <option key={approvalName.id} value={approvalName.id}>
                        {approvalName.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Recommendation Approver */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Recommendation Approver
                </label>
                <select
                  name="recommendation_approver_id"
                  value={formData.recommendation_approver_id}
                  onChange={handleChange}
                  required
                  disabled={loadingApprovalNames}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 disabled:bg-gray-100"
                >
                  <option value="">_SELECT_</option>
                  {approvalNames
                    .filter(an => an.type === 'recommendation_approver' || an.type === 'general')
                    .map(approvalName => (
                      <option key={approvalName.id} value={approvalName.id}>
                        {approvalName.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Leave Approver */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Leave Approver
                </label>
                <select
                  name="leave_approver_id"
                  value={formData.leave_approver_id}
                  onChange={handleChange}
                  required
                  disabled={loadingApprovalNames}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 disabled:bg-gray-100"
                >
                  <option value="">_SELECT_</option>
                  {approvalNames
                    .filter(an => an.type === 'leave_approver' || an.type === 'general')
                    .map(approvalName => (
                      <option key={approvalName.id} value={approvalName.id}>
                        {approvalName.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 resize-none"
                  placeholder="Text something to the approver"
                />
              </div>

              {/* Show Remarks Checkboxes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Show Remarks:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="show_remarks_leave_credit_authorized_officer"
                      checked={formData.show_remarks_to.leave_credit_authorized_officer}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Leave Credit Authorized Officer</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="show_remarks_recommendation_approver"
                      checked={formData.show_remarks_to.recommendation_approver}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Recommendation Approver</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="show_remarks_leave_approver"
                      checked={formData.show_remarks_to.leave_approver}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Leave Approver</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setFormData({
                leave_type_id: '',
                leave_credit_authorized_officer_id: '',
                recommendation_approver_id: '',
                leave_approver_id: '',
                remarks: '',
                show_remarks_to: {
                  leave_credit_authorized_officer: false,
                  recommendation_approver: false,
                  leave_approver: false,
                },
              });
              setSelectedDates([]);
              setCurrentMonth(new Date());
            }}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => {
          setIsSignatureModalOpen(false);
          setPendingFormOpen(false);
        }}
        onSave={handleSaveSignature}
        currentSignature={authUser?.signature || user?.signature || ''}
      />
    </div>
  );
}

export default LeaveApplicationForm;
