# Swagger API Documentation Usage Guide

This guide explains how to use the interactive Swagger documentation for the NestJS Starter Template API.

## Accessing Swagger Documentation

Once your application is running, visit:
**http://localhost:3000/api**

## Swagger Features

### 🔍 **Interactive API Explorer**
- View all available endpoints organized by tags (Authentication, S3)
- See detailed request/response schemas
- Test endpoints directly from the browser
- View example requests and responses

### 🔐 **JWT Authentication**
- Click the "Authorize" button in the top-right corner
- Enter your JWT access token in the format: `Bearer your-token-here`
- All protected endpoints will automatically include the authorization header

### 📋 **Comprehensive Documentation**
- Request/response body schemas
- Query parameter descriptions
- HTTP status codes and their meanings
- Example values for all fields

## Using Swagger UI

### 1. **Testing Authentication Flow**

#### Register a New User
1. Navigate to the "Authentication" section
2. Click on `POST /auth/register`
3. Click "Try it out"
4. Fill in the request body:
```json
{
  "email": "john.doe@example.com",
  "username": "johndoe123",
  "password": "StrongPass123",
  "firstName": "John",
  "lastName": "Doe"
}
```
5. Click "Execute"
6. Copy the `accessToken` from the response

#### Authorize Future Requests
1. Click the "Authorize" button at the top
2. Enter: `Bearer YOUR_ACCESS_TOKEN_HERE`
3. Click "Authorize"
4. All subsequent requests will include authentication

### 2. **Testing Protected Endpoints**

#### Get User Profile
1. With authentication set up, navigate to `GET /auth/me`
2. Click "Try it out" → "Execute"
3. View your user profile in the response

#### Upload a File to S3
1. Navigate to `POST /s3/upload`
2. Click "Try it out"
3. Choose a file using the file picker
4. Optionally specify a folder name
5. Click "Execute"
6. View the file URL and metadata in the response

### 3. **Understanding Response Schemas**

Each endpoint shows:
- **Request Schema**: What data you need to send
- **Response Schema**: What data you'll receive
- **Error Schemas**: What errors might occur

#### User Model Example
```json
{
  "id": "clxx1234567890",
  "email": "john.doe@example.com",
  "username": "johndoe123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Token Response Example
```json
{
  "user": { /* User object */ },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. **Error Handling**

Swagger shows all possible error responses:

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Insufficient permissions (wrong role)
- **409 Conflict**: Resource already exists (duplicate email/username)

## API Endpoints Overview

### Authentication Endpoints (`/auth`)
- **POST /auth/register**: Create new user account
- **POST /auth/login**: User authentication
- **POST /auth/refresh**: Refresh access tokens
- **POST /auth/logout**: Logout from single device
- **POST /auth/logout-all**: Logout from all devices
- **GET /auth/me**: Get current user profile
- **GET /auth/admin-only**: Admin role required
- **GET /auth/moderator-or-admin**: Moderator or admin role required

### S3 File Operations (`/s3`)
- **POST /s3/upload**: Upload file to S3 bucket
- **DELETE /s3/delete**: Delete file from S3 bucket
- **GET /s3/presigned-url**: Generate download URL
- **POST /s3/presigned-upload-url**: Generate upload URL for client-side uploads

## Schema Definitions

### Core Models

#### RegisterDto
```json
{
  "email": "user@example.com",
  "username": "username123",
  "password": "StrongPass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### LoginDto
```json
{
  "email": "user@example.com",
  "password": "StrongPass123"
}
```

#### S3UploadResponse
```json
{
  "key": "uploads/uuid-filename.jpg",
  "url": "https://bucket.s3.region.amazonaws.com/uploads/uuid-filename.jpg",
  "bucket": "your-bucket-name"
}
```

## Best Practices for API Testing

### 1. **Authentication Workflow**
1. Register a new user or login
2. Copy the access token from response
3. Use "Authorize" button to set Bearer token
4. Test protected endpoints

### 2. **File Upload Testing**
1. Ensure you're authenticated
2. Use small test files initially
3. Check the returned URL works
4. Test different file types and folders

### 3. **Error Testing**
- Try requests without authentication
- Send invalid data to see validation errors
- Test role-based access with different user roles

### 4. **Role-Based Testing**
Create users with different roles to test:
- Regular user access (`USER` role)
- Admin functions (`ADMIN` role)
- Moderator functions (`MODERATOR` role)

## Development Tips

### 1. **Swagger Decorators**
When adding new endpoints, use these decorators:
```typescript
@ApiTags('YourTag')
@ApiOperation({ summary: 'Brief description' })
@ApiResponse({ status: 200, type: ResponseDto })
@ApiBearerAuth('access-token') // For protected routes
```

### 2. **DTO Documentation**
Document your DTOs with:
```typescript
@ApiProperty({
  description: 'Field description',
  example: 'Example value',
  required: false, // if optional
})
```

### 3. **Testing with curl**
You can copy curl commands from Swagger:
1. Execute any request in Swagger
2. Look for the "curl" section in the response
3. Copy the generated curl command

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if you clicked "Authorize" and entered a valid token
   - Ensure token starts with "Bearer "
   - Check if token has expired (15 minutes for access tokens)

2. **403 Forbidden**
   - User doesn't have required role
   - Check endpoint role requirements

3. **400 Bad Request**
   - Invalid request data
   - Check required fields and data formats
   - Review validation rules in schema

4. **File Upload Issues**
   - Ensure S3 credentials are configured
   - Check bucket permissions
   - Verify file size limits

### Getting Help

- All endpoints have detailed descriptions in Swagger
- Check the example values provided
- Review the schema definitions for required fields
- Test with minimal valid data first

The Swagger documentation is automatically generated from your code and stays up-to-date with any changes you make to the API!