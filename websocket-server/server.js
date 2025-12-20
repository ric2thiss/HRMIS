const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Store connected users
const connectedUsers = new Map(); // userId -> socketId

// Laravel API base URL
const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000';

// Verify user authentication with Laravel (cookie-based Sanctum)
async function verifyAuth(token, cookies) {
  try {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Referer': process.env.CLIENT_URL || 'http://localhost:5173',
      'Origin': process.env.CLIENT_URL || 'http://localhost:5173',
    };
    
    // Add CSRF token if provided
    if (token) {
      headers['X-XSRF-TOKEN'] = token;
    }
    
    // Build axios config with cookies
    const config = {
      headers,
      withCredentials: true,
      maxRedirects: 0, // Don't follow redirects
      validateStatus: function (status) {
        // Don't throw on 401, return the response
        return status < 500;
      },
    };
    
    // Add cookies to the request - axios needs them in the Cookie header
    // Socket.io forwards cookies in the handshake, but we need to ensure they're properly formatted
    if (cookies) {
      // Ensure cookies are properly formatted
      config.headers['Cookie'] = cookies;
    }
    
    const response = await axios.get(`${LARAVEL_API_URL}/api/user`, config);
    
    // Check if request was successful
    if (response.status === 200 && response.data) {
      return response.data?.user || response.data;
    } else {
      console.error('Auth failed - Status:', response.status, 'Data:', response.data);
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.error('Auth verification error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Auth verification error: No response received', error.message);
    } else {
      console.error('Auth verification error:', error.message);
    }
    return null;
  }
}

// Socket.io connection handling
io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id);

  // Handle authentication
  socket.on('authenticate', async (data) => {
    try {
      const { token } = data;
      // Get cookies from handshake - Socket.io forwards cookies automatically
      const cookies = socket.handshake.headers.cookie || socket.handshake.headers.Cookie || '';
      
      console.log('Authenticating socket:', socket.id);
      console.log('CSRF token present:', token ? 'yes' : 'no');
      console.log('Cookies present:', cookies ? 'yes (' + cookies.substring(0, 50) + '...)' : 'no');
      
      const user = await verifyAuth(token, cookies);
      if (!user) {
        console.log('Authentication failed for socket:', socket.id);
        socket.emit('auth_error', { message: 'Authentication failed. Please log in again.' });
        socket.disconnect(true);
        return;
      }

      // Store user connection
      connectedUsers.set(user.id, socket.id);
      socket.userId = user.id;
      socket.user = user;

      // Join user-specific room
      socket.join(`user:${user.id}`);

      // Join role-based rooms
      // Handle both single role object and roles array
      if (user.role) {
        const roleName = typeof user.role === 'string' ? user.role : user.role.name;
        if (roleName) {
          socket.join(`role:${roleName}`);
        }
      } else if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
        // Handle roles array (many-to-many relationship)
        user.roles.forEach(role => {
          const roleName = typeof role === 'string' ? role : role.name;
          if (roleName) {
            socket.join(`role:${roleName}`);
          }
        });
      }

      // Join all users room for global announcements
      socket.join('all');

      socket.emit('authenticated', { 
        message: 'Authentication successful',
        user: {
          id: user.id,
          name: user.name,
          role: user.role
        }
      });

      console.log(`User ${user.id} (${user.name}) authenticated and connected`);
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('auth_error', { message: 'Authentication failed' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    } else {
      console.log('Client disconnected:', socket.id);
    }
  });

  // Handle ping/pong for connection health
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// HTTP endpoint to receive events from Laravel
app.post('/emit', async (req, res) => {
  try {
    const { event, data, target } = req.body;

    if (!event || !data) {
      return res.status(400).json({ error: 'Event and data are required' });
    }

    // Validate secret key (optional security measure)
    const secretKey = req.headers['x-secret-key'];
    if (process.env.SECRET_KEY && secretKey !== process.env.SECRET_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Emit event based on target
    if (target) {
      if (target.type === 'user' && target.userId) {
        // Emit to specific user
        io.to(`user:${target.userId}`).emit(event, data);
        console.log(`Emitted ${event} to user ${target.userId}`);
      } else if (target.type === 'role' && target.role) {
        // Emit to specific role
        io.to(`role:${target.role}`).emit(event, data);
        console.log(`Emitted ${event} to role ${target.role}`);
      } else if (target.type === 'all') {
        // Emit to all connected users
        io.to('all').emit(event, data);
        console.log(`Emitted ${event} to all users`);
      } else {
        // Emit to all
        io.emit(event, data);
        console.log(`Emitted ${event} to all (no target)`);
      }
    } else {
      // Emit to all if no target specified
      io.emit(event, data);
      console.log(`Emitted ${event} to all (no target specified)`);
    }

    res.json({ success: true, message: 'Event emitted successfully' });
  } catch (error) {
    console.error('Error emitting event:', error);
    res.status(500).json({ error: 'Failed to emit event' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connectedUsers: connectedUsers.size,
    timestamp: new Date().toISOString()
  });
});

// Get connected users count
app.get('/stats', (req, res) => {
  res.json({
    connectedUsers: connectedUsers.size,
    rooms: Array.from(io.sockets.adapter.rooms.keys())
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`Laravel API URL: ${LARAVEL_API_URL}`);
  console.log(`Client URL: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
});

