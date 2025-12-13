import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  getSystemHealth,
  getDatabaseHealth,
  getStorageHealth,
  getMemoryHealth,
  getActivityLogs,
  getLoginLogs,
  getHttpRequestLogs,
  exportAnalytics,
  cleanupActivityLogs,
  cleanupLoginLogs,
  cleanupHttpRequestLogs,
  cleanupStorage,
  backupDatabase,
  clearCache
} from '../../../api/admin/adminDashboard';
import api from '../../../api/axios';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import ChartCard from '../dashboard/ChartCard';
import LoadingSpinner from '../../Loading/LoadingSpinner';
import BackButton from '../../ui/BackButton/BackButton';

const AdminDashboard = () => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [databaseHealth, setDatabaseHealth] = useState(null);
  const [storageHealth, setStorageHealth] = useState(null);
  const [memoryHealth, setMemoryHealth] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [httpRequestLogs, setHttpRequestLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('health');
  const terminalRef = useRef(null);
  const activityLogsRef = useRef(null);
  const loginLogsRef = useRef(null);
  
  // Pagination states
  const [activityLogsOffset, setActivityLogsOffset] = useState(0);
  const [loginLogsOffset, setLoginLogsOffset] = useState(0);
  const [hasMoreActivityLogs, setHasMoreActivityLogs] = useState(true);
  const [hasMoreLoginLogs, setHasMoreLoginLogs] = useState(true);
  const [loadingMoreActivityLogs, setLoadingMoreActivityLogs] = useState(false);
  const [loadingMoreLoginLogs, setLoadingMoreLoginLogs] = useState(false);
  
  // Cleanup states
  const [cleaningUp, setCleaningUp] = useState(false);
  const [cleanupType, setCleanupType] = useState(null);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupConfig, setCleanupConfig] = useState(null);
  const [retentionDays, setRetentionDays] = useState(90);
  
  // Backup states
  const [backingUp, setBackingUp] = useState(false);
  
  // Cache states
  const [clearingCache, setClearingCache] = useState(false);
  
  const ITEMS_PER_PAGE = 20;

  const fetchAllData = async () => {
    try {
      await api.get("/sanctum/csrf-cookie", { withCredentials: true });
      
      const [
        system,
        database,
        storage,
        memory,
        activities,
        logins,
        httpRequests
      ] = await Promise.all([
        getSystemHealth(),
        getDatabaseHealth(),
        getStorageHealth(),
        getMemoryHealth(),
        getActivityLogs(ITEMS_PER_PAGE, 0),
        getLoginLogs(ITEMS_PER_PAGE, 0),
        getHttpRequestLogs(100, 0)
      ]);

      setSystemHealth(system);
      setDatabaseHealth(database);
      setStorageHealth(storage);
      setMemoryHealth(memory);
      setActivityLogs(activities.logs || []);
      setLoginLogs(logins.logs || []);
      setHttpRequestLogs(httpRequests.logs || []);
      
      // Reset pagination states
      setActivityLogsOffset(ITEMS_PER_PAGE);
      setLoginLogsOffset(ITEMS_PER_PAGE);
      setHasMoreActivityLogs((activities.logs || []).length === ITEMS_PER_PAGE);
      setHasMoreLoginLogs((logins.logs || []).length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreActivityLogs = useCallback(async () => {
    if (loadingMoreActivityLogs || !hasMoreActivityLogs) return;
    
    try {
      setLoadingMoreActivityLogs(true);
      await api.get("/sanctum/csrf-cookie", { withCredentials: true });
      const response = await getActivityLogs(ITEMS_PER_PAGE, activityLogsOffset);
      const newLogs = response.logs || [];
      
      if (newLogs.length === 0) {
        setHasMoreActivityLogs(false);
      } else {
        setActivityLogs(prev => [...prev, ...newLogs]);
        setActivityLogsOffset(prev => prev + ITEMS_PER_PAGE);
        setHasMoreActivityLogs(newLogs.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error loading more activity logs:', error);
    } finally {
      setLoadingMoreActivityLogs(false);
    }
  }, [loadingMoreActivityLogs, hasMoreActivityLogs, activityLogsOffset]);

  const loadMoreLoginLogs = useCallback(async () => {
    if (loadingMoreLoginLogs || !hasMoreLoginLogs) return;
    
    try {
      setLoadingMoreLoginLogs(true);
      await api.get("/sanctum/csrf-cookie", { withCredentials: true });
      const response = await getLoginLogs(ITEMS_PER_PAGE, loginLogsOffset);
      const newLogs = response.logs || [];
      
      if (newLogs.length === 0) {
        setHasMoreLoginLogs(false);
      } else {
        setLoginLogs(prev => [...prev, ...newLogs]);
        setLoginLogsOffset(prev => prev + ITEMS_PER_PAGE);
        setHasMoreLoginLogs(newLogs.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error loading more login logs:', error);
    } finally {
      setLoadingMoreLoginLogs(false);
    }
  }, [loadingMoreLoginLogs, hasMoreLoginLogs, loginLogsOffset]);

  useEffect(() => {
    fetchAllData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-scroll terminal to bottom
    if (terminalRef.current && activeTab === 'http-requests') {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [httpRequestLogs, activeTab]);

  // Handle scroll for activity logs
  useEffect(() => {
    const handleActivityLogsScroll = () => {
      if (!activityLogsRef.current || !hasMoreActivityLogs || loadingMoreActivityLogs) return;
      
      const { scrollTop, scrollHeight, clientHeight } = activityLogsRef.current;
      // Load more when user is 100px from bottom
      if (scrollHeight - scrollTop - clientHeight < 100) {
        loadMoreActivityLogs();
      }
    };

    const container = activityLogsRef.current;
    if (container && activeTab === 'activity-logs') {
      container.addEventListener('scroll', handleActivityLogsScroll);
      return () => container.removeEventListener('scroll', handleActivityLogsScroll);
    }
  }, [activeTab, hasMoreActivityLogs, loadingMoreActivityLogs, loadMoreActivityLogs]);

  // Handle scroll for login logs
  useEffect(() => {
    const handleLoginLogsScroll = () => {
      if (!loginLogsRef.current || !hasMoreLoginLogs || loadingMoreLoginLogs) return;
      
      const { scrollTop, scrollHeight, clientHeight } = loginLogsRef.current;
      // Load more when user is 100px from bottom
      if (scrollHeight - scrollTop - clientHeight < 100) {
        loadMoreLoginLogs();
      }
    };

    const container = loginLogsRef.current;
    if (container && activeTab === 'login-logs') {
      container.addEventListener('scroll', handleLoginLogsScroll);
      return () => container.removeEventListener('scroll', handleLoginLogsScroll);
    }
  }, [activeTab, hasMoreLoginLogs, loadingMoreLoginLogs, loadMoreLoginLogs]);

  const openCleanupModal = (type) => {
    const cleanupConfigs = {
      'activity-logs': { name: 'Activity Logs', defaultDays: 90, description: 'Delete activity logs older than specified days' },
      'login-logs': { name: 'Login Logs', defaultDays: 90, description: 'Delete login logs older than specified days' },
      'http-request-logs': { name: 'HTTP Request Logs', defaultDays: 30, description: 'Delete HTTP request logs older than specified days' },
      'storage': { name: 'Storage', defaultDays: 7, description: 'Clear cache, old log files, and temporary files' },
    };

    const config = cleanupConfigs[type];
    if (!config) return;

    setCleanupConfig({ type, ...config });
    setRetentionDays(config.defaultDays);
    setShowCleanupModal(true);
  };

  const handleCleanup = async () => {
    if (!cleanupConfig) return;

    const { type, name } = cleanupConfig;
    const confirmMessage = `This will ${type === 'storage' ? 'clear storage files' : `delete ${name.toLowerCase()} older than ${retentionDays} days`}.\n\nThis action cannot be undone.\n\nAre you sure you want to proceed?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setCleaningUp(true);
      setCleanupType(type);
      await api.get("/sanctum/csrf-cookie", { withCredentials: true });

      let result;
      if (type === 'storage') {
        result = await cleanupStorage(['cache', 'logs', 'temp'], retentionDays);
      } else if (type === 'activity-logs') {
        result = await cleanupActivityLogs(retentionDays);
      } else if (type === 'login-logs') {
        result = await cleanupLoginLogs(retentionDays);
      } else if (type === 'http-request-logs') {
        result = await cleanupHttpRequestLogs(retentionDays);
      }

      alert(result.message || 'Cleanup completed successfully!');
      
      // Refresh data after cleanup
      if (type === 'activity-logs') {
        setActivityLogs([]);
        setActivityLogsOffset(0);
        setHasMoreActivityLogs(true);
        const activities = await getActivityLogs(ITEMS_PER_PAGE, 0);
        setActivityLogs(activities.logs || []);
        setActivityLogsOffset(ITEMS_PER_PAGE);
        setHasMoreActivityLogs((activities.logs || []).length === ITEMS_PER_PAGE);
      } else if (type === 'login-logs') {
        setLoginLogs([]);
        setLoginLogsOffset(0);
        setHasMoreLoginLogs(true);
        const logins = await getLoginLogs(ITEMS_PER_PAGE, 0);
        setLoginLogs(logins.logs || []);
        setLoginLogsOffset(ITEMS_PER_PAGE);
        setHasMoreLoginLogs((logins.logs || []).length === ITEMS_PER_PAGE);
      } else if (type === 'http-request-logs') {
        const httpRequests = await getHttpRequestLogs(100, 0);
        setHttpRequestLogs(httpRequests.logs || []);
      } else if (type === 'storage') {
        // Refresh storage health
        const storage = await getStorageHealth();
        setStorageHealth(storage);
      }

      setShowCleanupModal(false);
      setCleanupConfig(null);
    } catch (error) {
      console.error(`Error cleaning up ${type}:`, error);
      alert(error.response?.data?.error || `Failed to cleanup ${name}. Please try again.`);
    } finally {
      setCleaningUp(false);
      setCleanupType(null);
    }
  };

  const handleClearCache = async () => {
    const confirmMessage = 'This will clear all application cache (config, routes, views, and application cache).\n\nThis action cannot be undone.\n\nDo you want to proceed?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setClearingCache(true);
      await api.get("/sanctum/csrf-cookie", { withCredentials: true });
      const result = await clearCache();
      alert(result.message || 'Cache cleared successfully!');
      
      // Optionally refresh system health data
      const system = await getSystemHealth();
      setSystemHealth(system);
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert(error.response?.data?.error || 'Failed to clear cache. Please try again.');
    } finally {
      setClearingCache(false);
    }
  };

  const handleBackupDatabase = async () => {
    const confirmMessage = 'This will create a backup of the entire database.\n\nThe backup file will be downloaded automatically.\n\nDo you want to proceed?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setBackingUp(true);
      await api.get("/sanctum/csrf-cookie", { withCredentials: true });
      await backupDatabase();
      alert('Database backup completed successfully! The backup file has been downloaded.');
    } catch (error) {
      console.error('Error backing up database:', error);
      alert(error.response?.data?.error || 'Failed to backup database. Please try again.');
    } finally {
      setBackingUp(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      await api.get("/sanctum/csrf-cookie", { withCredentials: true });
      const data = await exportAnalytics();

      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('System Analytics Report', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

      let yPos = 40;

      // System Health
      doc.setFontSize(14);
      doc.text('System Health', 14, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.text(`PHP Version: ${data.system_health.php_version}`, 14, yPos);
      yPos += 7;
      doc.text(`Laravel Version: ${data.system_health.laravel_version}`, 14, yPos);
      yPos += 7;
      doc.text(`Uptime: ${data.system_health.uptime}`, 14, yPos);
      yPos += 15;

      // Database Health
      doc.setFontSize(14);
      doc.text('Database Health', 14, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.text(`Database: ${data.database_health.database_name}`, 14, yPos);
      yPos += 7;
      doc.text(`Size: ${data.database_health.size_mb} MB`, 14, yPos);
      yPos += 7;
      doc.text(`Tables: ${data.database_health.table_count}`, 14, yPos);
      yPos += 15;

      // Storage Health
      doc.setFontSize(14);
      doc.text('Storage Health', 14, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.text(`Total: ${data.storage_health.total_gb} GB`, 14, yPos);
      yPos += 7;
      doc.text(`Used: ${data.storage_health.used_gb} GB (${data.storage_health.percent_used}%)`, 14, yPos);
      yPos += 7;
      doc.text(`Free: ${data.storage_health.free_gb} GB`, 14, yPos);
      yPos += 15;

      // Memory Health
      doc.setFontSize(14);
      doc.text('Memory Health', 14, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.text(`Limit: ${data.memory_health.limit}`, 14, yPos);
      yPos += 7;
      doc.text(`Usage: ${data.memory_health.usage_mb} MB (${data.memory_health.percent_used}%)`, 14, yPos);
      yPos += 15;

      // Login Stats
      doc.setFontSize(14);
      doc.text('Login Statistics', 14, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.text(`Today: ${data.login_stats.today}`, 14, yPos);
      yPos += 7;
      doc.text(`This Week: ${data.login_stats.this_week}`, 14, yPos);
      yPos += 7;
      doc.text(`This Month: ${data.login_stats.this_month}`, 14, yPos);
      yPos += 7;
      doc.text(`Total: ${data.login_stats.total}`, 14, yPos);
      yPos += 15;

      // Module Stats
      if (data.module_stats.top_modules && data.module_stats.top_modules.length > 0) {
        doc.setFontSize(14);
        doc.text('Top Modules', 14, yPos);
        yPos += 10;
        
        const moduleData = data.module_stats.top_modules.map(m => [m.module_name, m.count]);
        autoTable(doc, {
          startY: yPos,
          head: [['Module', 'Accesses']],
          body: moduleData,
          theme: 'striped',
        });
        // Get final Y position after table
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : yPos + (moduleData.length * 7) + 20;
        yPos = finalY + 10;
      }

      // HTTP Request Stats
      doc.setFontSize(14);
      doc.text('HTTP Request Statistics', 14, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.text(`Today: ${data.http_request_stats.today}`, 14, yPos);
      yPos += 7;
      doc.text(`This Week: ${data.http_request_stats.this_week}`, 14, yPos);
      yPos += 7;
      doc.text(`This Month: ${data.http_request_stats.this_month}`, 14, yPos);
      yPos += 7;
      doc.text(`Total: ${data.http_request_stats.total}`, 14, yPos);
      yPos += 7;
      doc.text(`Avg Response Time: ${data.http_request_stats.avg_response_time_ms} ms`, 14, yPos);

      doc.save(`system-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'healthy' || status === 'ok') return 'text-green-600 bg-green-100';
    if (status === 'warning') return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getMethodColor = (method) => {
    const colors = {
      'GET': 'text-blue-600 bg-blue-100',
      'POST': 'text-green-600 bg-green-100',
      'PUT': 'text-yellow-600 bg-yellow-100',
      'DELETE': 'text-red-600 bg-red-100',
      'PATCH': 'text-purple-600 bg-purple-100',
    };
    return colors[method] || 'text-gray-600 bg-gray-100';
  };

  const getStatusCodeColor = (code) => {
    if (code >= 200 && code < 300) return 'text-green-600';
    if (code >= 300 && code < 400) return 'text-blue-600';
    if (code >= 400 && code < 500) return 'text-yellow-600';
    if (code >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading && !systemHealth) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <LoadingSpinner size="lg" inline={false} />
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen p-2 sm:p-4 bg-gray-100 font-sans">
      
      {/* Back Button */}
      <BackButton to="/dashboard" label="Back to Dashboard" />
      
      {/* Header */}
      <header className="bg-blue-700 text-white p-3 sm:p-4 font-bold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 rounded-t-lg mb-5">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <span className="text-sm sm:text-base">SYSTEM ADMINISTRATION DASHBOARD</span>
          <span className="text-xs sm:text-sm font-normal opacity-80">{currentDate}</span>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition duration-300 text-xs sm:text-sm"
        >
          📄 Export Analytics PDF
        </button>
      </header>

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-300 bg-white rounded-lg shadow-md">
        <div className="flex flex-wrap gap-2 sm:gap-4 px-4">
          {['health', 'activity-logs', 'login-logs', 'http-requests'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 font-medium text-sm sm:text-base transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300'
              }`}
            >
              {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Health Tab */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* System Health */}
          <ChartCard title="SYSTEM HEALTH">
            {systemHealth ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(systemHealth.status)}`}>
                    {systemHealth.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">PHP Version:</span>
                  <span className="font-semibold text-gray-800">{systemHealth.php_version}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Laravel Version:</span>
                  <span className="font-semibold text-gray-800">{systemHealth.laravel_version}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Server:</span>
                  <span className="font-semibold text-gray-800 text-xs">{systemHealth.server_software}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Uptime:</span>
                  <span className="font-semibold text-gray-800">{systemHealth.uptime}</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={handleClearCache}
                    disabled={clearingCache}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded text-xs transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {clearingCache ? (
                      <>
                        <LoadingSpinner size="sm" inline={true} color="white" />
                        Clearing Cache...
                      </>
                    ) : (
                      <>
                        🗑️ Clear Cache
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner size="md" inline={false} />
              </div>
            )}
          </ChartCard>

          {/* Database Health */}
          <ChartCard title="DATABASE HEALTH">
            {databaseHealth ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(databaseHealth.status)}`}>
                    {databaseHealth.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Database:</span>
                  <span className="font-semibold text-gray-800 text-xs">{databaseHealth.database_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Size:</span>
                  <span className="font-semibold text-gray-800">{databaseHealth.size_mb} MB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tables:</span>
                  <span className="font-semibold text-gray-800">{databaseHealth.table_count}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Response Time:</span>
                  <span className="font-semibold text-gray-800">{databaseHealth.response_time_ms} ms</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={handleBackupDatabase}
                    disabled={backingUp}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded text-xs transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {backingUp ? (
                      <>
                        <LoadingSpinner size="sm" inline={true} color="white" />
                        Creating Backup...
                      </>
                    ) : (
                      <>
                        💾 Backup Database
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner size="md" inline={false} />
              </div>
            )}
          </ChartCard>

          {/* Storage Health */}
          <ChartCard title="STORAGE HEALTH">
            {storageHealth ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(storageHealth.status)}`}>
                    {storageHealth.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total:</span>
                  <span className="font-semibold text-gray-800">{storageHealth.total_gb} GB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Used:</span>
                  <span className="font-semibold text-gray-800">{storageHealth.used_gb} GB ({storageHealth.percent_used}%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Free:</span>
                  <span className="font-semibold text-gray-800">{storageHealth.free_gb} GB</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">Usage</span>
                    <span className="text-xs font-semibold text-gray-700">{storageHealth.percent_used}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        storageHealth.percent_used > 90 ? 'bg-red-600' :
                        storageHealth.percent_used > 70 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${storageHealth.percent_used}%` }}
                    ></div>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={() => openCleanupModal('storage')}
                    disabled={cleaningUp && cleanupType === 'storage'}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded text-xs transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {cleaningUp && cleanupType === 'storage' ? (
                      <>
                        <LoadingSpinner size="sm" inline={true} color="white" />
                        Cleaning...
                      </>
                    ) : (
                      <>
                        🗑️ Cleanup Storage
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner size="md" inline={false} />
              </div>
            )}
          </ChartCard>

          {/* Memory Health */}
          <ChartCard title="MEMORY HEALTH">
            {memoryHealth ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(memoryHealth.status)}`}>
                    {memoryHealth.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Limit:</span>
                  <span className="font-semibold text-gray-800">{memoryHealth.limit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Usage:</span>
                  <span className="font-semibold text-gray-800">{memoryHealth.usage_mb} MB ({memoryHealth.percent_used}%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Peak:</span>
                  <span className="font-semibold text-gray-800">{memoryHealth.peak_mb} MB</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">Usage</span>
                    <span className="text-xs font-semibold text-gray-700">{memoryHealth.percent_used}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        memoryHealth.percent_used > 90 ? 'bg-red-600' :
                        memoryHealth.percent_used > 70 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${memoryHealth.percent_used}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner size="md" inline={false} />
              </div>
            )}
          </ChartCard>
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'activity-logs' && (
        <ChartCard title="ACTIVITY LOGS (MODULE ACCESS)">
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => openCleanupModal('activity-logs')}
              disabled={cleaningUp && cleanupType === 'activity-logs'}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded text-xs transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {cleaningUp && cleanupType === 'activity-logs' ? (
                <>
                  <LoadingSpinner size="sm" inline={true} color="white" />
                  Cleaning...
                </>
              ) : (
                <>
                  🗑️ Cleanup Old Logs
                </>
              )}
            </button>
          </div>
          {activityLogs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <p>No activity logs available</p>
            </div>
          ) : (
            <div 
              ref={activityLogsRef}
              className="overflow-y-auto overflow-x-auto"
              style={{ maxHeight: '600px', minHeight: '400px' }}
            >
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Module</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Path</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.user?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{log.module_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.module_path}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ip_address}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.accessed_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loadingMoreActivityLogs && (
                <div className="flex justify-center items-center py-4">
                  <LoadingSpinner size="sm" inline={true} text="Loading more..." />
                </div>
              )}
              {!hasMoreActivityLogs && activityLogs.length > 0 && (
                <div className="flex justify-center items-center py-4 text-sm text-gray-500">
                  No more logs to load
                </div>
              )}
            </div>
          )}
        </ChartCard>
      )}

      {/* Login Logs Tab */}
      {activeTab === 'login-logs' && (
        <ChartCard title="LOGIN LOGS">
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => openCleanupModal('login-logs')}
              disabled={cleaningUp && cleanupType === 'login-logs'}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded text-xs transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {cleaningUp && cleanupType === 'login-logs' ? (
                <>
                  <LoadingSpinner size="sm" inline={true} color="white" />
                  Cleaning...
                </>
              ) : (
                <>
                  🗑️ Cleanup Old Logs
                </>
              )}
            </button>
          </div>
          {loginLogs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <p>No login logs available</p>
            </div>
          ) : (
            <div 
              ref={loginLogsRef}
              className="overflow-y-auto overflow-x-auto"
              style={{ maxHeight: '600px', minHeight: '400px' }}
            >
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">User Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Login Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loginLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.user?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ip_address}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={log.user_agent}>{log.user_agent}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.login_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loadingMoreLoginLogs && (
                <div className="flex justify-center items-center py-4">
                  <LoadingSpinner size="sm" inline={true} text="Loading more..." />
                </div>
              )}
              {!hasMoreLoginLogs && loginLogs.length > 0 && (
                <div className="flex justify-center items-center py-4 text-sm text-gray-500">
                  No more logs to load
                </div>
              )}
            </div>
          )}
        </ChartCard>
      )}

      {/* HTTP Request Logs Tab */}
      {activeTab === 'http-requests' && (
        <ChartCard title="HTTP REQUEST LOGS">
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => openCleanupModal('http-request-logs')}
              disabled={cleaningUp && cleanupType === 'http-request-logs'}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded text-xs transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {cleaningUp && cleanupType === 'http-request-logs' ? (
                <>
                  <LoadingSpinner size="sm" inline={true} color="white" />
                  Cleaning...
                </>
              ) : (
                <>
                  🗑️ Cleanup Old Logs
                </>
              )}
            </button>
          </div>
          {httpRequestLogs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <p>No HTTP request logs available</p>
            </div>
          ) : (
            <div
              ref={terminalRef}
              className="bg-black text-green-400 font-mono text-xs sm:text-sm p-4 rounded-lg overflow-y-auto shadow-inner"
              style={{ maxHeight: '600px', minHeight: '400px' }}
            >
              {httpRequestLogs.map((log) => (
                <div key={log.id} className="mb-2 break-words">
                  <span className="text-gray-500">
                    [{new Date(log.requested_at).toLocaleString()}]
                  </span>
                  {' '}
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getMethodColor(log.method)}`}>
                    {log.method}
                  </span>
                  {' '}
                  <span className={`font-bold ${getStatusCodeColor(log.status_code)}`}>
                    {log.status_code}
                  </span>
                  {' '}
                  <span className="text-blue-400 break-all">{log.url}</span>
                  {' '}
                  {log.user && (
                    <span className="text-yellow-400">[{log.user.name}]</span>
                  )}
                  {' '}
                  {log.response_time && (
                    <span className="text-gray-400">({log.response_time}ms)</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      )}

      {/* Cleanup Modal */}
      {showCleanupModal && cleanupConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Cleanup {cleanupConfig.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {cleanupConfig.description}
            </p>
            {cleanupConfig.type !== 'storage' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retention Period (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value) || cleanupConfig.defaultDays)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Logs older than {retentionDays} days will be deleted. Default: {cleanupConfig.defaultDays} days
                </p>
              </div>
            )}
            {cleanupConfig.type === 'storage' && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  This will clear:
                </p>
                <ul className="list-disc list-inside text-xs text-yellow-700 mt-2">
                  <li>Laravel cache files</li>
                  <li>Old log files (older than {retentionDays} days)</li>
                  <li>Temporary files</li>
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCleanupModal(false);
                  setCleanupConfig(null);
                }}
                disabled={cleaningUp}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCleanup}
                disabled={cleaningUp}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2"
              >
                {cleaningUp ? (
                  <>
                    <LoadingSpinner size="sm" inline={true} color="white" />
                    Processing...
                  </>
                ) : (
                  'Confirm Cleanup'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

