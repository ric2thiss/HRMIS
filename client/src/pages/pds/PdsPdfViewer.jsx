import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppLayout from '../../components/Layout/AppLayout';
import { getPds } from '../../api/pds/pds';
import PdsPrintView from '../../components/PdsForm/PdsPrintView';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import LoadingScreen from '../../components/Loading/LoadingScreen';

/**
 * HR PDS PDF Viewer
 * - Loads a PDS by ID
 * - Renders the official print view off-screen
 * - Generates a PDF and shows it in an embedded viewer
 * - Provides Download, Print, and Cancel buttons
 */
function PdsPdfViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  const printRef = useRef(null);
  const iframeRef = useRef(null);

  const [pdsData, setPdsData] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
      if (!id) return;

      const load = async () => {
          try {
              setError(null);
              const data = await getPds(id);
              setPdsData(data);
          } catch (err) {
              console.error('Failed to load PDS:', err);
              setError('Failed to load PDS.');
          }
      };

      load();
  }, [id]);

  // Generate PDF once PDS data and hidden print view are ready
  useEffect(() => {
      if (!pdsData || !printRef.current || pdfUrl || generating) return;

      const generatePdf = async () => {
          try {
              setGenerating(true);

              // Ensure the printable area is visible for rendering
              const originalDisplay = printRef.current.style.display;
              printRef.current.style.display = 'block';

              await new Promise(resolve => setTimeout(resolve, 500));

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

              // Restore original display
              printRef.current.style.display = originalDisplay || 'none';

              const imgData = canvas.toDataURL('image/png', 1.0);
              const pdf = new jsPDF('p', 'mm', 'a4');
              const imgWidth = 210;
              const pageHeight = 297;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              let heightLeft = imgHeight;
              let position = 0;

              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;

              while (heightLeft > 0) {
                  position = heightLeft - imgHeight;
                  pdf.addPage();
                  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                  heightLeft -= pageHeight;
              }

              const blob = pdf.output('blob');
              const url = URL.createObjectURL(blob);
              setPdfUrl(url);
          } catch (err) {
              console.error('Failed to generate PDF:', err);
              setError('Failed to generate PDF.');
          } finally {
              setGenerating(false);
          }
      };

      generatePdf();
  }, [pdsData, pdfUrl, generating]);

  // Cleanup blob URL on unmount
  useEffect(() => {
      return () => {
          if (pdfUrl) {
              URL.revokeObjectURL(pdfUrl);
          }
      };
  }, [pdfUrl]);

  if (loading) {
      return <LoadingScreen />;
  }

  const handleDownload = () => {
      if (!pdfUrl || !pdsData) return;
      const link = document.createElement('a');
      const fileName = `PDS_${pdsData.user?.name?.replace(/\s+/g, '_') || 'Employee'}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handlePrint = () => {
      if (!iframeRef.current) return;
      const iframeWindow = iframeRef.current.contentWindow;
      if (!iframeWindow) return;
      iframeWindow.focus();
      iframeWindow.print();
  };

  const handleCancel = () => {
      navigate(-1);
  };

  return (
      <AppLayout user={user} logout={logout} loading={loading} title="PDS PDF Viewer">
          <div className="bg-white rounded-xl shadow-lg p-4 h-[calc(100vh-8rem)] flex flex-col">
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b pb-3 mb-3">
                  <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                          PDS PDF Viewer
                      </h2>
                      <p className="text-sm text-gray-500">
                          {pdsData?.user?.name || 'Loading employee...'}
                      </p>
                  </div>
                  <div className="flex gap-2">
                      <button
                          onClick={handleDownload}
                          disabled={!pdfUrl}
                          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Download
                      </button>
                      <button
                          onClick={handlePrint}
                          disabled={!pdfUrl}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Print
                      </button>
                      <button
                          onClick={handleCancel}
                          className="px-4 py-2 border border-gray-300 text-sm rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                          Cancel
                      </button>
                  </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col">
                  {error && (
                      <div className="mb-3 text-sm text-red-600">
                          {error}
                      </div>
                  )}
                  {(!pdsData || generating || !pdfUrl) ? (
                      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                          {error ? 'Unable to display PDF.' : 'Preparing PDF, please wait...'}
                      </div>
                  ) : (
                      <iframe
                          ref={iframeRef}
                          src={pdfUrl}
                          title="PDS PDF"
                          className="flex-1 w-full border rounded-lg"
                      />
                  )}
              </div>

              {/* Hidden printable area for PDF generation */}
              <div
                  ref={printRef}
                  style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px' }}
              >
                  <PdsPrintView formData={pdsData?.form_data} />
              </div>
          </div>
      </AppLayout>
  );
}

export default PdsPdfViewer;


