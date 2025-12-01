import React, { useState, useEffect, useRef } from 'react';
import { getPds } from '../../../api/pds/pds';
import PdsForm from '../../PdsForm/PdsForm';
import PdsPrintView from '../../PdsForm/PdsPrintView';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function PdsReviewModal({ pds, onClose, onApprove, onDecline }) {
    const [pdsData, setPdsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [comments, setComments] = useState('');
    const printRef = useRef(null);

    useEffect(() => {
        if (pds && pds.action === 'view') {
            // Always load full PDS data when viewing to ensure we have complete form_data including images
            loadPdsData();
        } else if (pds && (pds.action === 'approve' || pds.action === 'decline')) {
            // For approve/decline actions, use the pds data directly
            setPdsData(pds);
        }
    }, [pds]);

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
            alert('Please provide a reason for declining');
            return;
        }
        onDecline(comments);
    };

    const handlePrint = () => {
        if (!printRef.current) return;
        
        // Show print view and hide screen view before printing
        printRef.current.style.display = 'block';
        printRef.current.style.visibility = 'visible';
        
        const screenView = document.querySelector('.pds-screen-view');
        if (screenView) {
            screenView.style.display = 'none';
        }
        
        // Add a class to body to help with print styling
        document.body.classList.add('printing-pds');
        
        // Small delay to ensure content is rendered
        setTimeout(() => {
            window.print();
            
            // Restore original display state after printing
            setTimeout(() => {
                printRef.current.style.display = 'none';
                printRef.current.style.visibility = '';
                
                if (screenView) {
                    screenView.style.display = 'block';
                }
                
                document.body.classList.remove('printing-pds');
            }, 100);
        }, 200);
    };

    const handleDownloadPDF = async () => {
        if (!printRef.current) return;

        try {
            // Show print view and hide screen view for PDF generation
            printRef.current.style.display = 'block';
            const screenView = document.querySelector('.pds-screen-view');
            if (screenView) {
                screenView.style.display = 'none';
            }
            
            // Wait a bit to ensure all content is rendered
            await new Promise(resolve => setTimeout(resolve, 1000));

            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: printRef.current.scrollWidth,
                windowHeight: printRef.current.scrollHeight,
                scrollX: 0,
                scrollY: 0,
            });

            // Restore original display state
            printRef.current.style.display = 'none';
            if (screenView) {
                screenView.style.display = 'block';
            }

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add additional pages if needed
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const fileName = `PDS_${pds.user?.name?.replace(/\s+/g, '_') || 'Employee'}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
        } catch (err) {
            console.error('Error generating PDF:', err);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    if (pds.action === 'approve') {
        // Check if PDS status is pending
        const currentStatus = pdsData?.status || pds?.status;
        if (currentStatus !== 'pending') {
            return (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
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
        }

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
        // Check if PDS status is pending
        const currentStatus = pdsData?.status || pds?.status;
        if (currentStatus !== 'pending') {
            return (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
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
        }

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
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop - covers entire screen */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50" 
                onClick={onClose}
            ></div>
            
            {/* Modal Content */}
            <div className="relative min-h-screen px-4 py-8 flex items-start justify-center">
                <div 
                    className="bg-white max-w-7xl w-full mx-auto my-8 relative z-10 overflow-x-hidden"
                    style={{ boxShadow: 'none' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with buttons - hidden when printing */}
                    <div className="flex justify-between items-center mb-6 p-6 border-b no-print">
                        <h3 className="text-2xl font-bold text-gray-900">
                            PDS Review - {pds.user?.name}
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDownloadPDF}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                Download PDF
                            </button>
                            <button
                                onClick={handlePrint}
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
                        <div className="space-y-4 overflow-x-hidden">
                            {/* PDS Form - printable area for PDF/Print (hidden on screen, shown when printing) */}
                            <div ref={printRef} className="pds-printable-area bg-white overflow-x-auto print-only" style={{ display: 'none', padding: '10px', width: '100%' }}>
                                <PdsPrintView formData={pdsData?.form_data || pds.form_data} />
                            </div>
                            {/* PDS Form - normal view for screen (hidden when printing) */}
                            <div className="pds-screen-view">
                                <PdsForm 
                                    key={pdsData?.id || pds?.id || 'pds-view'} 
                                    initialData={pdsData?.form_data || pds.form_data} 
                                    readOnly={true} 
                                />
                            </div>
                            
                            {/* Action buttons - hidden when printing - only show for pending PDS */}
                            {(pdsData?.status === 'pending' || pds?.status === 'pending') && (
                                <div className="flex justify-end gap-3 pt-4 border-t no-print p-6">
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
                            )}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-10">Failed to load PDS data</p>
                    )}
                </div>
            </div>

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


