import {
  Controller,
  Post,
  Delete,
  Get,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { S3Service, UploadResult, PreSignedUrlResult } from './s3.service';
import {
  S3UploadResponseDto,
  S3PreSignedUrlResponseDto,
  S3PreSignedUploadUrlDto,
} from './dto/s3-response.dto';
import { ErrorResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('S3')
@Controller('s3')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload file to S3',
    description:
      'Upload a file to AWS S3 bucket. Returns the file URL and metadata.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload with optional folder',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
        folder: {
          type: 'string',
          description: 'Optional folder name to organize files',
          example: 'uploads',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: S3UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'No file provided or invalid file',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
    type: ErrorResponseDto,
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return await this.s3Service.uploadFile(file, folder);
  }

  @Delete('delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete file from S3',
    description: 'Delete a file from AWS S3 bucket using its key.',
  })
  @ApiQuery({
    name: 'key',
    description: 'S3 object key/path of the file to delete',
    example: 'uploads/uuid-file.jpg',
  })
  @ApiResponse({
    status: 204,
    description: 'File deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'File key is required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
    type: ErrorResponseDto,
  })
  async deleteFile(@Query('key') key: string): Promise<void> {
    if (!key) {
      throw new BadRequestException('File key is required');
    }

    await this.s3Service.deleteFile(key);
  }

  @Get('presigned-url')
  @ApiOperation({
    summary: 'Generate pre-signed URL for file download',
    description: 'Generate a temporary URL to download a file from S3.',
  })
  @ApiQuery({
    name: 'key',
    description: 'S3 object key/path of the file',
    example: 'uploads/uuid-file.jpg',
  })
  @ApiQuery({
    name: 'expiresIn',
    description: 'URL expiration time in seconds',
    example: 3600,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Pre-signed URL generated successfully',
    type: S3PreSignedUrlResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'File key is required or invalid expiresIn value',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
    type: ErrorResponseDto,
  })
  async generatePreSignedUrl(
    @Query('key') key: string,
    @Query('expiresIn') expiresIn?: string,
  ): Promise<PreSignedUrlResult> {
    if (!key) {
      throw new BadRequestException('File key is required');
    }

    const expires = expiresIn ? parseInt(expiresIn, 10) : 3600;

    if (isNaN(expires) || expires <= 0) {
      throw new BadRequestException('Invalid expiresIn value');
    }

    return await this.s3Service.generatePreSignedUrl(key, expires);
  }

  @Post('presigned-upload-url')
  @ApiOperation({
    summary: 'Generate pre-signed URL for file upload',
    description:
      'Generate a temporary URL that allows direct upload to S3 from client-side.',
  })
  @ApiBody({
    type: S3PreSignedUploadUrlDto,
    description: 'File information for generating upload URL',
  })
  @ApiResponse({
    status: 200,
    description: 'Pre-signed upload URL generated successfully',
    type: S3PreSignedUrlResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'fileName and contentType are required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
    type: ErrorResponseDto,
  })
  async generatePreSignedUploadUrl(
    @Body() dto: S3PreSignedUploadUrlDto,
  ): Promise<PreSignedUrlResult> {
    if (!dto.fileName || !dto.contentType) {
      throw new BadRequestException('fileName and contentType are required');
    }

    const expiresIn = dto.expiresIn && dto.expiresIn > 0 ? dto.expiresIn : 3600;

    return await this.s3Service.generatePreSignedUploadUrl(
      dto.fileName,
      dto.contentType,
      dto.folder,
      expiresIn,
    );
  }
}
