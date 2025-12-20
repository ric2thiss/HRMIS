<?php

namespace App\Services;

use App\Models\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebSocketService
{
    protected $websocketUrl;
    protected $secretKey;

    public function __construct()
    {
        $this->websocketUrl = config('app.websocket_url', 'http://localhost:3001');
        $this->secretKey = config('app.websocket_secret_key', env('WEBSOCKET_SECRET_KEY'));
    }

    /**
     * Emit an event to WebSocket server
     *
     * @param string $event Event name
     * @param array $data Event data
     * @param array|null $target Target audience (user, role, or all)
     * @return bool
     */
    public function emit(string $event, array $data, ?array $target = null): bool
    {
        try {
            $payload = [
                'event' => $event,
                'data' => $data,
            ];

            if ($target) {
                $payload['target'] = $target;
            }

            $response = Http::timeout(5)
                ->withHeaders([
                    'X-Secret-Key' => $this->secretKey,
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->websocketUrl}/emit", $payload);

            if ($response->successful()) {
                return true;
            }

            Log::warning('WebSocket emit failed', [
                'event' => $event,
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error('WebSocket emit error', [
                'event' => $event,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Emit notification to specific user
     * Creates database record and emits via WebSocket
     */
    public function notifyUser(int $userId, array $notificationData): bool
    {
        try {
            // Check if notification already exists for this user and entity (prevent duplicates)
            $existingNotification = Notification::where('user_id', $userId)
                ->where('entity_type', $notificationData['entity_type'] ?? null)
                ->where('entity_id', $notificationData['entity_id'] ?? null)
                ->where('title', $notificationData['title'] ?? 'Notification')
                ->where('created_at', '>=', now()->subMinutes(5)) // Within last 5 minutes
                ->first();
            
            if ($existingNotification) {
                // Notification already exists, use it instead of creating a new one
                $notification = $existingNotification;
            } else {
                // Create notification in database
                $notification = Notification::create([
                    'user_id' => $userId,
                    'type' => $notificationData['type'] ?? 'info',
                    'title' => $notificationData['title'] ?? 'Notification',
                    'message' => $notificationData['message'] ?? '',
                    'entity_type' => $notificationData['entity_type'] ?? null,
                    'entity_id' => $notificationData['entity_id'] ?? null,
                    'data' => $notificationData['data'] ?? null,
                ]);
            }

            // Emit WebSocket event with full notification data
            return $this->emit('notification', [
                'id' => $notification->id,
                'type' => $notification->type,
                'title' => $notification->title,
                'message' => $notification->message,
                'entity_type' => $notification->entity_type,
                'entity_id' => $notification->entity_id,
                'is_read' => $notification->is_read,
                'data' => $notification->data,
                'created_at' => $notification->created_at->toISOString(),
            ], [
                'type' => 'user',
                'userId' => $userId,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create notification: ' . $e->getMessage());
            // Still try to emit without database record
            return $this->emit('notification', $notificationData, [
                'type' => 'user',
                'userId' => $userId,
            ]);
        }
    }

    /**
     * Emit notification to all users
     * Creates database records for all users and emits via WebSocket
     */
    public function notifyAll(array $notificationData): bool
    {
        try {
            // Get all active users
            $users = \App\Models\User::where('is_locked', false)->pluck('id');
            
            // Create notifications for all users
            $notifications = [];
            foreach ($users as $userId) {
                $notification = Notification::create([
                    'user_id' => $userId,
                    'type' => $notificationData['type'] ?? 'info',
                    'title' => $notificationData['title'] ?? 'Notification',
                    'message' => $notificationData['message'] ?? '',
                    'entity_type' => $notificationData['entity_type'] ?? null,
                    'entity_id' => $notificationData['entity_id'] ?? null,
                    'data' => $notificationData['data'] ?? null,
                ]);
                $notifications[] = $notification;
            }

            // Emit WebSocket event
            return $this->emit('notification', $notificationData, [
                'type' => 'all',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create notifications for all users: ' . $e->getMessage());
            return $this->emit('notification', $notificationData, [
                'type' => 'all',
            ]);
        }
    }

    /**
     * Emit notification to specific role
     * Creates database records for users with the role and emits via WebSocket
     */
    public function notifyRole(string $role, array $notificationData): bool
    {
        try {
            // Get users with the specified role
            $roleModel = \App\Models\Role::where('name', $role)->first();
            if ($roleModel) {
                $users = \App\Models\User::where('role_id', $roleModel->id)
                    ->where('is_locked', false)
                    ->pluck('id');
                
                // Also check many-to-many relationship
                $manyToManyUsers = \App\Models\User::whereHas('roles', function($query) use ($role) {
                    $query->where('name', $role);
                })->where('is_locked', false)->pluck('id');
                
                $userIds = $users->merge($manyToManyUsers)->unique();
                
                // Create notifications for users with this role
                // Prevent duplicate notifications for the same entity
                foreach ($userIds as $userId) {
                    // Check if notification already exists for this user and entity
                    $existingNotification = Notification::where('user_id', $userId)
                        ->where('entity_type', $notificationData['entity_type'] ?? null)
                        ->where('entity_id', $notificationData['entity_id'] ?? null)
                        ->where('title', $notificationData['title'] ?? 'Notification')
                        ->where('created_at', '>=', now()->subMinutes(5)) // Within last 5 minutes
                        ->first();
                    
                    // Only create if notification doesn't exist
                    if (!$existingNotification) {
                        Notification::create([
                            'user_id' => $userId,
                            'type' => $notificationData['type'] ?? 'info',
                            'title' => $notificationData['title'] ?? 'Notification',
                            'message' => $notificationData['message'] ?? '',
                            'entity_type' => $notificationData['entity_type'] ?? null,
                            'entity_id' => $notificationData['entity_id'] ?? null,
                            'data' => $notificationData['data'] ?? null,
                        ]);
                    }
                }
            }

            // Emit WebSocket event
            return $this->emit('notification', $notificationData, [
                'type' => 'role',
                'role' => $role,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create notifications for role: ' . $e->getMessage());
            return $this->emit('notification', $notificationData, [
                'type' => 'role',
                'role' => $role,
            ]);
        }
    }

    /**
     * Emit announcement update
     */
    public function announceUpdate(string $action, array $announcement, ?array $target = null): bool
    {
        return $this->emit('announcement', [
            'action' => $action, // created, updated, deleted, activated, expired
            'announcement' => $announcement,
        ], $target ?? ['type' => 'all']);
    }

    /**
     * Emit real-time update for any entity
     */
    public function emitUpdate(string $entity, string $action, array $data, ?array $target = null): bool
    {
        return $this->emit("{$entity}:{$action}", $data, $target);
    }
}

