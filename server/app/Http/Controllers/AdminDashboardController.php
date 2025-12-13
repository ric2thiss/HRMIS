<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\LoginActivity;
use App\Models\ModuleAccessLog;
use App\Models\HttpRequestLog;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

class AdminDashboardController extends Controller
{
    /**
     * Get system health information
     */
    public function getSystemHealth()
    {
        try {
            $uptime = $this->getSystemUptime();
            $phpVersion = PHP_VERSION;
            $laravelVersion = app()->version();
            $serverSoftware = $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown';
            
            return response()->json([
                'status' => 'healthy',
                'uptime' => $uptime,
                'php_version' => $phpVersion,
                'laravel_version' => $laravelVersion,
                'server_software' => $serverSoftware,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Clear all application cache
     */
    public function clearCache()
    {
        try {
            $user = auth()->user();
            if (!$user->hasRole('admin')) {
                return response()->json(['error' => 'Unauthorized. Only admins can clear cache.'], 403);
            }

            $cleared = [];

            // Clear application cache
            Artisan::call('cache:clear');
            $cleared[] = 'Application cache';

            // Clear configuration cache
            if (file_exists(base_path('bootstrap/cache/config.php'))) {
                Artisan::call('config:clear');
                $cleared[] = 'Configuration cache';
            }

            // Clear route cache
            if (file_exists(base_path('bootstrap/cache/routes-v7.php'))) {
                Artisan::call('route:clear');
                $cleared[] = 'Route cache';
            }

            // Clear view cache
            Artisan::call('view:clear');
            $cleared[] = 'View cache';

            // Clear compiled classes
            if (file_exists(base_path('bootstrap/cache/services.php'))) {
                Artisan::call('clear-compiled');
                $cleared[] = 'Compiled classes';
            }

            // Clear all cache stores
            Cache::flush();

            // Log the action
            \Log::info('Cache cleared', [
                'admin_id' => $user->id,
                'admin_name' => $user->name,
                'cleared_items' => $cleared,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'All cache cleared successfully.',
                'cleared' => $cleared,
            ]);
        } catch (\Exception $e) {
            \Log::error('Cache clear error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'admin_id' => auth()->id(),
            ]);
            return response()->json([
                'error' => 'Failed to clear cache: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get database health information
     */
    public function getDatabaseHealth()
    {
        try {
            $startTime = microtime(true);
            DB::select('SELECT 1');
            $responseTime = round((microtime(true) - $startTime) * 1000);
            
            $connectionName = DB::connection()->getName();
            $databaseName = DB::connection()->getDatabaseName();
            
            // Get table count
            $tableCount = count(DB::select('SHOW TABLES'));
            
            // Get total database size (MySQL specific)
            $dbSize = DB::select("
                SELECT 
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
                FROM information_schema.tables 
                WHERE table_schema = ?
            ", [$databaseName]);
            
            $sizeInMB = $dbSize[0]->size_mb ?? 0;
            
            return response()->json([
                'status' => 'healthy',
                'connection' => $connectionName,
                'database_name' => $databaseName,
                'response_time_ms' => $responseTime,
                'table_count' => $tableCount,
                'size_mb' => $sizeInMB,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get storage health information
     */
    public function getStorageHealth()
    {
        try {
            $storagePath = storage_path();
            $publicPath = public_path();
            
            $storageTotal = disk_total_space($storagePath);
            $storageFree = disk_free_space($storagePath);
            $storageUsed = $storageTotal - $storageFree;
            
            $storagePercentUsed = $storageTotal > 0 
                ? round(($storageUsed / $storageTotal) * 100, 2) 
                : 0;
            
            // Get storage directory sizes
            $logsSize = $this->getDirectorySize($storagePath . '/logs');
            $appSize = $this->getDirectorySize($storagePath . '/app');
            
            return response()->json([
                'status' => 'healthy',
                'total_bytes' => $storageTotal,
                'free_bytes' => $storageFree,
                'used_bytes' => $storageUsed,
                'percent_used' => $storagePercentUsed,
                'total_gb' => round($storageTotal / 1024 / 1024 / 1024, 2),
                'free_gb' => round($storageFree / 1024 / 1024 / 1024, 2),
                'used_gb' => round($storageUsed / 1024 / 1024 / 1024, 2),
                'logs_size_mb' => round($logsSize / 1024 / 1024, 2),
                'app_size_mb' => round($appSize / 1024 / 1024, 2),
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get memory usage information
     */
    public function getMemoryHealth()
    {
        try {
            $memoryLimit = ini_get('memory_limit');
            $memoryUsage = memory_get_usage(true);
            $memoryPeak = memory_get_peak_usage(true);
            
            // Convert memory limit to bytes
            $memoryLimitBytes = $this->convertToBytes($memoryLimit);
            
            $memoryPercentUsed = $memoryLimitBytes > 0 
                ? round(($memoryUsage / $memoryLimitBytes) * 100, 2) 
                : 0;
            
            return response()->json([
                'status' => 'healthy',
                'limit' => $memoryLimit,
                'limit_bytes' => $memoryLimitBytes,
                'usage_bytes' => $memoryUsage,
                'usage_mb' => round($memoryUsage / 1024 / 1024, 2),
                'peak_bytes' => $memoryPeak,
                'peak_mb' => round($memoryPeak / 1024 / 1024, 2),
                'percent_used' => $memoryPercentUsed,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get activity logs (module access logs)
     */
    public function getActivityLogs(Request $request)
    {
        try {
            $limit = $request->get('limit', 50);
            $offset = $request->get('offset', 0);
            
            $logs = ModuleAccessLog::with('user')
                ->orderBy('accessed_at', 'desc')
                ->limit($limit)
                ->offset($offset)
                ->get();
            
            $total = ModuleAccessLog::count();
            
            return response()->json([
                'logs' => $logs,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get login logs
     */
    public function getLoginLogs(Request $request)
    {
        try {
            $limit = $request->get('limit', 50);
            $offset = $request->get('offset', 0);
            
            $logs = LoginActivity::with('user')
                ->orderBy('login_at', 'desc')
                ->limit($limit)
                ->offset($offset)
                ->get();
            
            $total = LoginActivity::count();
            
            return response()->json([
                'logs' => $logs,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get HTTP request logs (terminal style)
     */
    public function getHttpRequestLogs(Request $request)
    {
        try {
            $limit = $request->get('limit', 100);
            $offset = $request->get('offset', 0);
            
            $logs = HttpRequestLog::with('user')
                ->orderBy('requested_at', 'desc')
                ->limit($limit)
                ->offset($offset)
                ->get();
            
            $total = HttpRequestLog::count();
            
            return response()->json([
                'logs' => $logs,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export analytics data as PDF
     */
    public function exportAnalytics(Request $request)
    {
        try {
            // This will be handled by the frontend using a PDF library
            // We'll return the data in a format suitable for PDF generation
            $data = [
                'system_health' => $this->getSystemHealthData(),
                'database_health' => $this->getDatabaseHealthData(),
                'storage_health' => $this->getStorageHealthData(),
                'memory_health' => $this->getMemoryHealthData(),
                'login_stats' => $this->getLoginStats(),
                'module_stats' => $this->getModuleStats(),
                'http_request_stats' => $this->getHttpRequestStats(),
                'generated_at' => now()->toIso8601String(),
            ];
            
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // Helper methods
    
    private function getSystemUptime()
    {
        // For Windows
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            return 'N/A (Windows)';
        }
        
        // For Linux/Unix
        $uptime = shell_exec('uptime -p 2>/dev/null');
        return $uptime ? trim($uptime) : 'N/A';
    }

    private function getDirectorySize($directory)
    {
        $size = 0;
        if (is_dir($directory)) {
            foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($directory)) as $file) {
                $size += $file->getSize();
            }
        }
        return $size;
    }

    private function convertToBytes($value)
    {
        $value = trim($value);
        $last = strtolower($value[strlen($value) - 1]);
        $value = (int) $value;
        
        switch ($last) {
            case 'g':
                $value *= 1024;
            case 'm':
                $value *= 1024;
            case 'k':
                $value *= 1024;
        }
        
        return $value;
    }

    private function getSystemHealthData()
    {
        $uptime = $this->getSystemUptime();
        return [
            'uptime' => $uptime,
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
        ];
    }

    private function getDatabaseHealthData()
    {
        $dbSize = DB::select("
            SELECT 
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
            FROM information_schema.tables 
            WHERE table_schema = ?
        ", [DB::connection()->getDatabaseName()]);
        
        return [
            'database_name' => DB::connection()->getDatabaseName(),
            'size_mb' => $dbSize[0]->size_mb ?? 0,
            'table_count' => count(DB::select('SHOW TABLES')),
        ];
    }

    private function getStorageHealthData()
    {
        $storagePath = storage_path();
        $storageTotal = disk_total_space($storagePath);
        $storageFree = disk_free_space($storagePath);
        $storageUsed = $storageTotal - $storageFree;
        
        return [
            'total_gb' => round($storageTotal / 1024 / 1024 / 1024, 2),
            'free_gb' => round($storageFree / 1024 / 1024 / 1024, 2),
            'used_gb' => round($storageUsed / 1024 / 1024 / 1024, 2),
            'percent_used' => $storageTotal > 0 ? round(($storageUsed / $storageTotal) * 100, 2) : 0,
        ];
    }

    private function getMemoryHealthData()
    {
        $memoryLimit = ini_get('memory_limit');
        $memoryUsage = memory_get_usage(true);
        $memoryLimitBytes = $this->convertToBytes($memoryLimit);
        
        return [
            'limit' => $memoryLimit,
            'usage_mb' => round($memoryUsage / 1024 / 1024, 2),
            'percent_used' => $memoryLimitBytes > 0 ? round(($memoryUsage / $memoryLimitBytes) * 100, 2) : 0,
        ];
    }

    private function getLoginStats()
    {
        $today = LoginActivity::whereDate('login_at', today())->count();
        $thisWeek = LoginActivity::whereBetween('login_at', [now()->startOfWeek(), now()->endOfWeek()])->count();
        $thisMonth = LoginActivity::whereMonth('login_at', now()->month)
            ->whereYear('login_at', now()->year)
            ->count();
        $total = LoginActivity::count();
        
        return [
            'today' => $today,
            'this_week' => $thisWeek,
            'this_month' => $thisMonth,
            'total' => $total,
        ];
    }

    private function getModuleStats()
    {
        $topModules = ModuleAccessLog::select('module_name', DB::raw('count(*) as count'))
            ->groupBy('module_name')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get();
        
        return [
            'top_modules' => $topModules,
            'total_accesses' => ModuleAccessLog::count(),
        ];
    }

    private function getHttpRequestStats()
    {
        $today = HttpRequestLog::whereDate('requested_at', today())->count();
        $thisWeek = HttpRequestLog::whereBetween('requested_at', [now()->startOfWeek(), now()->endOfWeek()])->count();
        $thisMonth = HttpRequestLog::whereMonth('requested_at', now()->month)
            ->whereYear('requested_at', now()->year)
            ->count();
        $total = HttpRequestLog::count();
        
        $avgResponseTime = HttpRequestLog::whereDate('requested_at', today())
            ->avg('response_time');
        
        return [
            'today' => $today,
            'this_week' => $thisWeek,
            'this_month' => $thisMonth,
            'total' => $total,
            'avg_response_time_ms' => round($avgResponseTime ?? 0, 2),
        ];
    }

    /**
     * Cleanup activity logs (module access logs) older than specified days
     */
    public function cleanupActivityLogs(Request $request)
    {
        try {
            $user = auth()->user();
            if (!$user->hasRole('admin')) {
                return response()->json(['error' => 'Unauthorized. Only admins can perform cleanup operations.'], 403);
            }

            // Get days from request body (POST request)
            $days = $request->input('days', 90); // Default: keep last 90 days
            
            // Validate days
            $days = (int) $days;
            if ($days < 1) {
                $days = 90; // Default to 90 if invalid
            }

            // Calculate cutoff date - keep logs from the last N days
            // Use start of day to ensure we get all logs from that day
            $cutoffDate = now()->subDays($days)->startOfDay();

            // Count logs to be deleted (older than cutoff date)
            // Handle NULL values by excluding them
            $countToDelete = ModuleAccessLog::whereNotNull('accessed_at')
                ->where('accessed_at', '<', $cutoffDate)
                ->count();

            // Log before deletion for debugging
            \Log::info('Activity logs cleanup - before deletion', [
                'admin_id' => $user->id,
                'days_retained' => $days,
                'cutoff_date' => $cutoffDate->toDateTimeString(),
                'count_to_delete' => $countToDelete,
                'total_logs' => ModuleAccessLog::count(),
                'request_days' => $request->input('days'),
            ]);

            // Delete logs older than specified days
            // Use DB transaction to ensure deletion is committed
            $deleted = DB::transaction(function () use ($cutoffDate, $countToDelete) {
                // Try Eloquent first
                $deleted = ModuleAccessLog::whereNotNull('accessed_at')
                    ->where('accessed_at', '<', $cutoffDate)
                    ->delete();
                
                // If Eloquent delete returns 0 but we have records, try DB direct
                if ($deleted == 0 && $countToDelete > 0) {
                    \Log::warning('Eloquent delete returned 0, trying DB direct deletion', [
                        'count_to_delete' => $countToDelete,
                    ]);
                    $deleted = DB::table('module_access_logs')
                        ->whereNotNull('accessed_at')
                        ->where('accessed_at', '<', $cutoffDate)
                        ->delete();
                }
                
                return $deleted;
            });

            // Verify deletion
            $remainingCount = ModuleAccessLog::count();
            $logsAfterCutoff = ModuleAccessLog::where('accessed_at', '>=', $cutoffDate)->count();

            // Log the cleanup action
            \Log::info('Activity logs cleanup - after deletion', [
                'admin_id' => $user->id,
                'admin_name' => $user->name,
                'days_retained' => $days,
                'deleted_count' => $deleted,
                'cutoff_date' => $cutoffDate->toDateTimeString(),
                'remaining_count' => $remainingCount,
                'logs_after_cutoff' => $logsAfterCutoff,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Successfully deleted {$deleted} activity log(s) older than {$days} days.",
                'deleted_count' => $deleted,
                'days_retained' => $days,
                'cutoff_date' => $cutoffDate->toDateTimeString(),
                'remaining_count' => $remainingCount,
            ]);
        } catch (\Exception $e) {
            \Log::error('Activity logs cleanup error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'admin_id' => auth()->id(),
            ]);
            return response()->json([
                'error' => 'Failed to cleanup activity logs: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cleanup login logs older than specified days
     */
    public function cleanupLoginLogs(Request $request)
    {
        try {
            $user = auth()->user();
            if (!$user->hasRole('admin')) {
                return response()->json(['error' => 'Unauthorized. Only admins can perform cleanup operations.'], 403);
            }

            // Get days from request body (POST request)
            $days = $request->input('days', 90); // Default: keep last 90 days
            
            // Validate days
            $days = (int) $days;
            if ($days < 1) {
                $days = 90; // Default to 90 if invalid
            }

            // Calculate cutoff date - keep logs from the last N days
            // Use start of day to ensure we get all logs from that day
            $cutoffDate = now()->subDays($days)->startOfDay();

            // Count logs to be deleted (older than cutoff date)
            // Handle NULL values by excluding them
            $countToDelete = LoginActivity::whereNotNull('login_at')
                ->where('login_at', '<', $cutoffDate)
                ->count();

            // Log before deletion for debugging
            \Log::info('Login logs cleanup - before deletion', [
                'admin_id' => $user->id,
                'days_retained' => $days,
                'cutoff_date' => $cutoffDate->toDateTimeString(),
                'count_to_delete' => $countToDelete,
                'total_logs' => LoginActivity::count(),
                'request_days' => $request->input('days'),
            ]);

            // Delete logs older than specified days
            // Use DB transaction to ensure deletion is committed
            $deleted = DB::transaction(function () use ($cutoffDate, $countToDelete) {
                // Try Eloquent first
                $deleted = LoginActivity::whereNotNull('login_at')
                    ->where('login_at', '<', $cutoffDate)
                    ->delete();
                
                // If Eloquent delete returns 0 but we have records, try DB direct
                if ($deleted == 0 && $countToDelete > 0) {
                    \Log::warning('Eloquent delete returned 0, trying DB direct deletion', [
                        'count_to_delete' => $countToDelete,
                    ]);
                    $deleted = DB::table('login_activities')
                        ->whereNotNull('login_at')
                        ->where('login_at', '<', $cutoffDate)
                        ->delete();
                }
                
                return $deleted;
            });

            // Verify deletion
            $remainingCount = LoginActivity::count();
            $logsAfterCutoff = LoginActivity::where('login_at', '>=', $cutoffDate)->count();

            \Log::info('Login logs cleanup - after deletion', [
                'admin_id' => $user->id,
                'admin_name' => $user->name,
                'days_retained' => $days,
                'deleted_count' => $deleted,
                'cutoff_date' => $cutoffDate->toDateTimeString(),
                'remaining_count' => $remainingCount,
                'logs_after_cutoff' => $logsAfterCutoff,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Successfully deleted {$deleted} login log(s) older than {$days} days.",
                'deleted_count' => $deleted,
                'days_retained' => $days,
                'cutoff_date' => $cutoffDate->toDateTimeString(),
                'remaining_count' => $remainingCount,
            ]);
        } catch (\Exception $e) {
            \Log::error('Login logs cleanup error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'admin_id' => auth()->id(),
            ]);
            return response()->json([
                'error' => 'Failed to cleanup login logs: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cleanup HTTP request logs older than specified days
     */
    public function cleanupHttpRequestLogs(Request $request)
    {
        try {
            $user = auth()->user();
            if (!$user->hasRole('admin')) {
                return response()->json(['error' => 'Unauthorized. Only admins can perform cleanup operations.'], 403);
            }

            $days = $request->get('days', 30); // Default: keep last 30 days (HTTP logs grow faster)
            $cutoffDate = now()->subDays($days);

            // Count logs to be deleted
            $countToDelete = HttpRequestLog::where('requested_at', '<', $cutoffDate)->count();

            // Delete logs older than specified days
            $deleted = HttpRequestLog::where('requested_at', '<', $cutoffDate)->delete();

            \Log::info('HTTP request logs cleanup', [
                'admin_id' => $user->id,
                'admin_name' => $user->name,
                'days_retained' => $days,
                'deleted_count' => $deleted,
                'cutoff_date' => $cutoffDate->toIso8601String(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Successfully deleted {$deleted} HTTP request log(s) older than {$days} days.",
                'deleted_count' => $deleted,
                'days_retained' => $days,
            ]);
        } catch (\Exception $e) {
            \Log::error('HTTP request logs cleanup error', [
                'error' => $e->getMessage(),
                'admin_id' => auth()->id(),
            ]);
            return response()->json([
                'error' => 'Failed to cleanup HTTP request logs: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cleanup storage (clear cache, logs, temp files)
     */
    public function cleanupStorage(Request $request)
    {
        try {
            $user = auth()->user();
            if (!$user->hasRole('admin')) {
                return response()->json(['error' => 'Unauthorized. Only admins can perform cleanup operations.'], 403);
            }

            $cleanupOptions = $request->get('options', ['cache', 'logs', 'temp']); // Default: all
            $days = $request->get('days', 7); // For log files, keep last 7 days
            $freedSpace = 0;
            $actions = [];

            // Clear Laravel cache
            if (in_array('cache', $cleanupOptions)) {
                \Artisan::call('cache:clear');
                \Artisan::call('config:clear');
                \Artisan::call('route:clear');
                \Artisan::call('view:clear');
                $actions[] = 'Cache cleared';
            }

            // Clear old log files
            if (in_array('logs', $cleanupOptions)) {
                $logsPath = storage_path('logs');
                $cutoffDate = now()->subDays($days);
                $deletedLogFiles = 0;

                if (is_dir($logsPath)) {
                    $files = glob($logsPath . '/*.log');
                    foreach ($files as $file) {
                        if (is_file($file) && filemtime($file) < $cutoffDate->timestamp) {
                            $fileSize = filesize($file);
                            if (unlink($file)) {
                                $freedSpace += $fileSize;
                                $deletedLogFiles++;
                            }
                        }
                    }
                }
                $actions[] = "Deleted {$deletedLogFiles} log file(s) older than {$days} days";
            }

            // Clear temporary files
            if (in_array('temp', $cleanupOptions)) {
                $tempPath = storage_path('app/temp');
                if (is_dir($tempPath)) {
                    $this->deleteDirectoryContents($tempPath);
                    $actions[] = 'Temporary files cleared';
                }
            }

            \Log::info('Storage cleanup', [
                'admin_id' => $user->id,
                'admin_name' => $user->name,
                'options' => $cleanupOptions,
                'freed_space_mb' => round($freedSpace / 1024 / 1024, 2),
                'actions' => $actions,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Storage cleanup completed successfully.',
                'freed_space_mb' => round($freedSpace / 1024 / 1024, 2),
                'actions' => $actions,
            ]);
        } catch (\Exception $e) {
            \Log::error('Storage cleanup error', [
                'error' => $e->getMessage(),
                'admin_id' => auth()->id(),
            ]);
            return response()->json([
                'error' => 'Failed to cleanup storage: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Backup database
     */
    public function backupDatabase()
    {
        try {
            $user = auth()->user();
            if (!$user->hasRole('admin')) {
                return response()->json(['error' => 'Unauthorized. Only admins can backup the database.'], 403);
            }

            $connection = Config::get('database.default');
            $config = Config::get("database.connections.{$connection}");
            
            // Create backups directory if it doesn't exist
            $backupDir = storage_path('app/backups');
            if (!is_dir($backupDir)) {
                if (!mkdir($backupDir, 0755, true)) {
                    throw new \Exception('Failed to create backups directory. Please check permissions.');
                }
            }

            $timestamp = now()->format('Y-m-d_His');
            $filename = "backup_{$connection}_{$timestamp}.sql";
            $filepath = $backupDir . DIRECTORY_SEPARATOR . $filename;

            // Handle different database types
            if ($connection === 'mysql' || $connection === 'mariadb') {
                $this->backupMySQL($config, $filepath);
            } elseif ($connection === 'sqlite') {
                $this->backupSQLite($config, $filepath);
            } elseif ($connection === 'pgsql') {
                $this->backupPostgreSQL($config, $filepath);
            } else {
                throw new \Exception("Database backup not supported for connection type: {$connection}");
            }

            // Verify backup file was created
            if (!file_exists($filepath)) {
                throw new \Exception('Backup file was not created.');
            }

            $fileSize = filesize($filepath);
            if ($fileSize === 0) {
                unlink($filepath);
                throw new \Exception('Backup file is empty. Please check database connection and permissions.');
            }

            $fileSizeMB = round($fileSize / 1024 / 1024, 2);

            // Log the backup action
            \Log::info('Database backup created', [
                'admin_id' => $user->id,
                'admin_name' => $user->name,
                'filename' => $filename,
                'file_size_mb' => $fileSizeMB,
                'connection' => $connection,
            ]);

            // Return file for download
            return response()->download($filepath, $filename, [
                'Content-Type' => 'application/sql',
            ])->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            $errorMessage = $e->getMessage();
            \Log::error('Database backup error', [
                'error' => $errorMessage,
                'trace' => $e->getTraceAsString(),
                'admin_id' => auth()->id(),
                'connection' => Config::get('database.default'),
            ]);
            
            // Provide more user-friendly error message
            $userMessage = $errorMessage;
            if (strpos($errorMessage, 'mysqldump not found') !== false) {
                $userMessage = 'mysqldump not found. The system will attempt an alternative backup method. If this fails, please ensure MySQL/MariaDB is installed.';
            }
            
            return response()->json([
                'error' => 'Failed to backup database: ' . $userMessage,
                'details' => config('app.debug') ? $errorMessage : null,
            ], 500);
        }
    }

    /**
     * Backup MySQL/MariaDB database
     */
    private function backupMySQL($config, $filepath)
    {
        $host = $config['host'] ?? '127.0.0.1';
        $port = $config['port'] ?? 3306;
        $database = $config['database'];
        $username = $config['username'];
        $password = $config['password'];

        // Try to find mysqldump path (common locations)
        $mysqldumpPaths = [
            'mysqldump', // In PATH
            'C:\\xampp\\mysql\\bin\\mysqldump.exe', // XAMPP Windows
            'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
            'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe',
            'C:\\Program Files\\MariaDB\\bin\\mysqldump.exe',
            '/usr/bin/mysqldump', // Linux
            '/usr/local/bin/mysqldump',
        ];

        $mysqldump = null;
        foreach ($mysqldumpPaths as $path) {
            if (PHP_OS_FAMILY === 'Windows') {
                if (file_exists($path)) {
                    $mysqldump = $path;
                    break;
                }
            } else {
                if (is_executable($path)) {
                    $mysqldump = $path;
                    break;
                }
            }
        }

        if (!$mysqldump) {
            // Try to find mysqldump in PATH
            $whichCmd = PHP_OS_FAMILY === 'Windows' ? 'where' : 'which';
            exec("{$whichCmd} mysqldump 2>&1", $whichOutput, $whichReturn);
            if ($whichReturn === 0 && !empty($whichOutput)) {
                $foundPath = trim($whichOutput[0]);
                if (file_exists($foundPath)) {
                    $mysqldump = $foundPath;
                }
            }
        }

        if (!$mysqldump) {
            // Fallback: Try to use Laravel DB to export data
            \Log::warning('mysqldump not found, attempting alternative backup method');
            return $this->backupMySQLAlternative($config, $filepath);
        }

        // Build command - use different approach for Windows vs Linux
        if (PHP_OS_FAMILY === 'Windows') {
            // Windows: Create a temporary batch file to handle the command properly
            $batchFile = storage_path('app/backups/backup_temp_' . uniqid() . '.bat');
            $batchContent = sprintf(
                "@echo off\nset MYSQL_PWD=%s\n%s -h %s -P %s -u %s %s > %s 2>&1\n",
                $password,
                escapeshellarg($mysqldump),
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                escapeshellarg($database),
                escapeshellarg($filepath)
            );
            
            file_put_contents($batchFile, $batchContent);
            
            // Execute batch file
            exec('"' . $batchFile . '"', $output, $returnVar);
            
            // Clean up batch file
            if (file_exists($batchFile)) {
                @unlink($batchFile);
            }
        } else {
            // Linux/Unix: Use environment variable
            $command = sprintf(
                'MYSQL_PWD=%s %s -h %s -P %s -u %s %s > %s 2>&1',
                escapeshellarg($password),
                escapeshellarg($mysqldump),
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                escapeshellarg($database),
                escapeshellarg($filepath)
            );
            
            exec($command, $output, $returnVar);
        }

        if ($returnVar !== 0) {
            $errorMsg = !empty($output) ? implode("\n", $output) : 'Unknown error';
            \Log::error('mysqldump command failed', [
                'command' => $command ?? 'batch file',
                'output' => $output,
                'return_var' => $returnVar,
            ]);
            
            // Try alternative method if mysqldump fails
            if (file_exists($filepath)) {
                @unlink($filepath);
            }
            return $this->backupMySQLAlternative($config, $filepath);
        }

        if (!file_exists($filepath) || filesize($filepath) === 0) {
            $errorMsg = !empty($output) ? implode("\n", $output) : 'Backup file is empty';
            \Log::error('Backup file issue', [
                'filepath' => $filepath,
                'exists' => file_exists($filepath),
                'size' => file_exists($filepath) ? filesize($filepath) : 0,
                'output' => $output,
            ]);
            
            // Try alternative method
            if (file_exists($filepath)) {
                @unlink($filepath);
            }
            return $this->backupMySQLAlternative($config, $filepath);
        }
    }

    /**
     * Alternative MySQL backup method using Laravel DB facade
     * This is a fallback when mysqldump is not available
     */
    private function backupMySQLAlternative($config, $filepath)
    {
        try {
            $database = $config['database'];
            $tables = DB::select('SHOW TABLES');
            $tableKey = 'Tables_in_' . $database;
            
            $sql = "-- MySQL Database Backup\n";
            $sql .= "-- Generated: " . now()->toDateTimeString() . "\n";
            $sql .= "-- Database: {$database}\n\n";
            $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";
            
            foreach ($tables as $table) {
                $tableName = $table->$tableKey;
                
                // Get table structure
                $createTable = DB::select("SHOW CREATE TABLE `{$tableName}`");
                $sql .= "\n-- Table structure for `{$tableName}`\n";
                $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
                $sql .= $createTable[0]->{'Create Table'} . ";\n\n";
                
                // Get table data
                $rows = DB::table($tableName)->get();
                if ($rows->count() > 0) {
                    $sql .= "-- Dumping data for table `{$tableName}`\n";
                    $sql .= "LOCK TABLES `{$tableName}` WRITE;\n";
                    $sql .= "INSERT INTO `{$tableName}` VALUES\n";
                    
                    $values = [];
                    foreach ($rows as $row) {
                        $rowArray = (array) $row;
                        $rowValues = [];
                        foreach ($rowArray as $value) {
                            if ($value === null) {
                                $rowValues[] = 'NULL';
                            } else {
                                $rowValues[] = "'" . addslashes($value) . "'";
                            }
                        }
                        $values[] = '(' . implode(',', $rowValues) . ')';
                    }
                    
                    $sql .= implode(",\n", $values) . ";\n";
                    $sql .= "UNLOCK TABLES;\n\n";
                }
            }
            
            $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
            
            file_put_contents($filepath, $sql);
            
            if (!file_exists($filepath) || filesize($filepath) === 0) {
                throw new \Exception('Failed to create backup file using alternative method.');
            }
            
            \Log::info('Database backup created using alternative method');
        } catch (\Exception $e) {
            throw new \Exception('Alternative backup method failed: ' . $e->getMessage());
        }
    }

    /**
     * Backup SQLite database
     */
    private function backupSQLite($config, $filepath)
    {
        $dbPath = $config['database'];
        
        // Handle relative paths
        if (!file_exists($dbPath) && substr($dbPath, 0, 1) !== '/' && !preg_match('/^[A-Z]:\\\\/', $dbPath)) {
            $dbPath = database_path($dbPath);
        }
        
        if (!file_exists($dbPath)) {
            throw new \Exception('SQLite database file not found at: ' . $dbPath);
        }

        if (!copy($dbPath, $filepath)) {
            throw new \Exception('Failed to copy SQLite database file.');
        }
    }

    /**
     * Backup PostgreSQL database
     */
    private function backupPostgreSQL($config, $filepath)
    {
        $host = $config['host'] ?? '127.0.0.1';
        $port = $config['port'] ?? 5432;
        $database = $config['database'];
        $username = $config['username'];
        $password = $config['password'];

        // Try to find pg_dump
        $pgDumpPaths = [
            'pg_dump',
            'C:\\Program Files\\PostgreSQL\\bin\\pg_dump.exe',
            '/usr/bin/pg_dump',
            '/usr/local/bin/pg_dump',
        ];

        $pgDump = null;
        foreach ($pgDumpPaths as $path) {
            if (is_executable($path) || (PHP_OS_FAMILY === 'Windows' && file_exists($path))) {
                $pgDump = $path;
                break;
            }
        }

        if (!$pgDump) {
            $whichCmd = PHP_OS_FAMILY === 'Windows' ? 'where' : 'which';
            exec("{$whichCmd} pg_dump 2>&1", $whichOutput, $whichReturn);
            if ($whichReturn === 0 && !empty($whichOutput)) {
                $pgDump = trim($whichOutput[0]);
            }
        }

        if (!$pgDump) {
            throw new \Exception('pg_dump not found. Please ensure PostgreSQL is installed.');
        }

        // Set PGPASSWORD environment variable
        putenv("PGPASSWORD={$password}");

        $command = sprintf(
            '%s -h %s -p %s -U %s -d %s -f %s 2>&1',
            escapeshellarg($pgDump),
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($database),
            escapeshellarg($filepath)
        );

        exec($command, $output, $returnVar);
        putenv('PGPASSWORD='); // Clear password

        if ($returnVar !== 0) {
            $errorMsg = !empty($output) ? implode("\n", $output) : 'Unknown error';
            throw new \Exception('Database backup failed: ' . $errorMsg);
        }

        if (!file_exists($filepath) || filesize($filepath) === 0) {
            throw new \Exception('Backup file is empty or was not created.');
        }
    }

    /**
     * Helper method to delete directory contents
     */
    private function deleteDirectoryContents($directory)
    {
        if (!is_dir($directory)) {
            return;
        }

        $files = array_diff(scandir($directory), ['.', '..']);
        foreach ($files as $file) {
            $path = $directory . '/' . $file;
            if (is_dir($path)) {
                $this->deleteDirectoryContents($path);
                rmdir($path);
            } else {
                unlink($path);
            }
        }
    }
}
