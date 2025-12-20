<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\AnnouncementLike;
use App\Models\AnnouncementRecipient;
use App\Services\WebSocketService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class AnnouncementController extends Controller
{
    /**
     * Get all announcements (for HR - includes all statuses)
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $query = Announcement::with('postedBy:id,first_name,middle_initial,last_name,name');

            // Filter by status if provided
            if ($request->has('status')) {
                $status = $request->status;
                if ($status === 'all') {
                    // Show all announcements including expired
                    // Don't apply any status filter
                } elseif ($status === 'active') {
                    $query->active();
                } elseif ($status === 'expired') {
                    $query->expired();
                } elseif ($status === 'draft') {
                    $query->draft();
                } else {
                    $query->where('status', $status);
                }
            } else {
                // Default: show all except expired (for archive page, use status=expired)
                $query->where('status', '!=', 'expired');
            }

            // Filter by posted_by if HR wants to see only their announcements
            if ($request->has('my_announcements') && $request->my_announcements) {
                $query->where('posted_by', $user->id);
            }

            $announcements = $query->with('recipients')->orderBy('created_at', 'desc')->get();

            // Load likes/dislikes counts for HR view (if table exists)
            try {
                $hasLikesTable = Schema::hasTable('announcement_likes');
                foreach ($announcements as $announcement) {
                    if ($hasLikesTable) {
                        try {
                            $announcement->likes_count = AnnouncementLike::where('announcement_id', $announcement->id)
                                ->where('reaction', 'like')
                                ->count();
                            $announcement->dislikes_count = AnnouncementLike::where('announcement_id', $announcement->id)
                                ->where('reaction', 'dislike')
                                ->count();
                        } catch (\Exception $e) {
                            $announcement->likes_count = 0;
                            $announcement->dislikes_count = 0;
                        }
                    } else {
                        $announcement->likes_count = 0;
                        $announcement->dislikes_count = 0;
                    }
                }
            } catch (\Exception $e) {
                // If Schema check fails, set all counts to 0
                foreach ($announcements as $announcement) {
                    $announcement->likes_count = 0;
                    $announcement->dislikes_count = 0;
                }
            }

            return response()->json([
                'announcements' => $announcements
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching announcements: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch announcements',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get active announcements (for all users - shown on dashboard)
     */
    public function active(Request $request)
    {
        try {
            $user = $request->user();
            
            // First, auto-activate any draft announcements that have passed their scheduled time
            $now = Carbon::now();
            Announcement::where('status', 'draft')
                ->where('scheduled_at', '<=', $now)
                ->where('expires_at', '>', $now)
                ->update(['status' => 'active']);
            
            // Also auto-expire any announcements that have passed their expiry time
            Announcement::where('status', 'active')
                ->where('expires_at', '<=', $now)
                ->update(['status' => 'expired']);
            
            // Get active announcements - filter by recipients and exclude HR's own announcements
            // Show announcements that are active and haven't expired
            // If status is 'active', show it (even if scheduled_at hasn't been reached yet - might have been manually activated)
            // If status is 'draft' but scheduled_at has passed, it will be auto-activated above
            $query = Announcement::where('status', 'active')
                ->where('expires_at', '>', $now);
            
            // Exclude announcements created by the current user (HR shouldn't see their own on dashboard)
            // But allow them on /my-announcements page if include_own parameter is set
            if ($user && !$request->has('include_own')) {
                $query->where('posted_by', '!=', $user->id);
            }
            
            // Filter by recipients if user is authenticated
            if ($user) {
                $query->where(function($q) use ($user) {
                    // Show announcements that either:
                    // 1. Have no recipients (backward compatibility for legacy announcements)
                    // 2. Have recipients that match the user
                    $q->whereDoesntHave('recipients')
                      ->orWhereHas('recipients', function($recipientQuery) use ($user) {
                          // Build the recipient matching conditions
                          $recipientQuery->where(function($rq) use ($user) {
                              // "All" recipient - show to everyone
                              $rq->where('recipient_type', 'all')
                                 // Direct user recipient
                                 ->orWhere(function($subRq) use ($user) {
                                     $subRq->where('recipient_type', 'user')
                                           ->where('recipient_id', $user->id);
                                 });
                          });
                          
                          // Office recipient - check if user belongs to this office
                          if ($user->office_id) {
                              $recipientQuery->orWhere(function($rq) use ($user) {
                                  $rq->where('recipient_type', 'office')
                                     ->where('recipient_id', $user->office_id);
                              });
                          }
                          
                          // Position recipient - check if user has this position
                          if ($user->position_id) {
                              $recipientQuery->orWhere(function($rq) use ($user) {
                                  $rq->where('recipient_type', 'position')
                                     ->where('recipient_id', $user->position_id);
                              });
                          }
                      });
                });
            } else {
                // If no user, only show announcements with no recipients (public announcements)
                $query->whereDoesntHave('recipients');
            }
            
            $announcements = $query->with('postedBy:id,first_name,middle_initial,last_name,name')
                ->orderBy('scheduled_at', 'desc')
                ->get();

            // Add likes/dislikes counts and user's reaction (if table exists)
            try {
                $hasLikesTable = Schema::hasTable('announcement_likes');
                foreach ($announcements as $announcement) {
                    if ($hasLikesTable) {
                        try {
                            $announcement->likes_count = AnnouncementLike::where('announcement_id', $announcement->id)
                                ->where('reaction', 'like')
                                ->count();
                            $announcement->dislikes_count = AnnouncementLike::where('announcement_id', $announcement->id)
                                ->where('reaction', 'dislike')
                                ->count();
                            
                            // Get user's reaction if authenticated
                            if ($user) {
                                $userReaction = AnnouncementLike::where('announcement_id', $announcement->id)
                                    ->where('user_id', $user->id)
                                    ->first();
                                $announcement->user_reaction = $userReaction ? $userReaction->reaction : null;
                            } else {
                                $announcement->user_reaction = null;
                            }
                        } catch (\Exception $e) {
                            $announcement->likes_count = 0;
                            $announcement->dislikes_count = 0;
                            $announcement->user_reaction = null;
                        }
                    } else {
                        $announcement->likes_count = 0;
                        $announcement->dislikes_count = 0;
                        $announcement->user_reaction = null;
                    }
                }
            } catch (\Exception $e) {
                // If Schema check fails, set all counts to 0
                foreach ($announcements as $announcement) {
                    $announcement->likes_count = 0;
                    $announcement->dislikes_count = 0;
                    $announcement->user_reaction = null;
                }
            }

            return response()->json([
                'announcements' => $announcements
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching active announcements: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch active announcements',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get archived announcements (expired ones for HR)
     */
    public function archive(Request $request)
    {
        try {
            $user = $request->user();
            $query = Announcement::expired()
                ->with('postedBy:id,first_name,middle_initial,last_name,name');

            // HR can see all archived, but if my_announcements is true, show only their own
            if ($request->has('my_announcements') && $request->my_announcements) {
                $query->where('posted_by', $user->id);
            }

            $announcements = $query->orderBy('expires_at', 'desc')->get();

            return response()->json([
                'announcements' => $announcements
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching archived announcements: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch archived announcements',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get a single announcement
     */
    public function show($id)
    {
        try {
            $announcement = Announcement::with(['postedBy:id,first_name,middle_initial,last_name,name', 'recipients'])->find($id);

            if (!$announcement) {
                return response()->json([
                    'message' => 'Announcement not found'
                ], 404);
            }

            return response()->json([
                'announcement' => $announcement
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching announcement: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch announcement',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Create a new announcement
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
                'scheduled_at' => 'required|date',
                'duration_days' => 'required|integer|min:1|max:365',
            ]);
            
            // Custom validation for scheduled_at
            $validator->after(function ($validator) use ($request) {
                if ($request->has('scheduled_at')) {
                    $scheduledAt = Carbon::parse($request->scheduled_at);
                    if ($scheduledAt->isPast()) {
                        $validator->errors()->add('scheduled_at', 'The scheduled date must be in the future.');
                    }
                }
            });

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 401);
            }

            $data = [
                'title' => $request->title,
                'content' => $request->content,
                'scheduled_at' => $request->scheduled_at,
                'duration_days' => (int)$request->duration_days,
            ];

            // Handle image upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $fileName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                // Use Storage facade with public disk explicitly
                $path = Storage::disk('public')->putFileAs('announcements', $image, $fileName);
                // Use Storage::url() to get the proper URL
                $data['image'] = Storage::disk('public')->url($path);
            }

            // Calculate expires_at
            $scheduledAt = Carbon::parse($data['scheduled_at']);
            $data['expires_at'] = $scheduledAt->copy()->addDays($data['duration_days']);

            // Determine status based on scheduled_at
            $now = Carbon::now();
            $data['status'] = $scheduledAt->isFuture() ? 'draft' : 'active';
            $data['posted_by'] = $user->id;

            $announcement = Announcement::create($data);

            // Save recipients if provided
            try {
                // Check if announcement_recipients table exists
                if (Schema::hasTable('announcement_recipients')) {
                    $recipients = [];
                    if ($request->has('recipients')) {
                        // Handle JSON string from FormData
                        if (is_string($request->recipients)) {
                            $recipients = json_decode($request->recipients, true) ?? [];
                        } elseif (is_array($request->recipients)) {
                            $recipients = $request->recipients;
                        }
                    }
                    
                    // Only proceed if recipients array is not empty
                    if (!empty($recipients)) {
                        // Check if "all" is selected
                        $hasAll = false;
                        foreach ($recipients as $recipient) {
                            if (isset($recipient['type']) && $recipient['type'] === 'all') {
                                $hasAll = true;
                                break;
                            }
                        }
                        
                        // If "all" is selected, only save that one recipient
                        if ($hasAll) {
                            AnnouncementRecipient::create([
                                'announcement_id' => $announcement->id,
                                'recipient_type' => 'all',
                                'recipient_id' => null,
                            ]);
                        } else {
                            // Otherwise, save individual recipients
                            foreach ($recipients as $recipient) {
                                if (isset($recipient['type']) && isset($recipient['id'])) {
                                    AnnouncementRecipient::create([
                                        'announcement_id' => $announcement->id,
                                        'recipient_type' => $recipient['type'], // 'user', 'office', or 'position'
                                        'recipient_id' => $recipient['id'],
                                    ]);
                                }
                            }
                        }
                    }
                } else {
                    // Table doesn't exist yet - log warning but don't fail
                    Log::warning('announcement_recipients table does not exist. Please run migrations.');
                }
            } catch (\Exception $e) {
                // Log error but don't fail the announcement creation
                Log::error('Error saving announcement recipients: ' . $e->getMessage());
                Log::error('Stack trace: ' . $e->getTraceAsString());
            }

            // Load relationship
            $announcement->load('postedBy:id,first_name,middle_initial,last_name,name');

            // Emit WebSocket event for real-time update
            try {
                $websocketService = new WebSocketService();
                $websocketService->announceUpdate('created', $announcement->toArray());
            } catch (\Exception $e) {
                Log::warning('Failed to emit WebSocket event for announcement creation: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Announcement created successfully',
                'announcement' => $announcement
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating announcement: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to create announcement',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Update an announcement
     */
    public function update(Request $request, $id)
    {
        try {
            $announcement = Announcement::find($id);

            if (!$announcement) {
                return response()->json([
                    'message' => 'Announcement not found'
                ], 404);
            }

            // Check if user is the one who posted it
            if ($announcement->posted_by !== $request->user()->id) {
                return response()->json([
                    'message' => 'Unauthorized. You can only edit your own announcements.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'content' => 'sometimes|required|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
                'remove_image' => 'sometimes|boolean',
                'scheduled_at' => 'sometimes|required|date',
                'duration_days' => 'sometimes|required|integer|min:1|max:365',
            ]);
            
            // Custom validation for scheduled_at
            $validator->after(function ($validator) use ($request) {
                if ($request->has('scheduled_at')) {
                    $scheduledAt = Carbon::parse($request->scheduled_at);
                    if ($scheduledAt->isPast()) {
                        $validator->errors()->add('scheduled_at', 'The scheduled date must be in the future.');
                    }
                }
            });

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->only(['title', 'content', 'scheduled_at', 'duration_days']);

            // Handle image removal (if remove_image flag is set)
            if ($request->has('remove_image') && $request->remove_image) {
                // Delete old image if exists
                if ($announcement->image) {
                    // Extract path from URL (e.g., /storage/announcements/file.jpg -> announcements/file.jpg)
                    $imagePath = str_replace('/storage/', '', parse_url($announcement->image, PHP_URL_PATH));
                    if (Storage::disk('public')->exists($imagePath)) {
                        Storage::disk('public')->delete($imagePath);
                    }
                }
                $data['image'] = null;
            }
            // Handle image upload (if new image is provided)
            elseif ($request->hasFile('image')) {
                // Delete old image if exists
                if ($announcement->image) {
                    // Extract path from URL (e.g., /storage/announcements/file.jpg -> announcements/file.jpg)
                    $imagePath = str_replace('/storage/', '', parse_url($announcement->image, PHP_URL_PATH));
                    if (Storage::disk('public')->exists($imagePath)) {
                        Storage::disk('public')->delete($imagePath);
                    }
                }

                $image = $request->file('image');
                $fileName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                // Use Storage facade with public disk explicitly
                $path = Storage::disk('public')->putFileAs('announcements', $image, $fileName);
                // Use Storage::url() to get the proper URL
                $data['image'] = Storage::disk('public')->url($path);
            }

            // Recalculate expires_at if scheduled_at or duration_days changed
            if (isset($data['scheduled_at']) || isset($data['duration_days'])) {
                $scheduledAt = isset($data['scheduled_at']) 
                    ? Carbon::parse($data['scheduled_at']) 
                    : Carbon::parse($announcement->scheduled_at);
                $durationDays = $data['duration_days'] ?? $announcement->duration_days;
                $data['expires_at'] = $scheduledAt->copy()->addDays($durationDays);

                // Update status based on scheduled_at
                $now = Carbon::now();
                if (isset($data['scheduled_at'])) {
                    $data['status'] = $scheduledAt->isFuture() ? 'draft' : 'active';
                }
            }

            $announcement->update($data);
            
            // Update recipients if provided
            if ($request->has('recipients')) {
                // Delete existing recipients
                $announcement->recipients()->delete();
                
                // Handle JSON string from FormData
                $recipients = [];
                if (is_string($request->recipients)) {
                    $recipients = json_decode($request->recipients, true) ?? [];
                } elseif (is_array($request->recipients)) {
                    $recipients = $request->recipients;
                }
                
                // Check if "all" is selected
                $hasAll = false;
                foreach ($recipients as $recipient) {
                    if (isset($recipient['type']) && $recipient['type'] === 'all') {
                        $hasAll = true;
                        break;
                    }
                }
                
                // If "all" is selected, only save that one recipient
                if ($hasAll) {
                    AnnouncementRecipient::create([
                        'announcement_id' => $announcement->id,
                        'recipient_type' => 'all',
                        'recipient_id' => null,
                    ]);
                } else {
                    // Otherwise, save individual recipients
                    foreach ($recipients as $recipient) {
                        if (isset($recipient['type']) && isset($recipient['id'])) {
                            AnnouncementRecipient::create([
                                'announcement_id' => $announcement->id,
                                'recipient_type' => $recipient['type'],
                                'recipient_id' => $recipient['id'],
                            ]);
                        }
                    }
                }
            }
            
            $announcement->load('postedBy:id,first_name,middle_initial,last_name,name');

            // Emit WebSocket event for real-time update
            try {
                $websocketService = new WebSocketService();
                $websocketService->announceUpdate('updated', $announcement->toArray());
            } catch (\Exception $e) {
                Log::warning('Failed to emit WebSocket event for announcement update: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Announcement updated successfully',
                'announcement' => $announcement
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating announcement: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to update announcement',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Delete an announcement
     */
    public function destroy($id)
    {
        try {
            $announcement = Announcement::find($id);

            if (!$announcement) {
                return response()->json([
                    'message' => 'Announcement not found'
                ], 404);
            }

            // Check if user is the one who posted it
            if ($announcement->posted_by !== request()->user()->id) {
                return response()->json([
                    'message' => 'Unauthorized. You can only delete your own announcements.'
                ], 403);
            }

            // Delete image if exists
            if ($announcement->image) {
                // Extract path from URL (e.g., /storage/announcements/file.jpg -> announcements/file.jpg)
                $imagePath = str_replace('/storage/', '', parse_url($announcement->image, PHP_URL_PATH));
                if (Storage::disk('public')->exists($imagePath)) {
                    Storage::disk('public')->delete($imagePath);
                }
            }

            $announcementId = $announcement->id;
            $announcement->delete();

            // Emit WebSocket event for real-time update
            try {
                $websocketService = new WebSocketService();
                $websocketService->announceUpdate('deleted', ['id' => $announcementId]);
            } catch (\Exception $e) {
                Log::warning('Failed to emit WebSocket event for announcement deletion: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Announcement deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting announcement: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to delete announcement',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Update announcement status (activate, expire, etc.)
     * This can be called by a scheduled job to automatically update statuses
     */
    public function updateStatus($id)
    {
        try {
            $announcement = Announcement::find($id);

            if (!$announcement) {
                return response()->json([
                    'message' => 'Announcement not found'
                ], 404);
            }

            $now = Carbon::now();

            // If scheduled time has passed and status is draft, activate it
            if ($announcement->status === 'draft' && $announcement->scheduled_at <= $now && $announcement->expires_at > $now) {
                $announcement->status = 'active';
                $announcement->save();
                
                // Emit WebSocket event for real-time update
                try {
                    $websocketService = new WebSocketService();
                    $websocketService->announceUpdate('activated', $announcement->toArray());
                } catch (\Exception $e) {
                    Log::warning('Failed to emit WebSocket event for announcement activation: ' . $e->getMessage());
                }
            }

            // If expired, mark as expired
            if ($announcement->expires_at <= $now && $announcement->status !== 'expired') {
                $announcement->status = 'expired';
                $announcement->save();
                
                // Emit WebSocket event for real-time update
                try {
                    $websocketService = new WebSocketService();
                    $websocketService->announceUpdate('expired', $announcement->toArray());
                } catch (\Exception $e) {
                    Log::warning('Failed to emit WebSocket event for announcement expiration: ' . $e->getMessage());
                }
            }

            return response()->json([
                'message' => 'Status updated successfully',
                'announcement' => $announcement
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating announcement status: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to update status',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Like or dislike an announcement
     */
    public function react(Request $request, $id)
    {
        try {
            // Check if table exists
            if (!Schema::hasTable('announcement_likes')) {
                return response()->json([
                    'message' => 'Reactions feature is not available. Please run migrations.',
                    'error' => 'Table announcement_likes does not exist'
                ], 503);
            }

            $announcement = Announcement::find($id);

            if (!$announcement) {
                return response()->json([
                    'message' => 'Announcement not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'reaction' => 'required|in:like,dislike',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            
            // Ensure user is authenticated
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in again.',
                    'error' => 'Authentication required'
                ], 401);
            }
            
            $reaction = $request->reaction;

            // Check if user already reacted
            $existingReaction = AnnouncementLike::where('announcement_id', $id)
                ->where('user_id', $user->id)
                ->first();

            if ($existingReaction) {
                // If same reaction, remove it (toggle off)
                if ($existingReaction->reaction === $reaction) {
                    $existingReaction->delete();
                    $action = 'removed';
                } else {
                    // If different reaction, update it
                    $existingReaction->reaction = $reaction;
                    $existingReaction->save();
                    $action = 'updated';
                }
            } else {
                // Create new reaction
                AnnouncementLike::create([
                    'announcement_id' => $id,
                    'user_id' => $user->id,
                    'reaction' => $reaction,
                ]);
                $action = 'added';
            }

            // Get updated counts
            $likesCount = AnnouncementLike::where('announcement_id', $id)
                ->where('reaction', 'like')
                ->count();
            $dislikesCount = AnnouncementLike::where('announcement_id', $id)
                ->where('reaction', 'dislike')
                ->count();

            return response()->json([
                'message' => 'Reaction ' . $action . ' successfully',
                'likes_count' => $likesCount,
                'dislikes_count' => $dislikesCount,
                'user_reaction' => $action === 'removed' ? null : $reaction,
            ]);
        } catch (\Exception $e) {
            Log::error('Error reacting to announcement: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to react to announcement',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get user's reaction to an announcement
     */
    public function getUserReaction(Request $request, $id)
    {
        try {
            // Check if table exists
            if (!Schema::hasTable('announcement_likes')) {
                return response()->json([
                    'reaction' => null
                ]);
            }

            $user = $request->user();
            
            // If user is not authenticated, return null (not an error)
            if (!$user) {
                return response()->json([
                    'reaction' => null
                ]);
            }
            
            $reaction = AnnouncementLike::where('announcement_id', $id)
                ->where('user_id', $user->id)
                ->first();

            return response()->json([
                'reaction' => $reaction ? $reaction->reaction : null
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting user reaction: ' . $e->getMessage());
            return response()->json([
                'reaction' => null
            ]);
        }
    }
}
