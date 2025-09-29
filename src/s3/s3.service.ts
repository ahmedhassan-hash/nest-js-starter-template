import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import type { AppConfig } from '../config/configuration';

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}

export interface PreSignedUrlResult {
  url: string;
  expiresIn: number;
}

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private configService: ConfigService<AppConfig>) {
    const awsConfig = this.configService.get('aws', { infer: true });

    if (
      !awsConfig?.accessKeyId ||
      !awsConfig?.secretAccessKey ||
      !awsConfig?.s3BucketName
    ) {
      throw new Error('AWS credentials and S3 bucket name must be configured');
    }

    this.s3Client = new S3Client({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
    });

    this.bucketName = awsConfig.s3BucketName;
    this.region = awsConfig.region;
  }

  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadResult> {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const key = folder ? `${folder}/${fileName}` : fileName;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: 'inline',
      });

      await this.s3Client.send(command);

      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        key,
        url,
        bucket: this.bucketName,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error uploading file: ${errorMessage}`);
      throw new Error(`Failed to upload file: ${errorMessage}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting file: ${errorMessage}`);
      throw new Error(`Failed to delete file: ${errorMessage}`);
    }
  }

  async generatePreSignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<PreSignedUrlResult> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      this.logger.log(`Pre-signed URL generated for: ${key}`);

      return {
        url,
        expiresIn,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error generating pre-signed URL: ${errorMessage}`);
      throw new Error(`Failed to generate pre-signed URL: ${errorMessage}`);
    }
  }

  async generatePreSignedUploadUrl(
    fileName: string,
    contentType: string,
    folder?: string,
    expiresIn: number = 3600,
  ): Promise<PreSignedUrlResult> {
    try {
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const key = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      this.logger.log(`Pre-signed upload URL generated for: ${key}`);

      return {
        url,
        expiresIn,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error generating pre-signed upload URL: ${errorMessage}`,
      );
      throw new Error(
        `Failed to generate pre-signed upload URL: ${errorMessage}`,
      );
    }
  }
}
