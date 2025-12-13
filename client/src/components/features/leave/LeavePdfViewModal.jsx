import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import LeaveFormPdf from './LeaveFormPdf';
import { generateLeavePdfUrl, downloadLeavePdf } from '../../../utils/leavePdfGenerator';
import { getLeaveApplication } from '../../../api/leave/leaveApplications';
import LoadingSpinner from '../../Loading/LoadingSpinner';

function LeavePdfViewModal({ isOpen, onClose, leaveId }) {
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const printRef = useRef(null);
  const pdfIframeRef = useRef(null);

  useEffect(() => {
    if (isOpen && leaveId) {
      loadLeaveData();
    } else {
      // Clean up PDF URL when modal closes
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      setLeave(null);
    }
  }, [isOpen, leaveId]);

  useEffect(() => {
    // Clean up PDF URL on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const loadLeaveData = async () => {
    try {
      setLoading(true);
      const data = await getLeaveApplication(leaveId);
      setLeave(data);
    } catch (err) {
      console.error('Error loading leave:', err);
    } finally {
      setLoading(false);
    }
  };

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
      const url = await generateLeavePdfUrl(printRef.current);
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

  const handlePrint = async () => {
    try {
      // If PDF is already loaded in iframe, use it for printing
      if (pdfUrl && pdfIframeRef.current) {
        try {
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
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        urlToPrint = await generateLeavePdfUrl(printRef.current);
        setPdfUrl(urlToPrint);
        
        // Hide print view after PDF generation
        printRef.current.style.display = 'none';
        printRef.current.style.visibility = 'hidden';
      }
      
      // Open print dialog
      const printWindow = window.open(urlToPrint, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error('Error printing PDF:', error);
    }
  };


  const handleDownload = async () => {
    try {
      if (!printRef.current) return;
      
      // Show print view temporarily for PDF generation
      printRef.current.style.display = 'block';
      printRef.current.style.visibility = 'visible';
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const fileName = `Leave_Application_${leave?.id || leaveId}_${new Date().toISOString().split('T')[0]}.pdf`;
      await downloadLeavePdf(printRef.current, fileName);
      
      // Hide print view after PDF generation
      printRef.current.style.display = 'none';
      printRef.current.style.visibility = 'hidden';
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  // Auto-generate PDF when leave data is loaded
  useEffect(() => {
    if (leave && isOpen && !pdfUrl && !generatingPdf) {
      generatePdfForView();
    }
  }, [leave, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Leave Application Form (CS Form No. 6)</h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={!leave || generatingPdf}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Print
            </button>
            <button
              onClick={handleDownload}
              disabled={!leave || generatingPdf}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
            </div>
          ) : leave ? (
            <>
              {/* PDF Preview */}
              {pdfUrl ? (
                <iframe
                  ref={pdfIframeRef}
                  src={pdfUrl}
                  className="w-full h-full min-h-[600px] border border-gray-300"
                  title="Leave Application PDF"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  {generatingPdf ? (
                    <div className="text-center">
                      <LoadingSpinner />
                      <p className="mt-4 text-gray-600">Generating PDF...</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Loading PDF...</p>
                  )}
                </div>
              )}

              {/* Hidden print view for PDF generation */}
              <div
                ref={printRef}
                style={{
                  position: 'absolute',
                  left: '-9999px',
                  top: '-9999px',
                  visibility: 'hidden',
                  display: 'none'
                }}
              >
                <LeaveFormPdf leave={leave} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Failed to load leave application</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeavePdfViewModal;

