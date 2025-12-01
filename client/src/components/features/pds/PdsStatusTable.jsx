import React from 'react';
import { useNavigate } from 'react-router-dom';
import { submitPds } from '../../../api/pds/pds';
import { useNotification } from '../../../hooks/useNotification';

/**
 * Calculate completion percentage based on filled fields
 */
const calculateCompletion = (formData) => {
    if (!formData) return 0;

    const fields = [
        // Personal Information
        'surname', 'firstName', 'dateOfBirth', 'placeOfBirth', 'sex', 'civilStatus',
        'mobileNo', 'emailAddress',
        // Address
        'resHouseNo', 'resBarangay', 'resCity', 'resProvince',
        // Family
        'fatherSurname', 'fatherFirstName', 'motherSurname', 'motherFirstName',
        // Education (at least one)
        'education',
        // References (at least one)
        'refName1',
    ];

    let filledCount = 0;
    let totalCount = fields.length;

    fields.forEach(field => {
        if (field === 'education') {
            // Check if at least one education entry has school
            const hasEducation = formData.education?.some(edu => edu.school && edu.school.trim() !== '');
            if (hasEducation) filledCount++;
        } else if (field === 'refName1') {
            // Check if at least one reference has name
            if (formData.refName1 && formData.refName1.trim() !== '') filledCount++;
        } else {
            const value = formData[field];
            if (value !== null && value !== undefined && value !== '' && value !== false) {
                filledCount++;
            }
        }
    });

    return Math.round((filledCount / totalCount) * 100);
};

function PdsStatusTable({ pds, onUpdate, onRefresh, isHR = false }) {
    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();
    const [submitting, setSubmitting] = React.useState(false);

    const completion = calculateCompletion(pds?.form_data);
    const statusColors = {
        draft: 'bg-blue-100 text-blue-800',
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        declined: 'bg-red-100 text-red-800',
    };

    const handleSubmit = async () => {
        if (completion < 50) {
            showError('Please complete at least 50% of the form before submitting.');
            return;
        }

        if (!window.confirm('Are you sure you want to submit this PDS for approval? You will not be able to edit it until it is reviewed.')) {
            return;
        }

        try {
            setSubmitting(true);
            await submitPds(pds.id);
            showSuccess('PDS submitted for approval successfully');
            if (onRefresh) onRefresh();
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to submit PDS');
        } finally {
            setSubmitting(false);
        }
    };

    const handleView = () => {
        // Scroll to form or show form
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (onUpdate) onUpdate();
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">My PDS Status</h2>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Completion
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Updated
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Submitted At
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[pds.status] || 'bg-gray-100 text-gray-800'}`}>
                                    {pds.status?.toUpperCase() || 'DRAFT'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                        <div 
                                            className={`h-2.5 rounded-full ${
                                                completion >= 80 ? 'bg-green-600' :
                                                completion >= 50 ? 'bg-yellow-600' :
                                                'bg-red-600'
                                            }`}
                                            style={{ width: `${completion}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{completion}%</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {pds.updated_at ? new Date(pds.updated_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {pds.submitted_at ? new Date(pds.submitted_at).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                {(pds.status === 'draft' || pds.status === 'declined') && (
                                    <>
                                        <button
                                            onClick={handleView}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Update
                                        </button>
                                        {/* Hide submit button for HR users */}
                                        {!isHR && (
                                            <button
                                                onClick={handleSubmit}
                                                disabled={submitting || completion < 50}
                                                className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {submitting ? 'Submitting...' : 'Submit for Approval'}
                                            </button>
                                        )}
                                    </>
                                )}
                                {pds.status === 'pending' && (
                                    <span className="text-gray-500">Pending Review</span>
                                )}
                                {pds.status === 'approved' && (
                                    <button
                                        onClick={() => window.print()}
                                        className="text-blue-600 hover:text-blue-900"
                                    >
                                        Print
                                    </button>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {pds.status === 'declined' && pds.hr_comments && (
                <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                    <h3 className="text-sm font-semibold text-red-800 mb-2">HR Comments:</h3>
                    <p className="text-sm text-red-700">{pds.hr_comments}</p>
                </div>
            )}
        </div>
    );
}

export default PdsStatusTable;

