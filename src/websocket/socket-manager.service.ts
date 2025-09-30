import { Injectable, Logger } from '@nestjs/common';
import type { Socket } from 'socket.io';
import type { SocketUser } from './interfaces/socket-user.interface';
import type { JwtPayload } from '../auth/jwt.service';

@Injectable()
export class SocketManagerService {
  private readonly logger = new Logger(SocketManagerService.name);
  private readonly connectedUsers = new Map<string, SocketUser>();
  private readonly userSocketMap = new Map<string, string>();

  addUser(socket: Socket, user: JwtPayload): void {
    const socketUser: SocketUser = {
      id: user.sub,
      email: user.email,
      username: user.username,
      role: user.role,
      socketId: socket.id,
      connectedAt: new Date(),
    };

    this.connectedUsers.set(socket.id, socketUser);
    this.userSocketMap.set(user.sub, socket.id);

    this.logger.log(
      `User ${user.username} (${user.email}) connected with socket ${socket.id}`,
    );
  }

  removeUser(socketId: string): SocketUser | null {
    const user = this.connectedUsers.get(socketId);
    if (user) {
      this.connectedUsers.delete(socketId);
      this.userSocketMap.delete(user.id);
      this.logger.log(
        `User ${user.username} (${user.email}) disconnected from socket ${socketId}`,
      );
      return user;
    }
    return null;
  }

  getUserBySocketId(socketId: string): SocketUser | null {
    return this.connectedUsers.get(socketId) || null;
  }

  getUserSocketId(userId: string): string | null {
    return this.userSocketMap.get(userId) || null;
  }

  isUserConnected(userId: string): boolean {
    return this.userSocketMap.has(userId);
  }

  getAllActiveUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  getActiveUsersCount(): number {
    return this.connectedUsers.size;
  }

  getActiveUsersByRole(role: string): SocketUser[] {
    return this.getAllActiveUsers().filter((user) => user.role === role);
  }

  getActiveUsersStats(): {
    totalUsers: number;
    usersByRole: Record<string, number>;
    connectionTimes: { userId: string; connectedAt: Date }[];
  } {
    const users = this.getAllActiveUsers();
    const usersByRole: Record<string, number> = {};

    users.forEach((user) => {
      usersByRole[user.role] = (usersByRole[user.role] || 0) + 1;
    });

    return {
      totalUsers: users.length,
      usersByRole,
      connectionTimes: users.map((user) => ({
        userId: user.id,
        connectedAt: user.connectedAt,
      })),
    };
  }

  disconnectUser(userId: string): boolean {
    const socketId = this.getUserSocketId(userId);
    if (socketId) {
      this.removeUser(socketId);
      return true;
    }
    return false;
  }
}
