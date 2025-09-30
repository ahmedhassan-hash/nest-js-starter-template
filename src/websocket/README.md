# WebSocket Implementation

This WebSocket implementation provides real-time communication capabilities with JWT authentication and user management.

## Features

- **JWT Authentication**: All WebSocket connections require valid JWT tokens
- **Active User Tracking**: Track all connected users with their session information
- **User Management**: Add, remove, and query connected users
- **Broadcasting**: Send messages to all users, specific users, or users with specific roles
- **Room Support**: Join/leave rooms and send room-specific messages
- **Statistics**: Get real-time stats about connected users

## Architecture

### Core Components

1. **WebSocketGatewayService**: Main gateway handling WebSocket connections and events
2. **SocketManagerService**: Manages connected users and provides utility functions
3. **WsJwtGuard**: Validates JWT tokens for WebSocket connections
4. **WebSocketController**: REST API endpoints for WebSocket management

### JWT Authentication

WebSocket connections can authenticate using JWT tokens in three ways:

1. **Auth object**: `{ auth: { token: 'your-jwt-token' } }`
2. **Authorization header**: `Authorization: Bearer your-jwt-token`
3. **Query parameter**: `?token=your-jwt-token`

## WebSocket Events

### Client → Server Events

| Event | Description | Payload | Auth Required |
|-------|-------------|---------|---------------|
| `get-active-users` | Get list of all active users | - | ✅ |
| `get-users-stats` | Get user statistics | - | ✅ |
| `send-message` | Send public or private message | `{ message: string, to?: string }` | ✅ |
| `join-room` | Join a room | `{ room: string }` | ✅ |
| `leave-room` | Leave a room | `{ room: string }` | ✅ |
| `room-message` | Send message to room | `{ room: string, message: string }` | ✅ |

### Server → Client Events

| Event | Description | Payload |
|-------|-------------|---------|
| `connected` | Connection successful | `{ message, user, timestamp }` |
| `user-connected` | User joined | `{ user, timestamp, activeUsersCount }` |
| `user-disconnected` | User left | `{ user, timestamp, activeUsersCount }` |
| `active-users` | Active users list | `{ users, count }` |
| `users-stats` | User statistics | `{ totalUsers, usersByRole, connectionTimes }` |
| `private-message` | Private message received | `{ from, message, timestamp }` |
| `broadcast-message` | Public message received | `{ from, message, timestamp }` |
| `notification` | System notification | `{ from, message, type, timestamp }` |
| `broadcast-notification` | Broadcast notification | `{ from, message, type, timestamp }` |
| `role-notification` | Role-specific notification | `{ from, message, type, targetRole, timestamp }` |
| `user-joined-room` | User joined room | `{ user, room, timestamp }` |
| `user-left-room` | User left room | `{ user, room, timestamp }` |
| `room-message` | Room message | `{ from, message, room, timestamp }` |
| `joined-room` | Confirmed room join | `{ room, message }` |
| `left-room` | Confirmed room leave | `{ room, message }` |
| `error` | Error message | `{ message }` |

## REST API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/websocket/active-users` | Get active users and stats | ✅ |
| GET | `/websocket/users-stats` | Get user statistics | ✅ |
| POST | `/websocket/send-notification` | Send notification to specific user | ✅ |
| POST | `/websocket/broadcast` | Broadcast to all users | ✅ |
| POST | `/websocket/send-to-role` | Send to users with specific role | ✅ |

## Usage Examples

### Frontend Client (JavaScript)

```javascript
import io from 'socket.io-client';

// Connect with JWT token
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Listen for connection
socket.on('connected', (data) => {
  console.log('Connected:', data);
});

// Get active users
socket.emit('get-active-users');
socket.on('active-users', (data) => {
  console.log('Active users:', data.users);
});

// Send a message
socket.emit('send-message', {
  message: 'Hello everyone!'
});

// Listen for messages
socket.on('broadcast-message', (data) => {
  console.log('Message from', data.from.username, ':', data.message);
});

// Join a room
socket.emit('join-room', { room: 'general' });

// Send room message
socket.emit('room-message', {
  room: 'general',
  message: 'Hello room!'
});
```

### Backend Service Usage

```typescript
import { Injectable } from '@nestjs/common';
import { WebSocketGatewayService } from './websocket/websocket.gateway';
import { SocketManagerService } from './websocket/socket-manager.service';

@Injectable()
export class NotificationService {
  constructor(
    private websocketGateway: WebSocketGatewayService,
    private socketManager: SocketManagerService,
  ) {}

  async notifyUser(userId: string, message: string) {
    const success = this.websocketGateway.sendToUser(userId, 'notification', {
      message,
      type: 'info',
      timestamp: new Date().toISOString(),
    });

    return success;
  }

  async broadcastAnnouncement(message: string) {
    this.websocketGateway.broadcastToAll('announcement', {
      message,
      timestamp: new Date().toISOString(),
    });
  }

  async notifyAdmins(message: string) {
    this.websocketGateway.broadcastToRole('ADMIN', 'admin-notification', {
      message,
      timestamp: new Date().toISOString(),
    });
  }

  getActiveUsersCount(): number {
    return this.socketManager.getActiveUsersCount();
  }
}
```

## Error Handling

- Invalid JWT tokens will result in connection rejection
- Missing authentication will trigger `WsException`
- Private messages to offline users return error events
- All errors are emitted as `error` events to the client

## Configuration

WebSocket gateway is configured with CORS enabled for all origins. For production, update the CORS configuration in `websocket.gateway.ts`:

```typescript
@WebSocketGateway({
  cors: {
    origin: ['https://yourdomain.com'],
    credentials: true,
  },
})
```

## Security Considerations

1. **JWT Validation**: All connections require valid JWT tokens
2. **User Authorization**: Guards ensure only authenticated users can access events
3. **Rate Limiting**: Consider implementing rate limiting for production
4. **CORS**: Configure appropriate CORS settings for production
5. **Input Validation**: Validate all incoming message payloads