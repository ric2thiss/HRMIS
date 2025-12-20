# WebSocket Server for DICT Project

This is a Node.js WebSocket server using Socket.io for real-time updates in the DICT Project application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```
PORT=3001
CLIENT_URL=http://localhost:5173
LARAVEL_API_URL=http://localhost:8000
SECRET_KEY=your-secret-key-here-change-in-production
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## How It Works

1. **Client Connection**: React clients connect to this WebSocket server
2. **Authentication**: Clients authenticate using their Laravel Sanctum session cookies
3. **Event Broadcasting**: Laravel backend sends events to this server via HTTP POST to `/emit`
4. **Real-time Updates**: Server broadcasts events to connected clients based on target (user, role, or all)

## API Endpoints

### POST /emit
Laravel backend uses this endpoint to emit events to connected clients.

**Headers:**
- `X-Secret-Key`: Secret key for authentication (optional if SECRET_KEY is not set)

**Body:**
```json
{
  "event": "notification",
  "data": {
    "type": "success",
    "title": "Title",
    "message": "Message"
  },
  "target": {
    "type": "user",
    "userId": 1
  }
}
```

**Target Types:**
- `user`: Send to specific user by userId
- `role`: Send to all users with specific role
- `all`: Send to all connected users

### GET /health
Health check endpoint.

### GET /stats
Get server statistics (connected users, rooms).

## Events

### Client → Server
- `authenticate`: Authenticate with token
- `ping`: Health check ping

### Server → Client
- `authenticated`: Authentication successful
- `auth_error`: Authentication failed
- `pong`: Response to ping
- `notification`: Real-time notification
- `announcement`: Announcement update (created, updated, deleted, activated, expired)

## Integration with Laravel

The Laravel backend uses `WebSocketService` to emit events:

```php
$websocketService = new WebSocketService();
$websocketService->notifyUser($userId, [
    'type' => 'success',
    'title' => 'Title',
    'message' => 'Message'
]);
```

## Security

- Uses Laravel Sanctum cookie-based authentication
- Optional secret key for HTTP endpoint protection
- User-specific and role-based room isolation

