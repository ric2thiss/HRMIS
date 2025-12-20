<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StandardTimeSetting;
use Illuminate\Support\Facades\Validator;

class StandardTimeSettingController extends Controller
{
    /**
     * Get current standard time settings
     */
    public function index()
    {
        $settings = StandardTimeSetting::getSettings();
        
        return response()->json([
            'time_in' => $settings->time_in,
            'time_out' => $settings->time_out,
        ], 200);
    }

    /**
     * Update standard time settings
     */
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'time_in' => 'required|date_format:H:i:s',
            'time_out' => 'required|date_format:H:i:s',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $settings = StandardTimeSetting::getSettings();
        $settings->update([
            'time_in' => $request->time_in,
            'time_out' => $request->time_out,
        ]);

        return response()->json([
            'message' => 'Standard time settings updated successfully',
            'time_in' => $settings->time_in,
            'time_out' => $settings->time_out,
        ], 200);
    }
}
