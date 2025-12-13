import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import SignatureModal from '../profile/SignatureModal';
import { useNotification } from '../../../hooks/useNotification';
import { useAuth } from '../../../hooks/useAuth';
import updateProfile from '../../../api/user/updateProfile';

function LeaveApprovalModal({ isOpen, onClose, onApprove, user: userProp, leave }) {
  const { showError, showSuccess } = useNotification();
  const { refreshUser, user: authUser } = useAuth();
  // Use authUser if available, otherwise fall back to userProp
  const user = authUser || userProp;
  const [signature, setSignature] = useState(user?.signature || '');
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [savingSignature, setSavingSignature] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Always get the latest signature from user object
      const currentUser = authUser || userProp;
      setSignature(currentUser?.signature || '');
      setApprovalRemarks('');
    }
  }, [isOpen, authUser, userProp]);

  const handleApprove = () => {
    if (!signature) {
      showError('E-signature is required to approve this leave application. Please create your signature first.');
      setIsSignatureModalOpen(true);
      return;
    }

    onApprove({
      status: 'approved',
      approval_remarks: approvalRemarks || 'Approved',
      signature: signature
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Approve Leave Application</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Leave Application Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Employee:</strong> {leave?.user?.first_name} {leave?.user?.middle_initial} {leave?.user?.last_name}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Leave Type:</strong> {leave?.leave_type?.name} ({leave?.working_days} days)
              </p>
              <p className="text-sm text-gray-600">
                <strong>Date Range:</strong> {new Date(leave?.start_date).toLocaleDateString()} to {new Date(leave?.end_date).toLocaleDateString()}
              </p>
            </div>

            {/* Signature Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-Signature <span className="text-red-500">*</span>
              </label>
              {signature ? (
                <div className="border border-gray-300 rounded-lg p-4 bg-white">
                  <img 
                    src={signature} 
                    alt="Your Signature" 
                    className="max-w-full h-auto max-h-32 mx-auto object-contain"
                    onError={(e) => {
                      console.error('Error loading signature');
                      e.target.style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsSignatureModalOpen(true)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Change Signature
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    You need to create an e-signature to approve this leave application.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSignatureModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create E-Signature
                  </button>
                </div>
              )}
            </div>

            {/* Approval Remarks */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approval Remarks (Optional)
              </label>
              <textarea
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any remarks or comments..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={!signature}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Approve with Signature
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={async (newSignature) => {
          // Save signature to profile first
          try {
            setSavingSignature(true);
            await updateProfile({ signature: newSignature });
            // Refresh user to get updated signature (decrypted from backend)
            if (refreshUser) {
              const updatedUser = await refreshUser();
              // Update local signature state with the refreshed user's signature
              setSignature(updatedUser?.signature || newSignature);
            } else {
              setSignature(newSignature);
            }
            showSuccess('E-signature saved successfully. You can now approve the leave application.');
            setIsSignatureModalOpen(false);
          } catch (error) {
            showError(error.response?.data?.message || 'Failed to save signature');
          } finally {
            setSavingSignature(false);
          }
        }}
        currentSignature={signature}
      />
    </>
  );
}

export default LeaveApprovalModal;

