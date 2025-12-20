<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Announcement;
use App\Models\User;
use App\Services\WebSocketService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ActivateScheduledAnnouncements extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'announcements:activate-scheduled';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Activate draft announcements that have reached their scheduled time and expire announcements that have passed their expiry time';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = Carbon::now();
        $activatedCount = 0;
        $expiredCount = 0;

        // Activate draft announcements that have reached their scheduled time
        $draftAnnouncements = Announcement::where('status', 'draft')
            ->where('scheduled_at', '<=', $now)
            ->where('expires_at', '>', $now)
            ->get();

        foreach ($draftAnnouncements as $announcement) {
            // Load recipients relationship
            $announcement->load('recipients');
            
            $announcement->status = 'active';
            $announcement->save();
            $activatedCount++;

            // Emit WebSocket event for real-time update
            try {
                $websocketService = new WebSocketService();
                $websocketService->announceUpdate('activated', $announcement->toArray());
                
                // Send notifications to all recipients
                $recipients = $announcement->recipients;
                
                if ($recipients->isEmpty()) {
                    // If no recipients, notify all users (backward compatibility)
                    $websocketService->notifyAll([
                        'type' => 'info',
                        'title' => 'New Announcement',
                        'message' => "A new announcement has been posted: {$announcement->title}",
                        'entity_type' => 'announcement',
                        'entity_id' => $announcement->id,
                        'data' => [
                            'announcement_id' => $announcement->id,
                            'title' => $announcement->title,
                        ]
                    ]);
                } else {
                    // Get all user IDs that should receive this announcement
                    $userIds = [];
                    
                    foreach ($recipients as $recipient) {
                        if ($recipient->recipient_type === 'all') {
                            // Notify all users
                            $allUsers = \App\Models\User::where('is_locked', false)->pluck('id')->toArray();
                            $userIds = array_merge($userIds, $allUsers);
                        } elseif ($recipient->recipient_type === 'user') {
                            // Direct user recipient
                            $userIds[] = $recipient->recipient_id;
                        } elseif ($recipient->recipient_type === 'office') {
                            // All users in this office
                            $officeUsers = \App\Models\User::where('office_id', $recipient->recipient_id)
                                ->where('is_locked', false)
                                ->pluck('id')
                                ->toArray();
                            $userIds = array_merge($userIds, $officeUsers);
                        } elseif ($recipient->recipient_type === 'position') {
                            // All users with this position
                            $positionUsers = \App\Models\User::where('position_id', $recipient->recipient_id)
                                ->where('is_locked', false)
                                ->pluck('id')
                                ->toArray();
                            $userIds = array_merge($userIds, $positionUsers);
                        }
                    }
                    
                    // Remove duplicates and send notifications
                    $userIds = array_unique($userIds);
                    
                    foreach ($userIds as $userId) {
                        $websocketService->notifyUser($userId, [
                            'type' => 'info',
                            'title' => 'New Announcement',
                            'message' => "A new announcement has been posted: {$announcement->title}",
                            'entity_type' => 'announcement',
                            'entity_id' => $announcement->id,
                            'data' => [
                                'announcement_id' => $announcement->id,
                                'title' => $announcement->title,
                            ]
                        ]);
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Failed to emit WebSocket event or send notifications for announcement activation: ' . $e->getMessage());
            }

            $this->info("Activated announcement: {$announcement->title} (ID: {$announcement->id})");
        }

        // Expire active announcements that have passed their expiry time
        $activeAnnouncements = Announcement::where('status', 'active')
            ->where('expires_at', '<=', $now)
            ->get();

        foreach ($activeAnnouncements as $announcement) {
            $announcement->status = 'expired';
            $announcement->save();
            $expiredCount++;

            // Emit WebSocket event for real-time update
            try {
                $websocketService = new WebSocketService();
                $websocketService->announceUpdate('expired', $announcement->toArray());
            } catch (\Exception $e) {
                Log::warning('Failed to emit WebSocket event for announcement expiration: ' . $e->getMessage());
            }

            $this->info("Expired announcement: {$announcement->title} (ID: {$announcement->id})");
        }

        if ($activatedCount > 0 || $expiredCount > 0) {
            $this->info("Processed: {$activatedCount} activated, {$expiredCount} expired");
        } else {
            $this->info("No announcements to process");
        }

        return Command::SUCCESS;
    }
}

