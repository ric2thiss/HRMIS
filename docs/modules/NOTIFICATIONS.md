# Notification System

## Overview

The notification system is database-driven with real-time updates via WebSocket.

## Database Structure

**Table:** `notifications`
- Stores notifications in database
- Tracks read/unread status
- Links to entities (leave, pds, etc.)
- Includes metadata (type, title, message, data)

**Model:** `App\Models\Notification`
- Full Eloquent model with relationships
- Scopes for filtering (unread, read, by type, recent)
- Methods for marking as read/unread

## API Endpoints

### Get Notifications
```
GET /api/v1/notifications
```

### Get Unread Count
```
GET /api/v1/notifications/unread-count
```

### Mark as Read
```
PUT /api/v1/notifications/{id}/read
```

### Mark All as Read
```
PUT /api/v1/notifications/mark-all-read
```

### Delete Notification
```
DELETE /api/v1/notifications/{id}
```

## Notification Types

### Leave Notifications
- **Approval**: When leave is approved
- **Rejection**: When leave is rejected
- **Pending**: When leave requires approval

### PDS Notifications
- **Submission**: When employee submits PDS
- **Review**: When HR reviews PDS (approve/decline/revision)
- **Update**: When employee updates pending PDS

### System Notifications
- **Announcements**: New announcements
- **Maintenance**: System maintenance alerts

## Real-Time Updates

All notifications are delivered in real-time via WebSocket. The notification dropdown automatically updates when new notifications arrive.

## Frontend Integration

Notifications are managed through Zustand stores:
- `notificationStore.js` - Main notification state
- Real-time updates via WebSocket hook
- Automatic UI updates

