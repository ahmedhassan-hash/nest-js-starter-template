import { Module } from '@nestjs/common';
import { WebSocketGatewayService } from './websocket.gateway';
import { SocketManagerService } from './socket-manager.service';
import { WebSocketController } from './websocket.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WebSocketController],
  providers: [WebSocketGatewayService, SocketManagerService],
  exports: [WebSocketGatewayService, SocketManagerService],
})
export class WebSocketModule {}
