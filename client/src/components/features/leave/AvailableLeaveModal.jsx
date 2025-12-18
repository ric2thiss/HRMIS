import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLeaveCreditsStore } from '../../../stores/leaveCreditsStore';

function AvailableLeaveModal({ isOpen, onClose }) {
  const { getLeaveCredits, getOtherLeaveCredits, loading } = useLeaveCreditsStore();
  const [leaveCredits, setLeaveCredits] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadLeaveCredits();
    }
  }, [isOpen]);

  const loadLeaveCredits = async () => {
    try {
      // Fetch leave credits (will use cache if available)
      await getLeaveCredits();
      // Get other leave credits from store
      const otherCredits = getOtherLeaveCredits();
      setLeaveCredits(otherCredits);
    } catch (error) {
      console.error('Failed to load leave credits:', error);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-50 h-screen w-screen overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">My Available Leave</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading leave credits...</div>
          ) : leaveCredits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No other leave types available.
            </div>
          ) : (
            <div className="space-y-4">
              {leaveCredits.map((credit) => (
                <div
                  key={credit.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {credit.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Code: {credit.code}
                      </p>
                      {credit.max_days > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Maximum: {credit.max_days} days
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {credit.remaining_days.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Remaining Days
                      </div>
                      {credit.used_days > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          Used: {credit.used_days.toFixed(2)} days
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default AvailableLeaveModal;

