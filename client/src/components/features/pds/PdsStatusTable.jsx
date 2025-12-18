import React, { useRef, useState, useEffect } from 'react';
import { FileEdit, Send, Printer } from 'lucide-react';
import { submitPds, updatePds, getPds } from '../../../api/pds/pds';
import { useNotification } from '../../../hooks/useNotification';
import PdsPrintView from '../../PdsForm/PdsPrintView';
import { generatePdsPdfUrl } from '../../../utils/pdsPdfGenerator';
import TableActionButton from '../../ui/TableActionButton';

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

function PdsStatusTable({ pds, onUpdate, onRefresh, isHR = false, isAdmin = false }) {
    const { showSuccess, showError } = useNotification();
    const [submitting, setSubmitting] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [pdsData, setPdsData] = useState(null);
    const printRef = useRef(null);
    const [printViewReady, setPrintViewReady] = useState(false);
    const pdfUrlRef = useRef(null);
    const printIframeRef = useRef(null);
    const pdfGeneratedForPdsIdRef = useRef(null);

    // Initialize pdsData with current pds if available
    useEffect(() => {
        // Update pdsData when pds prop changes (e.g., after save/refresh)
        if (pds?.form_data) {
            setPdsData(pds);
        }
    }, [pds]);

    // Monitor when print view is ready
    useEffect(() => {
        if (printRef.current && (pdsData || pds)?.form_data) {
            const checkReady = setInterval(() => {
                const formDataElement = printRef.current?.querySelector('.pds-official-print');
                if (formDataElement) {
                    setPrintViewReady(true);
                    clearInterval(checkReady);
                }
            }, 100);

            return () => clearInterval(checkReady);
        } else {
            setPrintViewReady(false);
        }
    }, [pdsData, pds]);

    // Cleanup on unmount or when PDS changes
    useEffect(() => {
        return () => {
            // Clean up iframe
            if (printIframeRef.current && printIframeRef.current.parentNode) {
                document.body.removeChild(printIframeRef.current);
                printIframeRef.current = null;
            }
        };
    }, []); // Only on unmount

    // Clean up PDF cache when PDS ID changes
    useEffect(() => {
        const currentPdsId = pds?.id;
        const cachedPdsId = pdfGeneratedForPdsIdRef.current;
        
        // Only clean up if PDS ID changed
        if (currentPdsId && cachedPdsId && currentPdsId !== cachedPdsId) {
            if (pdfUrlRef.current) {
                URL.revokeObjectURL(pdfUrlRef.current);
                pdfUrlRef.current = null;
            }
            pdfGeneratedForPdsIdRef.current = null;
        }
    }, [pds?.id]);

    // Use the latest form_data from pds prop (always up-to-date after refresh)
    const currentFormData = pds?.form_data;
    const completion = calculateCompletion(currentFormData);
    const statusColors = {
        draft: 'bg-blue-100 text-blue-800',
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        declined: 'bg-red-100 text-red-800',
        'for-revision': 'bg-orange-100 text-orange-800',
    };

    const handleSubmit = async () => {
        // Check if PDS has form_data (has been saved)
        if (!pds?.form_data || !currentFormData) {
            showError('Please save the PDS first before submitting.');
            return;
        }

        // Warn if completion is less than 50%, but still allow submission
        if (completion < 50) {
            const proceed = window.confirm(
                `Your PDS is only ${completion}% complete. It's recommended to complete at least 50% before submitting.\n\nDo you want to proceed anyway?`
            );
            if (!proceed) {
                return;
            }
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

    const handleView = async () => {
        // Scroll to form or show form
        // Note: When user saves changes to a pending/approved PDS, 
        // the backend will automatically change status to draft
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (onUpdate) onUpdate();
    };

    const handlePrint = async () => {
        // Prevent multiple simultaneous print attempts
        if (printing) {
            console.log('Print already in progress, skipping...');
            return;
        }
        
        if (!pds?.id) {
            showError('PDS data not available');
            return;
        }

        try {
            setPrinting(true);

            // Clean up any existing iframe from previous attempts
            if (printIframeRef.current && printIframeRef.current.parentNode) {
                document.body.removeChild(printIframeRef.current);
                printIframeRef.current = null;
            }

            let pdfUrl = pdfUrlRef.current;
            
            // Check if we need to regenerate PDF (no cache or different PDS)
            const needsRegeneration = !pdfUrl || (pdfGeneratedForPdsIdRef.current !== pds.id);

            // Only regenerate PDF if we don't have a cached one for this PDS
            if (needsRegeneration) {
                // Load PDS data only if needed
                let fullPdsData = pdsData;
                if (!fullPdsData || !fullPdsData.form_data) {
                    fullPdsData = await getPds(pds.id);
                    if (!fullPdsData?.form_data) {
                        showError('PDS form data not available');
                        setPrinting(false);
                        return;
                    }
                    setPdsData(fullPdsData);
                    // Wait briefly for React to update
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                // Ensure print view ref is available
                if (!printRef.current) {
                    showError('Print view not ready. Please refresh the page and try again.');
                    setPrinting(false);
                    return;
                }

                // Check if form data is rendered (with retry)
                let formDataElement = null;
                let attempts = 0;
                while (attempts < 5 && !formDataElement) {
                    formDataElement = printRef.current.querySelector('.pds-official-print');
                    if (!formDataElement) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        attempts++;
                    }
                }

                if (!formDataElement) {
                    showError('PDS content not ready. Please refresh the page and try again.');
                    setPrinting(false);
                    return;
                }

                // Show print view temporarily for PDF generation
                printRef.current.style.display = 'block';
                printRef.current.style.visibility = 'visible';
                printRef.current.style.position = 'absolute';
                printRef.current.style.left = '-9999px';
                printRef.current.style.top = '0';
                printRef.current.style.width = '210mm';
                printRef.current.style.backgroundColor = '#ffffff';

                // Wait for content to render (reduced time)
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Generate PDF blob URL
                pdfUrl = await generatePdsPdfUrl(printRef.current);
                pdfUrlRef.current = pdfUrl;
                pdfGeneratedForPdsIdRef.current = pds.id;

                // Hide print view after PDF generation
                printRef.current.style.display = 'none';
                printRef.current.style.visibility = 'hidden';
            }

            // Create a hidden iframe to load PDF and trigger print dialog
            const printIframe = document.createElement('iframe');
            printIframe.style.position = 'fixed';
            printIframe.style.width = '1px';
            printIframe.style.height = '1px';
            printIframe.style.left = '-9999px';
            printIframe.style.top = '-9999px';
            printIframe.style.border = 'none';
            printIframe.style.opacity = '0';
            printIframe.style.pointerEvents = 'none';

            printIframeRef.current = printIframe;
            document.body.appendChild(printIframe);

            // Function to trigger print
            const triggerPrint = () => {
                try {
                    if (printIframe.contentWindow) {
                        printIframe.contentWindow.focus();
                        printIframe.contentWindow.print();
                    }
                    setPrinting(false);
                } catch (error) {
                    console.error('Error triggering print:', error);
                    showError('Failed to trigger print dialog. Please try again.');
                    setPrinting(false);
                }
            };

            // Wait for PDF to load in iframe
            printIframe.onload = () => {
                setTimeout(triggerPrint, 300);
            };

            // Set PDF source
            printIframe.src = pdfUrl;

            // Fallback timeout
            setTimeout(() => {
                if (printIframe.parentNode) {
                    triggerPrint();
                }
            }, 2000);

        } catch (error) {
            console.error('Error printing PDS:', error);
            showError(`Failed to generate PDF: ${error.message || 'Unknown error'}. Please try again.`);
            
            // Hide print view if it's still visible
            if (printRef.current) {
                printRef.current.style.display = 'none';
                printRef.current.style.visibility = 'hidden';
            }
            
            // Clean up on error
            if (printIframeRef.current && printIframeRef.current.parentNode) {
                document.body.removeChild(printIframeRef.current);
                printIframeRef.current = null;
            }
        } finally {
            setPrinting(false);
        }
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
                                    {pds.status === 'for-revision' ? 'FOR REVISION' : (pds.status?.toUpperCase() || 'DRAFT')}
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-2 items-center flex-wrap">
                                    {/* Update button - always visible for employees (including pending) */}
                                    {/* When updating pending PDS, status will change to draft */}
                                    <TableActionButton
                                        variant="blue"
                                        icon={FileEdit}
                                        label="Update PDS"
                                        onClick={handleView}
                                        title={
                                            pds.status === 'pending' 
                                                ? 'Click to update (will change status to draft and remove from pending list)' 
                                                : pds.status === 'approved' 
                                                    ? 'Click to update (will change status to draft)' 
                                                    : 'Update PDS'
                                        }
                                    />
                                    
                                    {/* Submit button - show for employees and admin users (HR cannot submit) */}
                                    {/* Hide button when status is approved - user must update first to change status to draft */}
                                    {/* Hide button when status is pending - already submitted */}
                                    {!isHR && // HR cannot submit, but Admin can (like employees)
                                     pds.status !== 'approved' &&
                                     pds.status !== 'pending' &&
                                     (pds.status === 'draft' || 
                                      pds.status === 'declined' || 
                                      pds.status === 'for-revision' ||
                                      !pds.status) && // Handle null/undefined as draft
                                     pds?.form_data && (
                                        <TableActionButton
                                            variant="green"
                                            icon={Send}
                                            label={submitting ? 'Submitting...' : 'Submit for Approval'}
                                            onClick={handleSubmit}
                                            disabled={submitting}
                                            title={
                                                submitting
                                                    ? 'Submitting...'
                                                    : completion < 50 
                                                        ? `PDS is ${completion}% complete. Click to submit anyway.` 
                                                        : 'Submit for Approval'
                                            }
                                        />
                                    )}
                                    {/* Show message if PDS exists but hasn't been saved yet (only for non-approved, non-pending statuses) */}
                                    {!isHR && // HR cannot submit, but Admin can (like employees)
                                     pds.status !== 'approved' &&
                                     pds.status !== 'pending' &&
                                     (pds.status === 'draft' || 
                                      pds.status === 'declined' || 
                                      pds.status === 'for-revision' ||
                                      !pds.status) &&
                                     !pds?.form_data && (
                                        <span className="text-gray-500 text-sm italic">
                                            Please save the PDS first before submitting
                                        </span>
                                    )}
                                    
                                    {/* Print button - show for approved status OR for HR/Admin users (they can print their own PDS) */}
                                    {(pds.status === 'approved' || ((isHR || isAdmin) && pds?.form_data)) && (
                                        <TableActionButton
                                            variant="purple"
                                            icon={Printer}
                                            label={printing ? 'Generating PDF...' : 'Print'}
                                            onClick={handlePrint}
                                            disabled={printing}
                                            title={printing ? 'Generating PDF...' : 'Print PDS'}
                                        />
                                    )}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {(pds.status === 'declined' || pds.status === 'for-revision') && pds.hr_comments && (
                <div className={`mt-4 p-4 border-l-4 rounded ${
                    pds.status === 'declined' 
                        ? 'bg-red-50 border-red-500' 
                        : 'bg-orange-50 border-orange-500'
                }`}>
                    <h3 className={`text-sm font-semibold mb-2 ${
                        pds.status === 'declined' 
                            ? 'text-red-800' 
                            : 'text-orange-800'
                    }`}>
                        {pds.status === 'declined' ? 'HR Comments:' : 'Revision Comments:'}
                    </h3>
                    <p className={`text-sm ${
                        pds.status === 'declined' 
                            ? 'text-red-700' 
                            : 'text-orange-700'
                    }`}>
                        {pds.hr_comments}
                    </p>
                </div>
            )}

            {/* Hidden print view for PDF generation - always render if PDS exists */}
            {pds?.id && (
                <div 
                    ref={printRef} 
                    style={{ 
                        display: 'none', 
                        visibility: 'hidden',
                        position: 'absolute',
                        left: '-9999px',
                        top: '0',
                        width: '210mm',
                        backgroundColor: '#ffffff'
                    }}
                    key={pdsData?.id || pds?.id}
                >
                    {(pdsData?.form_data || pds?.form_data) && (
                        <PdsPrintView formData={pdsData?.form_data || pds?.form_data} />
                    )}
                </div>
            )}
        </div>
    );
}

export default PdsStatusTable;

