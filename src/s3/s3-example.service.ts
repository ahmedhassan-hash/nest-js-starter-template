import { Injectable } from '@nestjs/common';
import { S3Service } from './s3.service';

@Injectable()
export class S3ExampleService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadUserAvatar(file: Express.Multer.File, userId: string) {
    return await this.s3Service.uploadFile(file, `avatars/${userId}`);
  }

  async uploadDocument(file: Express.Multer.File) {
    return await this.s3Service.uploadFile(file, 'documents');
  }

  async deleteUserFile(key: string) {
    await this.s3Service.deleteFile(key);
  }

  async getFileDownloadUrl(key: string, expiresInHours: number = 1) {
    const expiresIn = expiresInHours * 3600; // Convert hours to seconds
    return await this.s3Service.generatePreSignedUrl(key, expiresIn);
  }

  async getUploadUrl(fileName: string, contentType: string, folder?: string) {
    return await this.s3Service.generatePreSignedUploadUrl(
      fileName,
      contentType,
      folder,
      3600, // 1 hour expiry
    );
  }
}
