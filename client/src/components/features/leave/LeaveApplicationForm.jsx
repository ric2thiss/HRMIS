import React, { useState } from 'react';
import { LEAVE_TYPES } from '../../../data/leaveTypes';
import { useNotification } from '../../../context/NotificationContext';

function LeaveApplicationForm({ user }) {
  const { showSuccess, showError } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
    attachment: null,
  });
  const [loading, setLoading] = useState(false);
  const [calculatedDays, setCalculatedDays] = useState(0);

  const selectedLeaveType = LEAVE_TYPES.find(lt => lt.id === parseInt(formData.leave_type_id));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Calculate days when dates change
    if ((name === 'start_date' || name === 'end_date') && formData.start_date && formData.end_date) {
      const start = new Date(name === 'start_date' ? value : formData.start_date);
      const end = new Date(name === 'end_date' ? value : formData.end_date);
      if (end >= start) {
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        setCalculatedDays(days);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showError('File size must be less than 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, attachment: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.leave_type_id) {
        showError('Please select a leave type');
        setLoading(false);
        return;
      }

      if (!formData.start_date || !formData.end_date) {
        showError('Please select start and end dates');
        setLoading(false);
        return;
      }

      if (calculatedDays <= 0) {
        showError('End date must be after start date');
        setLoading(false);
        return;
      }

      if (!formData.reason.trim()) {
        showError('Please provide a reason for your leave');
        setLoading(false);
        return;
      }

      if (selectedLeaveType?.requiresDocument && !formData.attachment) {
        showError(`${selectedLeaveType.name} requires a supporting document`);
        setLoading(false);
        return;
      }

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      showSuccess('Leave application submitted successfully');
      setFormData({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: '',
        attachment: null,
      });
      setCalculatedDays(0);
      setIsOpen(false);
    } catch (error) {
      showError('Failed to submit leave application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">File Leave Application</h2>
          <button
            onClick={() => setIsOpen(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">File Leave Application</h2>
        <button
          onClick={() => {
            setIsOpen(false);
            setFormData({
              leave_type_id: '',
              start_date: '',
              end_date: '',
              reason: '',
              attachment: null,
            });
            setCalculatedDays(0);
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              name="leave_type_id"
              value={formData.leave_type_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select leave type</option>
              {LEAVE_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.code}) - Max {type.maxDays} days
                </option>
              ))}
            </select>
            {selectedLeaveType && (
              <p className="mt-1 text-xs text-gray-500">{selectedLeaveType.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Days
            </label>
            <input
              type="text"
              value={calculatedDays > 0 ? `${calculatedDays} ${calculatedDays === 1 ? 'day' : 'days'}` : 'Select dates'}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              min={formData.start_date || new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Please provide a detailed reason for your leave application..."
          />
        </div>

        {selectedLeaveType?.requiresDocument && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supporting Document <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-2">(Required for {selectedLeaveType.name})</span>
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {formData.attachment && (
              <p className="mt-1 text-sm text-gray-600">Selected: {formData.attachment.name}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setFormData({
                leave_type_id: '',
                start_date: '',
                end_date: '',
                reason: '',
                attachment: null,
              });
              setCalculatedDays(0);
            }}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default LeaveApplicationForm;

