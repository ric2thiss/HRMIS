import React, { useEffect, useState, useRef } from 'react';
import ToggleSwitch from '../../ui/ToggleSwitch/ToggleSwitch';
import { getMaintenanceStatus, updateMaintenanceMode } from '../../../api/system/maintenance-mode';
import { useNotification } from '../../../context/NotificationContext';
import api from '../../../api/axios';

function SystemSettings() {
  const { showSuccess, showError } = useNotification();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowedLoginRoles, setAllowedLoginRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isInitialMount = useRef(true);

  // Fetch available roles and current maintenance mode when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch available roles
        await api.get('/sanctum/csrf-cookie');
        const rolesRes = await api.get('/api/roles');
        const roles = rolesRes.data.roles || [];
        setAvailableRoles(roles);

        // Fetch maintenance status
        const data = await getMaintenanceStatus();
        setMaintenanceMode(!!data.is_enabled);
        setAllowedLoginRoles(data.allowed_login_roles || ['admin', 'hr']);
        setMessage(data.message || '');
      } catch (err) {
        setError('Failed to load system settings');
        showError('Failed to load system settings');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showError]);

  // Mark initial mount as complete after first render
  useEffect(() => {
    if (!loading) {
      // Use a small delay to ensure state is set
      const timer = setTimeout(() => {
        isInitialMount.current = false;
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleMaintenanceToggle = async (enabled) => {
    // Skip if this is still the initial mount or still loading
    if (isInitialMount.current || loading) {
      return;
    }

    // Don't update if the value hasn't changed
    if (enabled === maintenanceMode) {
      return;
    }

    const previousValue = maintenanceMode;
    setMaintenanceMode(enabled);
    setError(null);

    try {
      await updateMaintenanceMode(
        enabled,
        enabled 
          ? (message || "System is currently under maintenance.")
          : "System is now available.",
        allowedLoginRoles
      );
      showSuccess(`Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      setError('Failed to update maintenance mode');
      showError('Failed to update maintenance mode. Please try again.');
      // Revert toggle on error
      setMaintenanceMode(previousValue);
    }
  };

  const handleRoleToggle = async (roleName, isChecked) => {
    // Skip if this is still the initial mount or still loading
    if (isInitialMount.current || loading) {
      return;
    }

    const newAllowedRoles = isChecked
      ? [...allowedLoginRoles, roleName]
      : allowedLoginRoles.filter(role => role !== roleName);

    // Don't allow removing all roles
    if (newAllowedRoles.length === 0) {
      showError('At least one role must be allowed to login during maintenance');
      return;
    }

    const previousValue = [...allowedLoginRoles];
    setAllowedLoginRoles(newAllowedRoles);
    setError(null);

    try {
      await updateMaintenanceMode(
        maintenanceMode,
        message || (maintenanceMode ? "System is currently under maintenance." : "System is now available."),
        newAllowedRoles
      );
      showSuccess(`Login access updated successfully`);
    } catch (err) {
      setError('Failed to update login access');
      showError('Failed to update login access. Please try again.');
      // Revert on error
      setAllowedLoginRoles(previousValue);
    }
  };

  // Debounce message updates
  const messageUpdateTimeoutRef = useRef(null);

  const handleMessageChange = (newMessage) => {
    setMessage(newMessage);
    
    // Clear previous timeout
    if (messageUpdateTimeoutRef.current) {
      clearTimeout(messageUpdateTimeoutRef.current);
    }

    // Debounce: only save after user stops typing for 1 second
    messageUpdateTimeoutRef.current = setTimeout(async () => {
      try {
        await updateMaintenanceMode(
          maintenanceMode,
          newMessage || (maintenanceMode ? "System is currently under maintenance." : "System is now available."),
          allowedLoginRoles
        );
        showSuccess('Maintenance message updated successfully');
      } catch (err) {
        showError('Failed to update maintenance message.');
      }
    }, 1000);
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading system settings...
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Maintenance Mode Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <ToggleSwitch 
              enabled={maintenanceMode} 
              onChange={handleMaintenanceToggle}
            />
            <div>
              <span className="text-gray-700 font-medium block">
                Maintenance Mode: {maintenanceMode ? "ON" : "OFF"}
              </span>
              <span className="text-sm text-gray-500">
                {maintenanceMode 
                  ? "System is currently under maintenance."
                  : "System is available to all users."}
              </span>
            </div>
          </div>
        </div>

        {/* Allow Login - Role Selection */}
        {maintenanceMode && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Allow Login: Type of users
            </label>
            <div className="space-y-2">
              {availableRoles.map((role) => {
                const isChecked = allowedLoginRoles.includes(role.name);
                return (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleRoleToggle(role.name, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={loading || (isChecked && allowedLoginRoles.length === 1)}
                    />
                    <span className="text-gray-700 capitalize">
                      {role.name}
                    </span>
                    {isChecked && allowedLoginRoles.length === 1 && (
                      <span className="text-xs text-gray-500">(At least one role required)</span>
                    )}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Select which user types can login during maintenance mode.
            </p>
          </div>
        )}

        {/* Maintenance Message */}
        {maintenanceMode && (
          <div className="p-4 border rounded-lg">
            <label htmlFor="maintenance-message" className="block text-sm font-medium text-gray-700 mb-2">
              Maintenance Message
            </label>
            <textarea
              id="maintenance-message"
              value={message}
              onChange={(e) => handleMessageChange(e.target.value)}
              placeholder="Enter maintenance message (e.g., 'System is currently under maintenance.')"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
            <p className="mt-1 text-xs text-gray-500">
              This message will be shown to users when maintenance mode is active.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SystemSettings;
