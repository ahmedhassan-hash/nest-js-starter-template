import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebSocketGatewayService } from './websocket.gateway';
import { SocketManagerService } from './socket-manager.service';
import { GetUser } from '../auth/decorators/user.decorator';
import type { JwtPayload } from '../auth/jwt.service';

@ApiTags('WebSocket')
@ApiBearerAuth('access-token')
@Controller('websocket')
@UseGuards(JwtAuthGuard)
export class WebSocketController {
  constructor(
    private websocketGateway: WebSocketGatewayService,
    private socketManager: SocketManagerService,
  ) {}

  @Get('active-users')
  @ApiOperation({ summary: 'Get all active WebSocket users' })
  @ApiResponse({ status: 200, description: 'List of active users' })
  getActiveUsers() {
    return {
      users: this.socketManager.getAllActiveUsers().map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        connectedAt: user.connectedAt,
      })),
      stats: this.socketManager.getActiveUsersStats(),
    };
  }

  @Get('users-stats')
  @ApiOperation({ summary: 'Get WebSocket users statistics' })
  @ApiResponse({ status: 200, description: 'Users statistics' })
  getUsersStats() {
    return this.socketManager.getActiveUsersStats();
  }

  @Post('send-notification')
  @ApiOperation({ summary: 'Send notification to specific user via WebSocket' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  sendNotification(
    @Body() body: { userId: string; message: string; type?: string },
    @GetUser() user: JwtPayload,
  ) {
    const success = this.websocketGateway.sendToUser(
      body.userId,
      'notification',
      {
        from: {
          id: user.sub,
          username: user.username,
          role: user.role,
        },
        message: body.message,
        type: body.type || 'info',
        timestamp: new Date().toISOString(),
      },
    );

    return {
      success,
      message: success
        ? 'Notification sent successfully'
        : 'User not connected or not found',
    };
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Broadcast message to all connected users' })
  @ApiResponse({ status: 200, description: 'Message broadcasted successfully' })
  broadcast(
    @Body() body: { message: string; type?: string },
    @GetUser() user: JwtPayload,
  ) {
    this.websocketGateway.broadcastToAll('broadcast-notification', {
      from: {
        id: user.sub,
        username: user.username,
        role: user.role,
      },
      message: body.message,
      type: body.type || 'announcement',
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Message broadcasted to all users',
      activeUsersCount: this.socketManager.getActiveUsersCount(),
    };
  }

  @Post('send-to-role')
  @ApiOperation({ summary: 'Send message to users with specific role' })
  @ApiResponse({
    status: 200,
    description: 'Message sent to role successfully',
  })
  sendToRole(
    @Body() body: { role: string; message: string; type?: string },
    @GetUser() user: JwtPayload,
  ) {
    const targetUsers = this.socketManager.getActiveUsersByRole(body.role);

    this.websocketGateway.broadcastToRole(body.role, 'role-notification', {
      from: {
        id: user.sub,
        username: user.username,
        role: user.role,
      },
      message: body.message,
      type: body.type || 'role-message',
      targetRole: body.role,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Message sent to ${targetUsers.length} users with role: ${body.role}`,
      targetUsersCount: targetUsers.length,
    };
  }
}
