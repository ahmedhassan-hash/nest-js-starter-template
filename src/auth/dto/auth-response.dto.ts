import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique user identifier',
    example: 'clxx1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Unique username',
    example: 'johndoe123',
  })
  username: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    nullable: true,
  })
  firstName: string | null;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    nullable: true,
  })
  lastName: string | null;

  @ApiProperty({
    description: 'User role',
    example: 'USER',
    enum: Role,
  })
  role: Role;

  @ApiProperty({
    description: 'Account status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last account update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class TokenPairDto {
  @ApiProperty({
    description: 'JWT access token (expires in 15 minutes)',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbHh4MTIzNCIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6ImpvaG5kb2UxMjMiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwNDEwMTIwMCwiZXhwIjoxNzA0MTAyMTAwfQ.example-signature',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token (expires in 7 days)',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbHh4MTIzNCIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6ImpvaG5kb2UxMjMiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwNDEwMTIwMCwiZXhwIjoxNzA0NzA2MDAwfQ.example-refresh-signature',
  })
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'User information without password',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'JWT access and refresh tokens',
    type: TokenPairDto,
  })
  tokens: TokenPairDto;
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'This is an admin-only endpoint',
  })
  message: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 401,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Unauthorized',
  })
  message: string;

  @ApiProperty({
    description: 'Error type',
    example: 'Unauthorized',
  })
  error: string;
}
