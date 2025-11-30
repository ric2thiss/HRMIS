import React, { useState, useEffect } from 'react';
import { getPds } from '../../../api/pds/pds';
import PdsForm from '../../PdsForm/PdsForm';

function PdsReviewModal({ pds, onClose, onApprove, onDecline }) {
    const [pdsData, setPdsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [comments, setComments] = useState('');

    useEffect(() => {
        if (pds && pds.action === 'view' && !pds.form_data) {
            loadPdsData();
        } else if (pds && pds.form_data) {
            setPdsData(pds);
        }
    }, [pds]);

    const loadPdsData = async () => {
        try {
            setLoading(true);
            const data = await getPds(pds.id);
            setPdsData(data);
        } catch (err) {
            console.error('Error loading PDS:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = () => {
        if (window.confirm('Are you sure you want to approve this PDS?')) {
            onApprove();
        }
    };

    const handleDecline = () => {
        if (!comments.trim()) {
            alert('Please provide a reason for declining');
            return;
        }
        onDecline(comments);
    };

    if (pds.action === 'approve') {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                    <div className="p-6">
                        <h3 className="text-xl font-medium text-gray-900 mb-4">Approve PDS</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to approve the PDS submitted by <strong>{pds.user?.name}</strong>?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApprove}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (pds.action === 'decline') {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                    <div className="p-6">
                        <h3 className="text-xl font-medium text-gray-900 mb-4">Decline PDS</h3>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                Employee: <strong>{pds.user?.name}</strong>
                            </p>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for Decline <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                rows="4"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="Please provide a reason for declining..."
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
                                onClick={handleDecline}
                                disabled={!comments.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // View mode - show full PDS
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50">
            <div className="min-h-screen px-4 py-8">
                <div className="bg-white rounded-lg shadow-xl max-w-6xl mx-auto p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">
                            PDS Review - {pds.user?.name}
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Print
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-center text-gray-500 py-10">Loading PDS...</p>
                    ) : (pdsData?.form_data || pds?.form_data) ? (
                        <div className="space-y-4">
                            <PdsForm initialData={pdsData?.form_data || pds.form_data} readOnly={true} />
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    onClick={() => {
                                        onClose();
                                        // Trigger decline modal by setting action
                                        setTimeout(() => {
                                            const declinePds = { ...pds, action: 'decline' };
                                            // This will be handled by parent component
                                        }, 100);
                                    }}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Decline
                                </button>
                                <button
                                    onClick={handleApprove}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Approve
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-10">Failed to load PDS data</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PdsReviewModal;

