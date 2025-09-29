import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtTokenService } from './jwt.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}), // Configuration is handled in JwtTokenService
    ConfigModule,
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtTokenService, JwtStrategy],
  exports: [AuthService, JwtTokenService, PassportModule],
})
export class AuthModule {}
