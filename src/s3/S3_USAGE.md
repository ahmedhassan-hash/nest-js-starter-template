# AWS S3 Integration Usage

This NestJS starter template includes complete AWS S3 integration with the following features:

## Environment Variables

Make sure to set the following environment variables in your `.env` file:

```env
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
```

## API Endpoints

### 1. Upload File
**POST** `/s3/upload`

Upload a file to S3 bucket.

```bash
curl -X POST \
  -F "file=@/path/to/your/file.jpg" \
  -F "folder=images" \
  http://localhost:3000/s3/upload
```

Response:
```json
{
  "key": "images/uuid.jpg",
  "url": "https://your-bucket.s3.us-east-1.amazonaws.com/images/uuid.jpg",
  "bucket": "your-bucket-name"
}
```

### 2. Delete File
**DELETE** `/s3/delete?key=file-key`

Delete a file from S3 bucket.

```bash
curl -X DELETE "http://localhost:3000/s3/delete?key=images/uuid.jpg"
```

### 3. Generate Pre-signed URL for Download
**GET** `/s3/presigned-url?key=file-key&expiresIn=3600`

Generate a pre-signed URL to download a file.

```bash
curl "http://localhost:3000/s3/presigned-url?key=images/uuid.jpg&expiresIn=3600"
```

Response:
```json
{
  "url": "https://your-bucket.s3.amazonaws.com/images/uuid.jpg?X-Amz-...",
  "expiresIn": 3600
}
```

### 4. Generate Pre-signed URL for Upload
**POST** `/s3/presigned-upload-url`

Generate a pre-signed URL for direct client-side uploads.

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "image.jpg",
    "contentType": "image/jpeg",
    "folder": "uploads",
    "expiresIn": 3600
  }' \
  http://localhost:3000/s3/presigned-upload-url
```

Response:
```json
{
  "url": "https://your-bucket.s3.amazonaws.com/uploads/uuid.jpg?X-Amz-...",
  "expiresIn": 3600
}
```

## Using S3Service in Your Code

You can also inject the S3Service directly into your own services:

```typescript
import { Injectable } from '@nestjs/common';
import { S3Service } from './s3/s3.service';

@Injectable()
export class YourService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadUserAvatar(file: Express.Multer.File) {
    return await this.s3Service.uploadFile(file, 'avatars');
  }

  async deleteUserAvatar(key: string) {
    await this.s3Service.deleteFile(key);
  }

  async getUserAvatarUrl(key: string) {
    return await this.s3Service.generatePreSignedUrl(key, 86400); // 24 hours
  }
}
```

## File Structure

```
src/
├── config/
│   └── configuration.ts     # Environment configuration
├── s3/
│   ├── s3.controller.ts     # S3 API endpoints
│   ├── s3.service.ts        # S3 operations service
│   └── s3.module.ts         # S3 module
└── app.module.ts            # Main app module
```

## Features

- ✅ File upload with automatic UUID naming
- ✅ File deletion
- ✅ Pre-signed URL generation for downloads
- ✅ Pre-signed URL generation for uploads
- ✅ Configurable folder organization
- ✅ Environment-based configuration
- ✅ Error handling and logging
- ✅ TypeScript support with proper typing