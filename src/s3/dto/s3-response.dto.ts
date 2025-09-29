import { ApiProperty } from '@nestjs/swagger';

export class S3UploadResponseDto {
  @ApiProperty({
    description: 'The S3 object key/path',
    example: 'uploads/uuid-file.jpg',
  })
  key: string;

  @ApiProperty({
    description: 'Public URL to access the uploaded file',
    example:
      'https://your-bucket.s3.us-east-1.amazonaws.com/uploads/uuid-file.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'S3 bucket name where file was uploaded',
    example: 'your-bucket-name',
  })
  bucket: string;
}

export class S3PreSignedUrlResponseDto {
  @ApiProperty({
    description: 'Pre-signed URL for accessing the file',
    example:
      'https://your-bucket.s3.amazonaws.com/uploads/uuid-file.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...',
  })
  url: string;

  @ApiProperty({
    description: 'URL expiration time in seconds',
    example: 3600,
  })
  expiresIn: number;
}

export class S3PreSignedUploadUrlDto {
  @ApiProperty({
    description: 'Original filename with extension',
    example: 'document.pdf',
  })
  fileName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf',
  })
  contentType: string;

  @ApiProperty({
    description: 'Optional folder to organize files',
    example: 'documents',
    required: false,
  })
  folder?: string;

  @ApiProperty({
    description: 'URL expiration time in seconds',
    example: 3600,
    required: false,
    default: 3600,
  })
  expiresIn?: number;
}
