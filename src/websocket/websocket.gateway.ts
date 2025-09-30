import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { SocketManagerService } from './socket-manager.service';
import type { JwtPayload } from '../auth/jwt.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class WebSocketGatewayService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGatewayService.name);

  constructor(private socketManager: SocketManagerService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  @UseGuards(WsJwtGuard)
  handleConnection(client: Socket) {
    const user = client.data.user as JwtPayload;
    if (user) {
      this.socketManager.addUser(client, user);

      client.emit('connected', {
        message: 'Successfully connected to WebSocket',
        user: {
          id: user.sub,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        timestamp: new Date().toISOString(),
      });

      this.server.emit('user-connected', {
        user: {
          id: user.sub,
          username: user.username,
          role: user.role,
        },
        timestamp: new Date().toISOString(),
        activeUsersCount: this.socketManager.getActiveUsersCount(),
      });
    }
  }

  handleDisconnect(client: Socket) {
    const user = this.socketManager.removeUser(client.id);
    if (user) {
      this.server.emit('user-disconnected', {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        timestamp: new Date().toISOString(),
        activeUsersCount: this.socketManager.getActiveUsersCount(),
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('get-active-users')
  handleGetActiveUsers(@ConnectedSocket() client: Socket) {
    const activeUsers = this.socketManager.getAllActiveUsers();
    client.emit('active-users', {
      users: activeUsers.map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        connectedAt: user.connectedAt,
      })),
      count: activeUsers.length,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('get-users-stats')
  handleGetUsersStats(@ConnectedSocket() client: Socket) {
    const stats = this.socketManager.getActiveUsersStats();
    client.emit('users-stats', stats);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send-message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { message: string; to?: string },
  ) {
    const user = client.data.user as JwtPayload;

    const messageData = {
      from: {
        id: user.sub,
        username: user.username,
        role: user.role,
      },
      message: payload.message,
      timestamp: new Date().toISOString(),
    };

    if (payload.to) {
      const targetSocketId = this.socketManager.getUserSocketId(payload.to);
      if (targetSocketId) {
        this.server.to(targetSocketId).emit('private-message', messageData);
        client.emit('message-sent', { ...messageData, to: payload.to });
      } else {
        client.emit('error', { message: 'User not found or offline' });
      }
    } else {
      this.server.emit('broadcast-message', messageData);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string },
  ) {
    const user = client.data.user as JwtPayload;
    client.join(payload.room);

    client.to(payload.room).emit('user-joined-room', {
      user: {
        id: user.sub,
        username: user.username,
        role: user.role,
      },
      room: payload.room,
      timestamp: new Date().toISOString(),
    });

    client.emit('joined-room', {
      room: payload.room,
      message: `Successfully joined room: ${payload.room}`,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string },
  ) {
    const user = client.data.user as JwtPayload;
    client.leave(payload.room);

    client.to(payload.room).emit('user-left-room', {
      user: {
        id: user.sub,
        username: user.username,
        role: user.role,
      },
      room: payload.room,
      timestamp: new Date().toISOString(),
    });

    client.emit('left-room', {
      room: payload.room,
      message: `Successfully left room: ${payload.room}`,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('room-message')
  handleRoomMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string; message: string },
  ) {
    const user = client.data.user as JwtPayload;

    const messageData = {
      from: {
        id: user.sub,
        username: user.username,
        role: user.role,
      },
      message: payload.message,
      room: payload.room,
      timestamp: new Date().toISOString(),
    };

    this.server.to(payload.room).emit('room-message', messageData);
  }

  sendToUser(userId: string, event: string, data: any): boolean {
    const socketId = this.socketManager.getUserSocketId(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  broadcastToAll(event: string, data: any): void {
    this.server.emit(event, data);
  }

  broadcastToRoom(room: string, event: string, data: any): void {
    this.server.to(room).emit(event, data);
  }

  broadcastToRole(role: string, event: string, data: any): void {
    const users = this.socketManager.getActiveUsersByRole(role);
    users.forEach((user) => {
      this.server.to(user.socketId).emit(event, data);
    });
  }
}
