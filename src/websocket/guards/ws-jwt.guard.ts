import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtTokenService } from '../../auth/jwt.service';
import type { Socket } from 'socket.io';
import type { JwtPayload } from '../../auth/jwt.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtTokenService: JwtTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const authToken = this.extractTokenFromSocket(client);

      if (!authToken) {
        throw new WsException('No token provided');
      }

      const payload: JwtPayload =
        await this.jwtTokenService.verifyAccessToken(authToken);

      client.data.user = payload;
      return true;
    } catch {
      throw new WsException('Invalid token');
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    const auth = client.handshake.auth?.token as string;
    if (auth) return auth;

    const authHeader = client.handshake.headers?.authorization as string;
    if (authHeader) {
      return this.jwtTokenService.extractTokenFromHeader(authHeader);
    }

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string') return queryToken;

    return null;
  }
}
