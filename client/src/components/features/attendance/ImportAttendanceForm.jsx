import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNotificationStore } from '../../../stores/notificationStore';
import { importAttendance, getImportHistory, undoImport } from '../../../api/attendance/attendance';
import LoadingSpinner from '../../Loading/LoadingSpinner';

function ImportAttendanceForm() {
  const showSuccess = useNotificationStore((state) => state.showSuccess);
  const showError = useNotificationStore((state) => state.showError);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [importHistory, setImportHistory] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });
  const [undoing, setUndoing] = useState({});
  const [confirmUndo, setConfirmUndo] = useState(null); // { filename, records }

  // Load import history on mount and when pagination changes
  useEffect(() => {
    loadImportHistory();
  }, [pagination.current_page, pagination.per_page]);

  const loadImportHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await getImportHistory({
        per_page: pagination.per_page,
        page: pagination.current_page,
      });
      
      if (response.history) {
        setImportHistory(response.history.map((item, index) => ({
          id: index + 1,
          filename: item.filename,
          date: item.imported_at,
          records: item.records,
          status: 'success',
          imported_by: item.imported_by,
        })));
      }
      
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          current_page: response.pagination.current_page || 1,
          per_page: response.pagination.per_page || 10,
          total: response.pagination.total || 0,
          last_page: response.pagination.last_page || 1,
        }));
      }
    } catch (error) {
      console.error('Failed to load import history:', error);
      showError('Failed to load import history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleUndoClick = (filename) => {
    const record = importHistory.find(h => h.filename === filename);
    setConfirmUndo({
      filename: filename,
      records: record?.records || 0,
    });
  };

  const handleUndoConfirm = async () => {
    if (!confirmUndo) return;

    const { filename } = confirmUndo;
    setUndoing(prev => ({ ...prev, [filename]: true }));
    setConfirmUndo(null); // Close modal

    try {
      const response = await undoImport(filename);
      showSuccess(response.message || `Successfully undone import of ${filename}`);
      
      // Reload import history
      await loadImportHistory();
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to undo import';
      showError(message);
    } finally {
      setUndoing(prev => {
        const newState = { ...prev };
        delete newState[filename];
        return newState;
      });
    }
  };

  const handleUndoCancel = () => {
    setConfirmUndo(null);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.last_page) return;
    setPagination(prev => ({
      ...prev,
      current_page: page,
    }));
  };

  const handlePerPageChange = (e) => {
    const newPerPage = parseInt(e.target.value);
    setPagination(prev => ({
      ...prev,
      per_page: newPerPage,
      current_page: 1, // Reset to first page
    }));
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const totalPages = pagination.last_page;
    const currentPage = pagination.current_page;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type - primarily CSV for biometric devices
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.txt')) {
        showError('Please upload a CSV file from the biometric device');
        return;
      }

      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        showError('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      showError('Please select a file to upload');
      return;
    }

    setLoading(true);

    try {
      const response = await importAttendance(file);
      
      if (response.imported > 0) {
        showSuccess(`Successfully imported ${response.imported} attendance record(s). ${response.skipped > 0 ? `${response.skipped} record(s) skipped.` : ''}`);
        
        // Reload import history
        await loadImportHistory();
        
        // Show errors if any
        if (response.errors && response.errors.length > 0) {
          console.warn('Import warnings:', response.errors);
          // Optionally show errors in a more visible way
          if (response.errors.length <= 5) {
            response.errors.forEach(error => {
              showError(error);
            });
          }
        }
      } else {
        showError('No records were imported. Please check the file format.');
      }
      
      setFile(null);
      e.target.reset();
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to import attendance. Please check the file format and try again.';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    try {
      // CSV headers based on file requirements
      const headers = ['AC No.', 'Name', 'Date and Time', 'State'];
      
      // Example row to show the format
      const exampleRow = ['12345', 'John Doe', '2024-01-15 08:30:00', 'Check In'];
      
      // Helper function to escape CSV values
      const escapeCsvValue = (value) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };
      
      // Create CSV content with proper escaping
      const csvContent = [
        headers.map(escapeCsvValue).join(','),
        exampleRow.map(escapeCsvValue).join(',')
      ].join('\n');
      
      // Add BOM for UTF-8 to ensure proper encoding in Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', 'attendance_template.csv');
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      URL.revokeObjectURL(url);
      
      showSuccess('Template downloaded successfully');
    } catch (error) {
      console.error('Failed to download template:', error);
      showError('Failed to download template');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Import Attendance Data</h2>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">File Requirements:</h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Supported format: CSV file from biometric device</li>
            <li>Maximum file size: 10MB</li>
            <li>Required columns: AC No., Name, Date and Time, State</li>
            <li>The system will automatically match AC No. to employee IDs</li>
            <li>Date and Time should be in a standard format (e.g., YYYY-MM-DD HH:MM:SS)</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".csv,.txt"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={downloadTemplate}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Download Template
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Importing...' : 'Import Attendance'}
            </button>
          </div>
        </form>
      </div>

      {/* Import History */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Import History</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Total: {pagination.total} imports
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Per page:</label>
              <select
                value={pagination.per_page}
                onChange={handlePerPageChange}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
        
        {loadingHistory ? (
          <div className="flex justify-center items-center py-10">
            <LoadingSpinner text="Loading import history..." />
          </div>
        ) : importHistory.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No import history available
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Import Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Records</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Imported By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {importHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.filename}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.records} records
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.imported_by || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          {record.status === 'success' ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleUndoClick(record.filename)}
                          disabled={undoing[record.filename]}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          <span>Undo</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex items-center gap-2">
                  {/* First Page Button */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.current_page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="First page"
                  >
                    ««
                  </button>
                  
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  {/* Page Number Buttons */}
                  <div className="flex gap-1">
                    {getPageNumbers().map((page, index) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 border rounded-lg transition-colors ${
                            pagination.current_page === page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.last_page}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>

                  {/* Last Page Button */}
                  <button
                    onClick={() => handlePageChange(pagination.last_page)}
                    disabled={pagination.current_page >= pagination.last_page}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Last page"
                  >
                    »»
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Undo Confirmation Modal */}
      {confirmUndo && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirm Undo Import
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to undo the import of:
                </p>
                <p className="text-sm font-medium text-gray-900 mb-2 break-words">
                  {confirmUndo.filename}
                </p>
                <p className="text-sm text-gray-600">
                  This will delete <span className="font-semibold text-red-600">{confirmUndo.records}</span> attendance record(s) from this file.
                </p>
                <p className="text-sm text-red-600 font-semibold mt-2">
                  This action cannot be undone!
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleUndoCancel}
                  disabled={undoing[confirmUndo.filename]}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUndoConfirm}
                  disabled={undoing[confirmUndo.filename]}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {undoing[confirmUndo.filename] ? (
                    <>
                      <LoadingSpinner size="sm" inline={true} color="white" />
                      <span>Undoing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      <span>Confirm Undo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default ImportAttendanceForm;

