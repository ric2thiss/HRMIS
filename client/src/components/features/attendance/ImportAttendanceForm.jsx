import React, { useState } from 'react';
import { useNotification } from '../../../context/NotificationContext';

function ImportAttendanceForm() {
  const { showSuccess, showError } = useNotification();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importHistory, setImportHistory] = useState([
    {
      id: 1,
      filename: 'attendance_november_2024.xlsx',
      date: '2024-11-30',
      records: 150,
      status: 'success',
    },
    {
      id: 2,
      filename: 'attendance_october_2024.xlsx',
      date: '2024-10-31',
      records: 148,
      status: 'success',
    },
  ]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
      ];
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
        showError('Please upload a valid Excel (.xlsx, .xls) or CSV file');
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
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate success
      const newRecord = {
        id: importHistory.length + 1,
        filename: file.name,
        date: new Date().toISOString().split('T')[0],
        records: Math.floor(Math.random() * 200) + 100,
        status: 'success',
      };

      setImportHistory(prev => [newRecord, ...prev]);
      showSuccess(`Successfully imported ${newRecord.records} attendance records`);
      setFile(null);
      e.target.reset();
    } catch (error) {
      showError('Failed to import attendance. Please check the file format and try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    showSuccess('Template download started');
    // TODO: Implement actual template download
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Import Attendance Data</h2>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">File Requirements:</h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Supported formats: Excel (.xlsx, .xls) or CSV</li>
            <li>Maximum file size: 10MB</li>
            <li>Required columns: Employee ID, Date, Time In, Time Out</li>
            <li>Date format: YYYY-MM-DD or MM/DD/YYYY</li>
            <li>Time format: HH:MM (24-hour format)</li>
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
              accept=".xlsx,.xls,.csv"
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Import History</h2>
        
        {importHistory.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No import history available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Import Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Records</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
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
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.records} records
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        {record.status === 'success' ? 'Success' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImportAttendanceForm;

