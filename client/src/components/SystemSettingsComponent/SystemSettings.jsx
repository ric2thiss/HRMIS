import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';
import api from '../../api/axios';

function SystemSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [initialized, setInitialized] = useState(false); // Track initial fetch
  const [loading, setLoading] = useState(true); // Optional loading state

  // ✅ Fetch current maintenance mode when component mounts
  useEffect(() => {
    async function fetchMaintenance() {
      try {
        const res = await api.get("/api/maintenance-mode");
        setMaintenanceMode(!!res.data.is_enabled); // ensure boolean
        console.log("Fetched maintenance mode:", res.data.is_enabled);
      } catch (err) {
        console.error("Error fetching maintenance mode:", err);
      } finally {
        setInitialized(true); // allow updates only after fetch
        setLoading(false);
      }
    }

    fetchMaintenance();
  }, []);

  // ✅ Update maintenance mode only when user toggles (not on initial fetch)
  useEffect(() => {
    if (!initialized) return; // skip first render

    const updateMaintenance = async () => {
      try {
        await api.put('/api/maintenance-mode', {
          is_enabled: maintenanceMode,
          message: maintenanceMode 
            ? "System is currently under maintenance."
            : "System is now available."
        });

        console.log("Maintenance mode updated:", maintenanceMode);
      } catch (error) {
        console.error("Error updating maintenance mode:", error);
      }
    };

    updateMaintenance();
  }, [maintenanceMode, initialized]);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading system settings...
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
      <Link 
        to="/dashboard"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline transition-colors text-base mb-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 mr-1"
        >
          <path d="M19 12H5" />
          <path d="M12 5l-7 7 7 7" />
        </svg>
        <span>Back</span>
      </Link>

      <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>

      <div className="flex items-center gap-3">
        <ToggleSwitch 
          enabled={maintenanceMode} 
          onChange={setMaintenanceMode}
        />
        <span className="text-gray-700 font-medium">
          Maintenance Mode: {maintenanceMode ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
}

export default SystemSettings;
