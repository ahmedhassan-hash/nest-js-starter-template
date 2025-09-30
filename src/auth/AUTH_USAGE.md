# Authentication System Usage Guide

This guide covers the complete authentication system with JWT tokens, role-based access control, and database integration.

## Quick Setup

1. **Database Migration:**
```bash
npx prisma migrate dev --name init
```

2. **Generate Prisma Client:**
```bash
npx prisma generate
```

3. **Set Environment Variables:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nestjs_starter?schema=public"
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
```

## Authentication Flow

### 1. User Registration
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "username": "johndoe",
    "password": "Password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "clxxxxx",
    "email": "john@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. User Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### 3. Token Refresh
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token-here"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Get User Profile
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer your-access-token"
```

### 5. Logout
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token-here"
  }'
```

### 6. Logout from All Devices
```bash
curl -X POST http://localhost:3000/auth/logout-all \
  -H "Authorization: Bearer your-access-token"
```

## Role-Based Access Control

### Available Roles
- **USER**: Default role for new users
- **ADMIN**: Full access to all resources
- **MODERATOR**: Limited administrative access

### Role-Protected Endpoints

#### Admin Only
```bash
curl -X GET http://localhost:3000/auth/admin-only \
  -H "Authorization: Bearer admin-access-token"
```

#### Moderator or Admin
```bash
curl -X GET http://localhost:3000/auth/moderator-or-admin \
  -H "Authorization: Bearer moderator-or-admin-access-token"
```

## Using Authentication in Your Controllers

### Basic Authentication
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { GetUser } from './auth/decorators/user.decorator';

@Controller('users')
export class UserController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@GetUser() user: User) {
    return user;
  }

  @Get('profile-id')
  @UseGuards(JwtAuthGuard)
  async getProfileById(@GetUser('id') userId: string) {
    return { userId };
  }
}
```

### Role-Based Access
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
export class AdminController {
  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllUsers() {
    // Only admins can access this
    return 'All users data';
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  async getStats() {
    // Admins and moderators can access this
    return 'Statistics data';
  }
}
```

## Password Requirements

Passwords must meet the following criteria:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Username Requirements

Usernames must:
- Be at least 3 characters long
- Contain only letters, numbers, and underscores
- Be unique across the system

## Token Expiration

- **Access Token**: 15 minutes (configurable via `JWT_ACCESS_EXPIRATION`)
- **Refresh Token**: 7 days (configurable via `JWT_REFRESH_EXPIRATION`)

## Security Features

### Password Hashing
- Uses bcrypt with 12 salt rounds
- Passwords are never stored in plain text

### Token Security
- JWT tokens are signed with separate secrets for access and refresh tokens
- Refresh tokens are stored in the database and can be revoked
- Tokens include user role for authorization

### Account Security
- Accounts can be deactivated (`isActive: false`)
- Inactive accounts cannot authenticate
- Multiple device logout support

## Database Operations

### Create Admin User (via Service)
```typescript
// In your service or migration
async createAdminUser() {
  const adminUser = await this.authService.register({
    email: 'admin@example.com',
    username: 'admin',
    password: 'AdminPassword123',
    firstName: 'Admin',
    lastName: 'User'
  });

  // Update role to admin
  await this.authService.updateUserRole(adminUser.user.id, Role.ADMIN);
}
```

### Update User Role
```typescript
// Only admins can update user roles
await this.authService.updateUserRole(userId, Role.MODERATOR);
```

### Cleanup Expired Tokens
```typescript
// Clean up expired refresh tokens (can be run as a cron job)
await this.authService.cleanupExpiredTokens();
```

## Error Handling

Common authentication errors:

- `401 Unauthorized`: Invalid credentials or expired token
- `403 Forbidden`: Insufficient permissions (wrong role)
- `409 Conflict`: Email or username already exists
- `400 Bad Request`: Validation errors (weak password, invalid email, etc.)

## Best Practices

1. **Store tokens securely** on the client (httpOnly cookies recommended for web apps)
2. **Implement token refresh** before access tokens expire
3. **Use HTTPS** in production
4. **Rotate JWT secrets** regularly in production
5. **Implement rate limiting** for authentication endpoints
6. **Log authentication events** for security monitoring
7. **Use strong, unique JWT secrets** in production

## Testing Authentication

### Test with curl
```bash
# 1. Register
ACCESS_TOKEN=$(curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Password123"}' \
  | jq -r '.tokens.accessToken')

# 2. Use token to access protected endpoint
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Integration Tests
```typescript
describe('Authentication', () => {
  it('should register a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123'
      })
      .expect(201);

    expect(response.body).toHaveProperty('tokens');
    expect(response.body.user).not.toHaveProperty('password');
  });
});
```