# WebSocket Real-Time System

## Overview

The application uses WebSocket technology (Socket.io) to provide real-time updates for notifications, announcements, and system events.

## Architecture

- **WebSocket Server**: Node.js server using Socket.io (runs on port 3001)
- **Laravel Backend**: Emits events via HTTP POST to WebSocket server
- **React Frontend**: Connects to WebSocket server and receives real-time updates

## Setup

### 1. WebSocket Server Setup

Navigate to the `websocket-server` directory:

```bash
cd websocket-server
```

Install dependencies:
```bash
npm install
```

Create `.env` file:
```bash
PORT=3001
CLIENT_URL=http://localhost:5173
LARAVEL_API_URL=http://localhost:8000
SECRET_KEY=your-secret-key-here
```

Start the server:
```bash
npm start
```

### 2. Laravel Configuration

Add to `server/.env`:
```
WEBSOCKET_URL=http://localhost:3001
WEBSOCKET_SECRET_KEY=your-secret-key-here
```

### 3. React Frontend

The WebSocket hook is automatically initialized in `main.jsx`. No additional setup required.

## Features

### Real-Time Notifications
- Leave application approvals/rejections
- PDS review updates (approved/declined/for-revision)
- System-wide notifications

### Real-Time Announcements
- New announcements appear instantly
- Updates reflect immediately
- Deletions remove from view
- Status changes (draft → active, active → expired) update automatically

## How It Works

1. **User Login** → WebSocket connects automatically
2. **Authentication** → Server verifies Laravel session
3. **Event Occurs** → Laravel sends HTTP POST to WebSocket server
4. **Broadcast** → Server emits event to appropriate clients
5. **UI Update** → React receives event and updates instantly

## API

### Emitting Events from Laravel

```php
use App\Services\WebSocketService;

WebSocketService::emit('notification', [
    'user_id' => $userId,
    'data' => $notificationData
]);
```

### Listening in React

```javascript
import { useWebSocket } from './hooks/useWebSocket';

const { socket, isConnected } = useWebSocket();

// Events are automatically handled by stores
```

## Troubleshooting

- Ensure WebSocket server is running on port 3001
- Check CORS configuration in WebSocket server
- Verify SECRET_KEY matches in both Laravel and WebSocket server
- Check browser console for connection errors

