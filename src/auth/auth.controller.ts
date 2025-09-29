import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import {
  AuthResponseDto,
  TokenPairDto,
  UserResponseDto,
  MessageResponseDto,
  ErrorResponseDto,
} from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { GetUser } from './decorators/user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register new user',
    description:
      'Create a new user account with email, username, and password. Returns user info and JWT tokens.',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email or username already exists',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    type: ErrorResponseDto,
  })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email and password. Returns user info and JWT tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or account disabled',
    type: ErrorResponseDto,
  })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Generate new access and refresh tokens using a valid refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens successfully refreshed',
    type: TokenPairDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
    type: ErrorResponseDto,
  })
  @ApiBody({ type: RefreshTokenDto })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Logout user',
    description:
      'Invalidate a specific refresh token to logout from a single device.',
  })
  @ApiResponse({
    status: 204,
    description: 'Successfully logged out',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing access token',
    type: ErrorResponseDto,
  })
  @ApiBody({ type: RefreshTokenDto })
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    await this.authService.logout(refreshTokenDto.refreshToken);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Invalidate all refresh tokens for the authenticated user.',
  })
  @ApiResponse({
    status: 204,
    description: 'Successfully logged out from all devices',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing access token',
    type: ErrorResponseDto,
  })
  async logoutAll(@GetUser('id') userId: string) {
    await this.authService.logoutAll(userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get current user profile',
    description: "Retrieve the authenticated user's profile information.",
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing access token',
    type: ErrorResponseDto,
  })
  async getProfile(@GetUser('id') userId: string) {
    const user = await this.authService.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Admin-only endpoint',
    description: 'Example endpoint that requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Access granted for admin user',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing access token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (not admin)',
    type: ErrorResponseDto,
  })
  adminOnly() {
    return { message: 'This is an admin-only endpoint' };
  }

  @Get('moderator-or-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Moderator or admin endpoint',
    description: 'Example endpoint that requires MODERATOR or ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Access granted for moderator or admin user',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing access token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (not moderator or admin)',
    type: ErrorResponseDto,
  })
  moderatorOrAdmin() {
    return { message: 'This endpoint is for moderators and admins' };
  }
}
