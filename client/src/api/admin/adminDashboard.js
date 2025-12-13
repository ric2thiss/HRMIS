import api from '../axios';

/**
 * Get system health information
 */
export const getSystemHealth = async () => {
  const response = await api.get('/api/admin/system-health', { withCredentials: true });
  return response.data;
};

/**
 * Get database health information
 */
export const getDatabaseHealth = async () => {
  const response = await api.get('/api/admin/database-health', { withCredentials: true });
  return response.data;
};

/**
 * Get storage health information
 */
export const getStorageHealth = async () => {
  const response = await api.get('/api/admin/storage-health', { withCredentials: true });
  return response.data;
};

/**
 * Get memory health information
 */
export const getMemoryHealth = async () => {
  const response = await api.get('/api/admin/memory-health', { withCredentials: true });
  return response.data;
};

/**
 * Get activity logs (module access logs)
 */
export const getActivityLogs = async (limit = 50, offset = 0) => {
  const response = await api.get('/api/admin/activity-logs', {
    params: { limit, offset },
    withCredentials: true
  });
  return response.data;
};

/**
 * Get login logs
 */
export const getLoginLogs = async (limit = 50, offset = 0) => {
  const response = await api.get('/api/admin/login-logs', {
    params: { limit, offset },
    withCredentials: true
  });
  return response.data;
};

/**
 * Get HTTP request logs
 */
export const getHttpRequestLogs = async (limit = 100, offset = 0) => {
  const response = await api.get('/api/admin/http-request-logs', {
    params: { limit, offset },
    withCredentials: true
  });
  return response.data;
};

/**
 * Export analytics data for PDF generation
 */
export const exportAnalytics = async () => {
  const response = await api.get('/api/admin/export-analytics', { withCredentials: true });
  return response.data;
};

/**
 * Cleanup activity logs older than specified days
 */
export const cleanupActivityLogs = async (days = 90) => {
  const response = await api.post('/api/admin/cleanup/activity-logs', 
    { days },
    { withCredentials: true }
  );
  return response.data;
};

/**
 * Cleanup login logs older than specified days
 */
export const cleanupLoginLogs = async (days = 90) => {
  const response = await api.post('/api/admin/cleanup/login-logs', 
    { days },
    { withCredentials: true }
  );
  return response.data;
};

/**
 * Cleanup HTTP request logs older than specified days
 */
export const cleanupHttpRequestLogs = async (days = 30) => {
  const response = await api.post('/api/admin/cleanup/http-request-logs', 
    { days },
    { withCredentials: true }
  );
  return response.data;
};

/**
 * Cleanup storage (cache, logs, temp files)
 */
export const cleanupStorage = async (options = ['cache', 'logs', 'temp'], days = 7) => {
  const response = await api.post('/api/admin/cleanup/storage', 
    { options, days },
    { withCredentials: true }
  );
  return response.data;
};

/**
 * Clear all application cache
 */
export const clearCache = async () => {
  const response = await api.post('/api/admin/clear-cache', {}, { withCredentials: true });
  return response.data;
};

/**
 * Backup database
 */
export const backupDatabase = async () => {
  try {
    const response = await api.get('/api/admin/backup-database', {
      responseType: 'blob', // Important for file download
      withCredentials: true
    });
    
    // Check if response is actually an error (JSON error message)
    if (response.data.type === 'application/json') {
      const text = await response.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.error || 'Failed to backup database');
    }
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'database_backup.sql';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'Database backup downloaded successfully' };
  } catch (error) {
    // If it's a blob error response, try to parse it
    if (error.response && error.response.data instanceof Blob) {
      const text = await error.response.data.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || 'Failed to backup database');
      } catch (parseError) {
        throw new Error('Failed to backup database. Please check server logs for details.');
      }
    }
    throw error;
  }
};

