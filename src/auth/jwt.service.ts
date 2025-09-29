import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import type { AppConfig } from '../config/configuration';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtTokenService {
  constructor(
    private jwtService: NestJwtService,
    private configService: ConfigService<AppConfig>,
  ) {}

  async generateTokenPair(
    payload: Omit<JwtPayload, 'iat' | 'exp'>,
  ): Promise<TokenPair> {
    const jwtConfig = this.configService.get('jwt', { infer: true });

    if (!jwtConfig?.accessSecret || !jwtConfig?.refreshSecret) {
      throw new Error('JWT secrets must be configured');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtConfig.accessSecret,
        expiresIn: jwtConfig.accessExpiration,
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtConfig.refreshSecret,
        expiresIn: jwtConfig.refreshExpiration,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    const jwtConfig = this.configService.get('jwt', { infer: true });

    if (!jwtConfig?.accessSecret) {
      throw new Error('JWT access secret must be configured');
    }

    return this.jwtService.verifyAsync(token, {
      secret: jwtConfig.accessSecret,
    });
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    const jwtConfig = this.configService.get('jwt', { infer: true });

    if (!jwtConfig?.refreshSecret) {
      throw new Error('JWT refresh secret must be configured');
    }

    return this.jwtService.verifyAsync(token, {
      secret: jwtConfig.refreshSecret,
    });
  }

  extractTokenFromHeader(authHeader: string): string | null {
    const [type, token] = authHeader?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
