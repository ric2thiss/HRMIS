<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\ModuleAccessLog;

class ModuleAccessController extends Controller
{
    /**
     * Log module access
     */
    public function logAccess(Request $request)
    {
        $validated = $request->validate([
            'module_name' => 'required|string|max:100',
            'module_path' => 'nullable|string|max:255',
        ]);

        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Create module access log entry
        ModuleAccessLog::create([
            'user_id' => $user->id,
            'module_name' => $validated['module_name'],
            'module_path' => $validated['module_path'] ?? null,
            'access_date' => now()->toDateString(),
            'accessed_at' => now(),
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'Module access logged'], 201);
    }

    /**
     * Get overall module usage statistics (total access counts per module)
     * Returns modules sorted by most used
     */
    public function getModuleUsage(Request $request)
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);
        
        // Get total access counts for each module in the specified month
        $moduleUsage = ModuleAccessLog::select(
            'module_name',
            DB::raw('COUNT(DISTINCT user_id) as total_users'),
            DB::raw('COUNT(*) as total_accesses')
        )
        ->whereYear('access_date', $year)
        ->whereMonth('access_date', $month)
        ->groupBy('module_name')
        ->orderByDesc('total_accesses')
        ->get();
        
        // Format data for chart (horizontal bar chart)
        $chartData = [];
        foreach ($moduleUsage as $module) {
            $chartData[] = [
                'module' => $module->module_name,
                'total_users' => (int)$module->total_users,
                'total_accesses' => (int)$module->total_accesses,
            ];
        }
        
        return response()->json([
            'year' => $year,
            'month' => $month,
            'modules' => $chartData,
        ]);
    }
}
