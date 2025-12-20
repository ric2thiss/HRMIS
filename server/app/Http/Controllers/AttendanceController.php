<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Models\Attendance;
use App\Models\User;
use App\Models\StandardTimeSetting;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    /**
     * Import attendance from CSV file
     */
    public function import(Request $request)
    {
        // Validate file upload
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $file = $request->file('file');
        $filename = $file->getClientOriginalName();
        $importedBy = auth()->id();
        $importedAt = now();

        try {
            // Read CSV file
            $handle = fopen($file->getRealPath(), 'r');
            
            if (!$handle) {
                return response()->json([
                    'message' => 'Failed to read file'
                ], 400);
            }

            // Read header row
            $headers = fgetcsv($handle);
            
            if (!$headers) {
                fclose($handle);
                return response()->json([
                    'message' => 'File is empty or invalid'
                ], 400);
            }

            // Normalize headers (trim and lowercase for matching)
            $normalizedHeaders = array_map(function($header) {
                return strtolower(trim($header));
            }, $headers);

            // Find column indices
            $acNoIndex = $this->findColumnIndex($normalizedHeaders, ['ac no', 'ac no.', 'account number', 'ac_number']);
            $nameIndex = $this->findColumnIndex($normalizedHeaders, ['name', 'employee name', 'full name']);
            $dateTimeIndex = $this->findColumnIndex($normalizedHeaders, ['date and time', 'datetime', 'date_time', 'timestamp']);
            $stateIndex = $this->findColumnIndex($normalizedHeaders, ['state', 'status', 'type']);

            if ($acNoIndex === false || $nameIndex === false || $dateTimeIndex === false) {
                fclose($handle);
                return response()->json([
                    'message' => 'Required columns not found. Expected: AC No., Name, Date and Time'
                ], 400);
            }

            $imported = 0;
            $skipped = 0;
            $errors = [];

            // Start transaction
            DB::beginTransaction();

            try {
                // Read data rows
                $rowNumber = 1; // Start from 1 (header is row 0)
                while (($row = fgetcsv($handle)) !== false) {
                    $rowNumber++;

                    // Skip empty rows
                    if (empty(array_filter($row))) {
                        continue;
                    }

                    // Extract values
                    $acNo = isset($row[$acNoIndex]) ? trim($row[$acNoIndex]) : null;
                    $name = isset($row[$nameIndex]) ? trim($row[$nameIndex]) : null;
                    $dateTimeStr = isset($row[$dateTimeIndex]) ? trim($row[$dateTimeIndex]) : null;
                    $state = isset($row[$stateIndex]) ? trim($row[$stateIndex]) : null;

                    // Validate required fields
                    if (empty($acNo) || empty($dateTimeStr)) {
                        $skipped++;
                        $errors[] = "Row $rowNumber: Missing AC No. or Date and Time";
                        continue;
                    }

                    // Parse date and time
                    try {
                        $dateTime = Carbon::parse($dateTimeStr);
                    } catch (\Exception $e) {
                        $skipped++;
                        $errors[] = "Row $rowNumber: Invalid date/time format: $dateTimeStr";
                        continue;
                    }

            // Try to find user by employee_id (AC No. might be employee_id)
            // Use a cache to avoid repeated queries for the same employee_id
            static $userCache = [];
            $cacheKey = $acNo;
            
            if (!isset($userCache[$cacheKey])) {
                $user = User::where('employee_id', $acNo)->first();

                // If not found, try to find by name (fuzzy match)
                if (!$user && $name) {
                    $nameParts = explode(' ', $name);
                    if (count($nameParts) >= 2) {
                        $firstName = $nameParts[0];
                        $lastName = end($nameParts);
                        $user = User::where('first_name', 'like', "%$firstName%")
                            ->where('last_name', 'like', "%$lastName%")
                            ->first();
                    }
                }
                
                $userCache[$cacheKey] = $user;
            } else {
                $user = $userCache[$cacheKey];
            }

                    // Create attendance record
                    Attendance::create([
                        'ac_no' => $acNo,
                        'employee_id' => $acNo, // Store AC No. as employee_id for reference
                        'user_id' => $user ? $user->id : null,
                        'name' => $name,
                        'date_time' => $dateTime,
                        'date' => $dateTime->toDateString(),
                        'time' => $dateTime->toTimeString(),
                        'state' => $state,
                        'import_filename' => $filename,
                        'imported_by' => $importedBy,
                        'imported_at' => $importedAt,
                    ]);

                    $imported++;
                }

                fclose($handle);
                DB::commit();

                return response()->json([
                    'message' => 'Attendance imported successfully',
                    'imported' => $imported,
                    'skipped' => $skipped,
                    'errors' => $errors,
                    'filename' => $filename,
                ], 200);

            } catch (\Exception $e) {
                DB::rollBack();
                fclose($handle);
                
                return response()->json([
                    'message' => 'Error importing attendance: ' . $e->getMessage()
                ], 500);
            }

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error processing file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get attendance records
     * - Employees can only view their own attendance
     * - HR and Admin can view all attendance records
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        
        // Eager load roles to avoid N+1 query
        $user->load('roles');
        $userRole = $user->roles->first()?->name ?? $user->role?->name;
        
        // Only load necessary user fields to reduce payload
        $query = Attendance::with([
            'user:id,name,first_name,last_name,employee_id',
            'importedBy:id,name,first_name,last_name'
        ]);

        // If user is not HR or Admin, restrict to their own records only
        if ($userRole !== 'hr' && $userRole !== 'admin') {
            // Employees can only see their own attendance
            // Use OR condition to match both user_id and employee_id
            // This handles cases where imported records have null user_id but matching employee_id
            $query->where(function($q) use ($user) {
                $q->where('user_id', $user->id);
                // Also match by employee_id if user has one (for imported records)
                if ($user->employee_id) {
                    $q->orWhere('employee_id', $user->employee_id);
                }
            });
        } else {
            // HR and Admin can filter by user_id if provided
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('date', '<=', $request->end_date);
        }

        // Filter by employee_id (only for HR/Admin or if it matches the current user)
        if ($request->has('employee_id')) {
            if ($userRole === 'hr' || $userRole === 'admin') {
                $query->where('employee_id', $request->employee_id);
            } else {
                // For employees, only allow filtering by their own employee_id
                if ($user->employee_id === $request->employee_id) {
                    $query->where('employee_id', $request->employee_id);
                }
            }
        }

        // Pagination
        $perPage = $request->get('per_page', 50);
        $attendances = $query->orderBy('date_time', 'desc')->paginate($perPage);

        return response()->json([
            'attendances' => $attendances
        ], 200);
    }

    /**
     * Get import history with pagination
     */
    public function importHistory(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        
        // Get unique import files with their metadata
        $history = Attendance::select('import_filename', 'imported_at', 'imported_by')
            ->selectRaw('COUNT(*) as records')
            ->whereNotNull('import_filename')
            ->groupBy('import_filename', 'imported_at', 'imported_by')
            ->orderBy('imported_at', 'desc')
            ->with('importedBy:id,name,first_name,last_name')
            ->paginate($perPage);

        // Transform the paginated results
        $transformedHistory = $history->getCollection()->map(function($item) {
            return [
                'filename' => $item->import_filename,
                'imported_at' => $item->imported_at,
                'records' => $item->records,
                'imported_by' => $item->importedBy ? ($item->importedBy->name ?? $item->importedBy->first_name . ' ' . $item->importedBy->last_name) : 'Unknown',
            ];
        });

        return response()->json([
            'history' => $transformedHistory,
            'pagination' => [
                'current_page' => $history->currentPage(),
                'per_page' => $history->perPage(),
                'total' => $history->total(),
                'last_page' => $history->lastPage(),
            ]
        ], 200);
    }

    /**
     * Undo/Delete attendance records by filename
     * Only HR can undo imports
     */
    public function undoImport(Request $request)
    {
        $validated = $request->validate([
            'filename' => 'required|string',
        ]);

        $filename = $validated['filename'];

        // Count records to be deleted
        $count = Attendance::where('import_filename', $filename)->count();

        if ($count === 0) {
            return response()->json([
                'message' => 'No records found for this file'
            ], 404);
        }

        // Delete all attendance records with this filename
        $deleted = Attendance::where('import_filename', $filename)->delete();

        return response()->json([
            'message' => "Successfully deleted {$deleted} attendance record(s) from import file: {$filename}",
            'deleted_count' => $deleted
        ], 200);
    }

    /**
     * Get attendance statistics (late, overtime, on-time)
     * Returns daily statistics for the current month or specified date range
     */
    public function statistics(Request $request)
    {
        // Get date range (default to current month)
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth()->toDateString());

        // Get standard time settings
        $settings = StandardTimeSetting::getSettings();
        $standardTimeIn = Carbon::parse($settings->time_in);
        $standardTimeOut = Carbon::parse($settings->time_out);

        // Get all attendance records in the date range
        $attendances = Attendance::whereBetween('date', [$startDate, $endDate])
            ->whereNotNull('user_id')
            ->orderBy('date')
            ->orderBy('time')
            ->get();

        // Group by date and user - track processed users per date
        $dailyStats = [];
        $processedUsers = []; // Track which users we've already counted per date
        
        foreach ($attendances as $attendance) {
            $date = $attendance->date->format('Y-m-d');
            $userId = $attendance->user_id;
            $key = $date . '_' . $userId;
            
            // Skip if we've already processed this user for this date
            if (isset($processedUsers[$key])) {
                continue;
            }
            
            if (!isset($dailyStats[$date])) {
                $dailyStats[$date] = [
                    'date' => $date,
                    'on_time' => 0,
                    'late' => 0,
                    'overtime' => 0,
                ];
            }

            // Get all records for this user on this date
            $userAttendances = $attendances->filter(function($a) use ($date, $userId) {
                return $a->date->format('Y-m-d') === $date && $a->user_id === $userId;
            })->sortBy('time');

            if ($userAttendances->count() > 0) {
                $firstRecord = $userAttendances->first();
                $lastRecord = $userAttendances->last();
                
                // Check time in (first record of the day)
                $timeIn = Carbon::parse($date . ' ' . $firstRecord->time);
                $timeInDiff = $timeIn->diffInMinutes($standardTimeIn, false);
                
                // Check time out (last record of the day)
                $timeOut = Carbon::parse($date . ' ' . $lastRecord->time);
                $timeOutDiff = $timeOut->diffInMinutes($standardTimeOut, false);

                // Count as late if time in is after standard time in (more than 0 minutes late)
                if ($timeInDiff > 0) {
                    $dailyStats[$date]['late']++;
                } else {
                    $dailyStats[$date]['on_time']++;
                }

                // Count as overtime if time out is after standard time out (more than 0 minutes)
                if ($timeOutDiff > 0) {
                    $dailyStats[$date]['overtime']++;
                }
                
                // Mark this user as processed for this date
                $processedUsers[$key] = true;
            }
        }

        // Convert to array format for chart
        $chartData = array_values($dailyStats);

        // Calculate totals
        $totals = [
            'on_time' => array_sum(array_column($chartData, 'on_time')),
            'late' => array_sum(array_column($chartData, 'late')),
            'overtime' => array_sum(array_column($chartData, 'overtime')),
        ];

        return response()->json([
            'statistics' => $chartData,
            'totals' => $totals,
            'standard_time_in' => $settings->time_in,
            'standard_time_out' => $settings->time_out,
            'date_range' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ], 200);
    }

    /**
     * Helper method to find column index by multiple possible names
     */
    private function findColumnIndex($normalizedHeaders, $possibleNames)
    {
        foreach ($possibleNames as $name) {
            $index = array_search(strtolower($name), $normalizedHeaders);
            if ($index !== false) {
                return $index;
            }
        }
        return false;
    }
}
