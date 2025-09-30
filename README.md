# NestJS Starter Template

A complete NestJS starter template with authentication, database, AWS S3, WebSockets, and Stripe payment integration.

## Features

✅ **Complete Authentication System**
- JWT-based authentication with access & refresh tokens
- User registration and login
- Role-based access control (USER, ADMIN, MODERATOR)
- Protected routes and guards
- Password hashing with bcrypt
- Token refresh mechanism

✅ **Database Integration**
- PostgreSQL with Prisma ORM
- Type-safe database queries
- Database migrations and schema management
- User and refresh token models
- Connection ready for local and production databases

✅ **Complete S3 Integration**
- File upload with automatic UUID naming
- File deletion
- Pre-signed URL generation for downloads
- Pre-signed URL generation for uploads
- Configurable folder organization
- TypeScript support with proper typing

✅ **WebSocket Implementation**
- Real-time communication with Socket.IO
- JWT authentication for WebSocket connections
- Active user tracking and management
- Room-based messaging
- Broadcasting to all users, specific users, or roles
- WebSocket REST API for management

✅ **Stripe Payment Integration**
- Checkout session creation for payments and subscriptions
- Customer management (create, retrieve, update)
- Subscription lifecycle management (create, update, cancel)
- Webhook handling for Stripe events
- Invoice and payment method management
- Support for both one-time payments and recurring subscriptions

✅ **Cron Job Management**
- Dynamic cron job creation and management
- Start, stop, and delete jobs programmatically
- Decorator-based scheduling for static jobs
- Job status monitoring and tracking
- Support for custom timezones
- Built-in logging and error handling

✅ **Production Ready**
- Environment-based configuration
- Comprehensive error handling and logging
- Input validation with class-validator
- ESLint and Prettier configured
- TypeScript strict mode
- Global validation pipes
- OpenAPI/Swagger documentation

✅ **Developer Friendly**
- Well-structured modular architecture
- Comprehensive documentation
- Example usage patterns
- Easy to extend and customize

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up PostgreSQL:**
   - Install PostgreSQL locally or use a cloud provider
   - Create a database named `nestjs_starter`

3. **Configure environment variables:**
   Update `.env` with your configuration:
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nestjs_starter?schema=public"

   # JWT Configuration
   JWT_ACCESS_SECRET=your-jwt-access-secret-key
   JWT_REFRESH_SECRET=your-jwt-refresh-secret-key
   JWT_ACCESS_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d

   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=your-bucket-name

   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
   STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
   STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret

   # Application Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. **Run database migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Start the application:**
   ```bash
   npm run start:dev
   ```

## 📚 API Documentation

Once the application is running, you can access the interactive Swagger documentation at:

**http://localhost:3000/api**

The Swagger UI provides:
- Complete API endpoint documentation
- Request/response examples for all endpoints
- Interactive testing interface
- JWT authentication support (click "Authorize" to add your token)
- Schema definitions for all DTOs and models

## API Endpoints

### Authentication Endpoints

#### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}
```

#### Refresh Token
```bash
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Get Profile (Protected)
```bash
GET /auth/me
Authorization: Bearer your-access-token
```

#### Admin Only Endpoint (Protected)
```bash
GET /auth/admin-only
Authorization: Bearer your-access-token
```

### S3 Endpoints

#### Upload File
```bash
POST /s3/upload
Authorization: Bearer your-access-token
Content-Type: multipart/form-data

curl -X POST \
  -H "Authorization: Bearer your-access-token" \
  -F "file=@/path/to/file.jpg" \
  -F "folder=uploads" \
  http://localhost:3000/s3/upload
```

#### Delete File
```bash
DELETE /s3/delete?key=uploads/uuid.jpg
Authorization: Bearer your-access-token
```

#### Generate Download URL
```bash
GET /s3/presigned-url?key=uploads/uuid.jpg&expiresIn=3600
Authorization: Bearer your-access-token
```

#### Generate Upload URL
```bash
POST /s3/presigned-upload-url
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "fileName": "document.pdf",
  "contentType": "application/pdf",
  "folder": "documents",
  "expiresIn": 3600
}
```

## Usage in Your Services

### Authentication in Services
```typescript
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { S3Service } from './s3/s3.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { GetUser } from './auth/decorators/user.decorator';
import { UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private readonly authService: AuthService,
    private readonly s3Service: S3Service,
  ) {}

  @UseGuards(JwtAuthGuard)
  async uploadProfilePicture(
    @GetUser('id') userId: string,
    file: Express.Multer.File,
  ) {
    return await this.s3Service.uploadFile(file, `profiles/${userId}`);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async adminOnlyFunction() {
    // This function can only be called by admins
    return 'Admin only data';
  }
}
```

## Project Structure

```
src/
├── auth/
│   ├── decorators/
│   │   ├── roles.decorator.ts   # Role-based access decorator
│   │   └── user.decorator.ts    # User extraction decorator
│   ├── dto/
│   │   └── auth.dto.ts         # Authentication DTOs
│   ├── guards/
│   │   ├── jwt-auth.guard.ts   # JWT authentication guard
│   │   └── roles.guard.ts      # Role-based authorization guard
│   ├── strategies/
│   │   └── jwt.strategy.ts     # JWT passport strategy
│   ├── auth.controller.ts      # Authentication endpoints
│   ├── auth.service.ts         # Authentication business logic
│   ├── auth.module.ts          # Authentication module
│   └── jwt.service.ts          # JWT token management
├── config/
│   └── configuration.ts        # Environment configuration with types
├── prisma/
│   ├── prisma.service.ts       # Prisma ORM service
│   └── prisma.module.ts        # Prisma module (global)
├── s3/
│   ├── s3.controller.ts        # S3 API endpoints
│   ├── s3.service.ts           # S3 operations service
│   ├── s3.module.ts            # S3 module
│   └── s3-example.service.ts   # Usage examples
├── websocket/
│   ├── guards/
│   │   └── ws-jwt.guard.ts     # WebSocket JWT authentication guard
│   ├── interfaces/
│   │   └── socket-user.interface.ts # Socket user interface
│   ├── websocket.gateway.ts    # WebSocket gateway
│   ├── socket-manager.service.ts # Socket connection management
│   ├── websocket.controller.ts # WebSocket REST API
│   ├── websocket.module.ts     # WebSocket module
│   └── README.md               # WebSocket documentation
├── stripe/
│   ├── dto/
│   │   ├── create-checkout-session.dto.ts
│   │   ├── create-customer.dto.ts
│   │   ├── create-subscription.dto.ts
│   │   ├── update-subscription.dto.ts
│   │   └── cancel-subscription.dto.ts
│   ├── stripe.service.ts       # Core Stripe operations
│   ├── stripe.controller.ts    # Stripe API endpoints
│   ├── stripe-webhook.service.ts # Webhook event handling
│   ├── stripe.module.ts        # Stripe module
│   └── README.md               # Stripe documentation
├── cron/
│   ├── cron.service.ts         # Cron job management service
│   ├── cron.module.ts          # Cron module
│   └── cron-example.service.ts # Usage examples
├── app.controller.ts
├── app.service.ts
├── app.module.ts               # Main app module
└── main.ts                     # Application entry point

prisma/
└── schema.prisma               # Database schema definition
```

## Available Scripts

- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run build` - Build the application
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- **Swagger Documentation**: Available at `http://localhost:3000/api` when running

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_ACCESS_SECRET` | JWT access token secret | Yes | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Yes | - |
| `JWT_ACCESS_EXPIRATION` | Access token expiry time | No | `15m` |
| `JWT_REFRESH_EXPIRATION` | Refresh token expiry time | No | `7d` |
| `AWS_ACCESS_KEY_ID` | AWS Access Key ID | Yes | - |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key | Yes | - |
| `AWS_REGION` | AWS Region | No | `us-east-1` |
| `AWS_S3_BUCKET_NAME` | S3 Bucket Name | Yes | - |
| `STRIPE_SECRET_KEY` | Stripe secret key (test: sk_test_...) | Yes | - |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (test: pk_test_...) | Yes | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes | - |
| `PORT` | Application port | No | `3000` |
| `NODE_ENV` | Environment | No | `development` |

## Available Service Methods

### Authentication Service
- `register(registerDto)` - Register a new user
- `login(loginDto)` - Login user and return tokens
- `refreshTokens(refreshToken)` - Refresh access token
- `logout(refreshToken)` - Logout user (invalidate refresh token)
- `logoutAll(userId)` - Logout user from all devices
- `getUserById(id)` - Get user by ID
- `updateUserRole(userId, role)` - Update user role (admin only)

### S3 Service Methods
- `uploadFile(file, folder?)` - Upload a file to S3
- `deleteFile(key)` - Delete a file from S3
- `generatePreSignedUrl(key, expiresIn?)` - Generate download URL
- `generatePreSignedUploadUrl(fileName, contentType, folder?, expiresIn?)` - Generate upload URL

### WebSocket Service Methods
- `addUser(socket, user)` - Add authenticated user to active connections
- `removeUser(socketId)` - Remove user from active connections
- `getAllActiveUsers()` - Get list of all connected users
- `sendToUser(userId, event, data)` - Send message to specific user
- `broadcastToAll(event, data)` - Broadcast message to all users
- `broadcastToRole(role, event, data)` - Send message to users with specific role

### Stripe Service Methods
- `createCheckoutSession(params)` - Create payment/subscription checkout session
- `createCustomer(params)` - Create Stripe customer
- `createSubscription(params)` - Create subscription
- `updateSubscription(subscriptionId, params)` - Update subscription
- `cancelSubscription(subscriptionId, immediately?)` - Cancel subscription
- `getCustomerSubscriptions(customerId)` - Get customer's subscriptions
- `getInvoices(customerId)` - Get customer's invoices

### Cron Service Methods
- `addCronJob(name, cronTime, callback, timezone?)` - Dynamically add a cron job
- `deleteCronJob(name)` - Remove a cron job
- `stopCronJob(name)` - Stop a cron job without removing it
- `startCronJob(name)` - Start a previously stopped cron job
- `getCronJobs()` - Get list of all registered cron job names
- `cronJobExists(name)` - Check if a cron job exists
- `getCronJobStatus(name)` - Get detailed status of a specific cron job
- `getAllCronJobsStatus()` - Get status of all registered cron jobs

## Cron Job Usage Examples

### Using the Cron Service Directly
```typescript
import { Injectable } from '@nestjs/common';
import { CronService } from './cron/cron.service';

@Injectable()
export class TaskService {
  constructor(private cronService: CronService) {}

  setupDailyCleanup() {
    this.cronService.addCronJob(
      'daily-cleanup',
      '0 0 * * *', // Every day at midnight
      () => {
        console.log('Running daily cleanup...');
        // Your cleanup logic here
      },
      'UTC'
    );
  }

  setupHourlySync() {
    this.cronService.addCronJob(
      'hourly-sync',
      '0 * * * *', // Every hour
      async () => {
        console.log('Running hourly sync...');
        // Your sync logic here
      }
    );
  }

  manageJobs() {
    // Stop a job
    this.cronService.stopCronJob('daily-cleanup');

    // Start a job
    this.cronService.startCronJob('daily-cleanup');

    // Get job status
    const status = this.cronService.getCronJobStatus('daily-cleanup');
    console.log(status);
    // { name: 'daily-cleanup', running: true, lastDate: Date, nextDate: Date }

    // Get all jobs
    const allJobs = this.cronService.getAllCronJobsStatus();

    // Delete a job
    this.cronService.deleteCronJob('daily-cleanup');
  }
}
```

### Using Cron Decorators (Static Jobs)
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  // Run every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleDailyTask() {
    this.logger.debug('Running daily task at midnight');
    // Your logic here
  }

  // Run every 30 minutes
  @Cron('0 */30 * * * *')
  handleEvery30Minutes() {
    this.logger.debug('Running task every 30 minutes');
    // Your logic here
  }

  // Run every Monday at 9 AM
  @Cron('0 0 9 * * 1')
  handleWeeklyReport() {
    this.logger.debug('Generating weekly report');
    // Your logic here
  }
}
```

### Cron Expression Examples
```
'0 0 * * * *'       // Every hour
'0 */30 * * * *'    // Every 30 minutes
'0 0 0 * * *'       // Every day at midnight
'0 0 9 * * 1-5'     // Weekdays at 9 AM
'0 0 0 1 * *'       // First day of every month at midnight
'0 0 12 * * 0'      // Every Sunday at noon
```

### Available CronExpression Constants
- `CronExpression.EVERY_SECOND` - Every second
- `CronExpression.EVERY_5_SECONDS` - Every 5 seconds
- `CronExpression.EVERY_10_SECONDS` - Every 10 seconds
- `CronExpression.EVERY_30_SECONDS` - Every 30 seconds
- `CronExpression.EVERY_MINUTE` - Every minute
- `CronExpression.EVERY_5_MINUTES` - Every 5 minutes
- `CronExpression.EVERY_10_MINUTES` - Every 10 minutes
- `CronExpression.EVERY_30_MINUTES` - Every 30 minutes
- `CronExpression.EVERY_HOUR` - Every hour
- `CronExpression.EVERY_DAY_AT_MIDNIGHT` - Every day at 00:00
- `CronExpression.EVERY_WEEK` - Every week
- `CronExpression.EVERY_MONTH` - Every month
- `CronExpression.EVERY_YEAR` - Every year

## Database Schema

### User Model
```typescript
interface User {
  id: string;           // CUID
  email: string;        // Unique
  username: string;     // Unique
  password: string;     // Hashed with bcrypt
  firstName?: string;
  lastName?: string;
  role: Role;           // USER | ADMIN | MODERATOR
  isActive: boolean;    // Default: true
  createdAt: Date;
  updatedAt: Date;
}
```

### Roles
- `USER` - Default role for new users
- `ADMIN` - Full access to all resources
- `MODERATOR` - Limited admin access

## Documentation Files

- **README.md**: Main project documentation and quick start guide
- **src/websocket/README.md**: WebSocket implementation guide and examples
- **src/stripe/README.md**: Stripe payment integration documentation
- **Interactive Swagger Documentation**: Available at `http://localhost:3000/api` when running

## Getting Stripe Credentials

1. **Create a Stripe Account**: Sign up at [stripe.com](https://stripe.com)

2. **Get Test Keys**: Go to [Stripe Dashboard → API Keys](https://dashboard.stripe.com/test/apikeys)
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Copy your **Secret key** (starts with `sk_test_`)

3. **Set up Webhooks**:
   - Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
   - Create endpoint: `https://yourdomain.com/stripe/webhooks`
   - For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli):
     ```bash
     stripe listen --forward-to localhost:3000/stripe/webhooks
     ```
   - Copy the webhook signing secret (starts with `whsec_`)

4. **Update Environment Variables**: Replace the placeholder values in your `.env` file

## License

This project is licensed under the UNLICENSED License.
