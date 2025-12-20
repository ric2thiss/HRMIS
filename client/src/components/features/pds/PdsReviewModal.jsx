import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getPds } from '../../../api/pds/pds';
import PdsForm from '../../PdsForm/PdsForm';
import PdsPrintView from '../../PdsForm/PdsPrintView';
import LoadingSpinner from '../../Loading/LoadingSpinner';
import { generatePdsPdfUrl, downloadPdsPdf } from '../../../utils/pdsPdfGenerator';

function PdsReviewModal({ pds, onClose, onApprove, onDecline, onForRevision, onDeclineClick }) {
    const [pdsData, setPdsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [comments, setComments] = useState('');
    const printRef = useRef(null);
    const pdfIframeRef = useRef(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    useEffect(() => {
        // Clear previous PDF URL when pds changes
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
        }
        
        if (pds && pds.action === 'view') {
            // Always load full PDS data when viewing to ensure we have complete form_data including images
            loadPdsData();
        } else if (pds && (pds.action === 'approve' || pds.action === 'decline' || pds.action === 'for-revision')) {
            // For approve/decline/for-revision actions, use the pds data directly
            setPdsData(pds);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pds]);
    
    // Cleanup PDF URL on unmount
    useEffect(() => {
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [pdfUrl]);
    
    // Generate PDF when PDS data is loaded for view action
    useEffect(() => {
        if (pds?.action === 'view' && pdsData?.form_data && printRef.current && !pdfUrl && !generatingPdf && !loading) {
            generatePdfForView();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pdsData?.form_data, pds?.action, loading]);

    // Auto-print when PDF is ready and autoPrint flag is set
    useEffect(() => {
        if (pds?.autoPrint && pdfUrl && !generatingPdf && !loading) {
            // Small delay to ensure PDF is fully loaded
            const timer = setTimeout(() => {
                handlePrint();
            }, 1000);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pdfUrl, pds?.autoPrint, generatingPdf, loading]);
    
    const generatePdfForView = async () => {
        if (!printRef.current || generatingPdf) return;
        
        try {
            setGeneratingPdf(true);
            // Show print view temporarily for PDF generation
            printRef.current.style.display = 'block';
            printRef.current.style.visibility = 'visible';
            
            // Wait for content to render
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Generate PDF URL
            const url = await generatePdsPdfUrl(printRef.current);
            setPdfUrl(url);
            
            // Hide print view after PDF generation
            printRef.current.style.display = 'none';
            printRef.current.style.visibility = 'hidden';
        } catch (error) {
            console.error('Error generating PDF for view:', error);
            setGeneratingPdf(false);
        } finally {
            setGeneratingPdf(false);
        }
    };

    const loadPdsData = async () => {
        if (!pds?.id) return;
        
        try {
            setLoading(true);
            const data = await getPds(pds.id);
            console.log('Loaded PDS data:', data);
            console.log('Form data keys:', data?.form_data ? Object.keys(data.form_data) : 'no form_data');
            console.log('Photo exists:', !!data?.form_data?.photo);
            console.log('Photo value type:', typeof data?.form_data?.photo);
            console.log('Photo value length:', data?.form_data?.photo?.length || 0);
            console.log('Photo value preview:', data?.form_data?.photo ? data.form_data.photo.substring(0, 50) + '...' : 'none');
            console.log('Signature exists:', !!data?.form_data?.signature);
            console.log('Signature value type:', typeof data?.form_data?.signature);
            console.log('Signature value length:', data?.form_data?.signature?.length || 0);
            console.log('Signature value preview:', data?.form_data?.signature ? data.form_data.signature.substring(0, 50) + '...' : 'none');
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
            return;
        }
        onDecline(comments);
    };

    const handleForRevision = () => {
        if (!comments.trim()) {
            return;
        }
        onForRevision(comments);
    };

    const handlePrint = async () => {
        try {
            // If PDF is already loaded in iframe, use it for printing
            if (pdfUrl && pdfIframeRef.current) {
                try {
                    // Try to print from the existing iframe
                    pdfIframeRef.current.contentWindow.print();
                    return;
                } catch (error) {
                    console.log('Could not print from iframe, trying alternative method:', error);
                }
            }
            
            // Use existing PDF URL if available, otherwise generate new one
            let urlToPrint = pdfUrl;
            
            if (!urlToPrint) {
                if (!printRef.current) return;
                
                // Show print view temporarily for PDF generation
                printRef.current.style.display = 'block';
                printRef.current.style.visibility = 'visible';
                
                // Wait for content to render
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Generate PDF blob URL
                urlToPrint = await generatePdsPdfUrl(printRef.current);
                
                // Hide print view after PDF generation
                printRef.current.style.display = 'none';
                printRef.current.style.visibility = 'hidden';
            }
            
            // Create a temporary iframe for printing
            const printIframe = document.createElement('iframe');
            printIframe.style.position = 'absolute';
            printIframe.style.width = '1px';
            printIframe.style.height = '1px';
            printIframe.style.left = '-9999px';
            printIframe.style.top = '-9999px';
            printIframe.style.border = 'none';
            
            document.body.appendChild(printIframe);
            
            // Set PDF source
            printIframe.src = urlToPrint;
            
            // Wait for PDF to load and then print
            const printFromIframe = () => {
                try {
                    if (printIframe.contentWindow) {
                        printIframe.contentWindow.focus();
                        printIframe.contentWindow.print();
                        
                        // Clean up after printing
                        setTimeout(() => {
                            if (printIframe.parentNode) {
                                document.body.removeChild(printIframe);
                            }
                        }, 1000);
                    }
                } catch (error) {
                    console.error('Error printing from iframe:', error);
                    // Fallback: open in new window
                    const printWindow = window.open(urlToPrint, '_blank');
                    if (printWindow) {
                        printWindow.onload = () => {
                            setTimeout(() => {
                                printWindow.print();
                            }, 500);
                        };
                    }
                    // Clean up iframe
                    if (printIframe.parentNode) {
                        document.body.removeChild(printIframe);
                    }
                }
            };
            
            // Try printing when iframe loads
            printIframe.onload = () => {
                setTimeout(printFromIframe, 500);
            };
            
            // Fallback: try printing after a delay even if onload doesn't fire
            setTimeout(() => {
                if (printIframe.parentNode) {
                    printFromIframe();
                }
            }, 2000);
            
        } catch (error) {
            console.error('Error printing PDF:', error);
            alert('Failed to print PDF. Please try again.');
        }
    };

    const handleDownloadPDF = async () => {
        if (!printRef.current) return;

        try {
            // Show print view temporarily for PDF generation
            printRef.current.style.display = 'block';
            printRef.current.style.visibility = 'visible';
            
            // Wait for content to render
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const fileName = `PDS_${pds.user?.name?.replace(/\s+/g, '_') || 'Employee'}_${new Date().toISOString().split('T')[0]}.pdf`;
            await downloadPdsPdf(printRef.current, fileName);
            
            // Hide print view after PDF generation
            printRef.current.style.display = 'none';
            printRef.current.style.visibility = 'hidden';
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    if (pds.action === 'approve') {
        // Check if PDS status is pending
        const currentStatus = pdsData?.status || pds?.status;
        if (currentStatus !== 'pending') {
            const modalContent = (
                <div className="fixed top-0 left-0 right-0 bottom-0 z-[9999] h-screen w-screen overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4" style={{ position: 'fixed', margin: 0 }}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h3 className="text-xl font-medium text-gray-900 mb-4">Cannot Approve PDS</h3>
                            <p className="text-gray-600 mb-6">
                                This PDS cannot be approved because it is not in <strong>pending</strong> status. 
                                Current status: <strong>{currentStatus || 'unknown'}</strong>
                            </p>
                            <div className="flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
            return createPortal(modalContent, document.body);
        }

        const modalContent = (
            <div className="fixed top-0 left-0 right-0 bottom-0 z-[9999] h-screen w-screen overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4" style={{ position: 'fixed', margin: 0 }}>
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
        return createPortal(modalContent, document.body);
    }

    if (pds.action === 'for-revision') {
        // Check if PDS status is pending
        const currentStatus = pdsData?.status || pds?.status;
        if (currentStatus !== 'pending') {
            const modalContent = (
                <div className="fixed top-0 left-0 right-0 bottom-0 z-[9999] h-screen w-screen overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4" style={{ position: 'fixed', margin: 0 }}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h3 className="text-xl font-medium text-gray-900 mb-4">Cannot Send for Revision</h3>
                            <p className="text-gray-600 mb-6">
                                This PDS cannot be sent for revision because it is not in <strong>pending</strong> status. 
                                Current status: <strong>{currentStatus || 'unknown'}</strong>
                            </p>
                            <div className="flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
            return createPortal(modalContent, document.body);
        }

        const modalContent = (
            <div className="fixed top-0 left-0 right-0 bottom-0 z-[9999] h-screen w-screen overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4" style={{ position: 'fixed', margin: 0 }}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                    <div className="p-6">
                        <h3 className="text-xl font-medium text-gray-900 mb-4">Send PDS for Revision</h3>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                Employee: <strong>{pds.user?.name}</strong>
                            </p>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Revision Comments <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                rows="4"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Please provide comments for revision..."
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
                                onClick={handleForRevision}
                                disabled={!comments.trim()}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send for Revision
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
        return createPortal(modalContent, document.body);
    }

    if (pds.action === 'decline') {
        // Check if PDS status is pending
        const currentStatus = pdsData?.status || pds?.status;
        if (currentStatus !== 'pending') {
            const modalContent = (
                <div className="fixed top-0 left-0 right-0 bottom-0 z-[9999] h-screen w-screen overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4" style={{ position: 'fixed', margin: 0 }}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h3 className="text-xl font-medium text-gray-900 mb-4">Cannot Decline PDS</h3>
                            <p className="text-gray-600 mb-6">
                                This PDS cannot be declined because it is not in <strong>pending</strong> status. 
                                Current status: <strong>{currentStatus || 'unknown'}</strong>
                            </p>
                            <div className="flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
            return createPortal(modalContent, document.body);
        }

        const modalContent = (
            <div className="fixed top-0 left-0 right-0 bottom-0 z-[9999] h-screen w-screen overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4" style={{ position: 'fixed', margin: 0 }}>
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
        return createPortal(modalContent, document.body);
    }

    // View mode - show PDF in iframe (inline container)
    return (
        <div className="w-full flex flex-col bg-white">
            {/* Header with buttons */}
            <div className="flex justify-between items-center p-4 border-b bg-white">
                <h3 className="text-xl font-bold text-gray-900">
                    PDS Review - {pds.user?.name}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={generatingPdf || !pdfUrl}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {generatingPdf ? 'Generating...' : 'Download PDF'}
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={generatingPdf || !pdfUrl}
                        data-pds-print-button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        Print
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Hidden print view for PDF generation */}
            <div ref={printRef} className="pds-printable-area bg-white" style={{ display: 'none', padding: '10px', width: '100%', position: 'absolute', left: '-9999px' }}>
                {pdsData?.form_data || pds?.form_data ? (
                    <PdsPrintView formData={pdsData?.form_data || pds.form_data} />
                ) : null}
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <LoadingSpinner size="lg" text="Loading PDS..." />
                </div>
            ) : generatingPdf ? (
                <div className="flex items-center justify-center py-20">
                    <LoadingSpinner size="lg" text="Generating PDF..." />
                </div>
            ) : pdfUrl ? (
                <div className="w-full" style={{ height: '800px' }}>
                    {/* PDF Viewer in iframe */}
                    <iframe
                        ref={pdfIframeRef}
                        src={pdfUrl}
                        className="w-full h-full border-0"
                        title="PDS PDF Viewer"
                    />
                </div>
            ) : (pdsData?.form_data || pds?.form_data) ? (
                <div className="flex items-center justify-center py-20">
                    <LoadingSpinner size="lg" text="Preparing PDF view..." />
                </div>
            ) : (
                <div className="flex items-center justify-center py-20">
                    <p className="text-center text-gray-500">Failed to load PDS data</p>
                </div>
            )}
            
            {/* Action buttons - only show for pending PDS */}
            {(pdsData?.status === 'pending' || pds?.status === 'pending') && (
                <div className="flex justify-end gap-3 p-4 border-t bg-white">
                    <button
                        onClick={() => {
                            if (onDeclineClick) {
                                // Call the callback to trigger decline modal in parent
                                onDeclineClick();
                            } else {
                                // Fallback: close and let parent handle it
                                onClose();
                            }
                        }}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                        Decline
                    </button>
                    <button
                        onClick={handleApprove}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                        Approve
                    </button>
                </div>
            )}

            {/* Print Styles */}
            <style>{`
                /* PDF mode - show print view, hide screen view */
                .pdf-mode .pds-printable-area {
                    display: block !important;
                }
                .pdf-mode .pds-screen-view {
                    display: none !important;
                }
                
                /* Print mode - show print view, hide screen view */
                @media print {
                    @page {
                        margin: 8mm 25mm;
                        size: A4;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Hide everything by default when printing PDS */
                    body.printing-pds > *:not(.pds-printable-area),
                    body.printing-pds #root > *:not(.pds-printable-area) {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    /* Hide modal and app elements */
                    .fixed,
                    .no-print,
                    .pds-screen-view,
                    header,
                    nav,
                    aside,
                    .sidebar {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    /* Show and style printable area */
                    .pds-printable-area {
                        display: block !important;
                        visibility: visible !important;
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        height: auto !important;
                        background: white !important;
                        padding: 10mm 25mm !important;
                        margin: 0 !important;
                        overflow: visible !important;
                        page-break-inside: avoid !important;
                        z-index: 999999 !important;
                    }
                    /* Make all children of printable area visible */
                    .pds-printable-area,
                    .pds-printable-area * {
                        visibility: visible !important;
                    }
                    .pds-official-print {
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 0 15px !important;
                        overflow: visible !important;
                        word-wrap: break-word !important;
                    }
                    .pds-official-print table {
                        table-layout: auto !important;
                        word-wrap: break-word !important;
                    }
                    .pds-official-print td,
                    .pds-official-print th {
                        word-wrap: break-word !important;
                        overflow: visible !important;
                    }
                    .no-print,
                    .no-print * {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    .bg-black,
                    .bg-opacity-50,
                    .fixed.inset-0 {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

export default PdsReviewModal;


