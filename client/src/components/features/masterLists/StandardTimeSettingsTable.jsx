import React, { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { getStandardTimeSettings, updateStandardTimeSettings } from '../../../api/attendance/standardTime';
import { useNotificationStore } from '../../../stores/notificationStore';
import LoadingSpinner from '../../Loading/LoadingSpinner';

function StandardTimeSettingsTable() {
  const [loading, setLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    time_in: '08:00:00',
    time_out: '17:00:00',
  });
  const [settings, setSettings] = useState(null);

  const showSuccess = useNotificationStore((state) => state.showSuccess);
  const showError = useNotificationStore((state) => state.showError);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getStandardTimeSettings();
      setSettings(data);
      setFormData({
        time_in: data.time_in || '08:00:00',
        time_out: data.time_out || '17:00:00',
      });
    } catch (err) {
      showError('Failed to load standard time settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateStandardTimeSettings(formData);
      showSuccess('Standard time settings updated successfully');
      setIsFormVisible(false);
      loadSettings();
    } catch (err) {
      showError(err?.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    if (settings) {
      setFormData({
        time_in: settings.time_in || '08:00:00',
        time_out: settings.time_out || '17:00:00',
      });
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-700">Standard Time Settings</h3>
          <p className="text-sm text-gray-500 mt-1">
            Set the standard time in and time out for attendance monitoring
          </p>
        </div>
        <button
          onClick={handleEdit}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 flex items-center gap-2"
          disabled={loading}
        >
          <Pencil className="w-4 h-4" />
          Edit Settings
        </button>
      </div>

      {loading && !settings ? (
        <div className="text-center py-8">
          <LoadingSpinner size="md" inline={false} />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="text-sm font-medium text-gray-500 uppercase">Standard Time In</h4>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {settings ? formatTime(settings.time_in) : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {settings ? settings.time_in : 'Not set'}
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="text-sm font-medium text-gray-500 uppercase">Standard Time Out</h4>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {settings ? formatTime(settings.time_out) : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {settings ? settings.time_out : 'Not set'}
              </p>
            </div>
          </div>
        </div>
      )}

      {isFormVisible && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Standard Time Settings
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time In
                    </label>
                    <input
                      type="time"
                      value={formData.time_in}
                      onChange={(e) => setFormData({ ...formData, time_in: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Out
                    </label>
                    <input
                      type="time"
                      value={formData.time_out}
                      onChange={(e) => setFormData({ ...formData, time_out: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StandardTimeSettingsTable;

